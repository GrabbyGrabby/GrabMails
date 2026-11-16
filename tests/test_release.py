import importlib.util
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('release', 'scripts/release.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Releases(unittest.TestCase):
    def test_versions(self):
        self.assertEqual(module.version('v1.12.0'), (1, 12, 0))
        self.assertIsNone(module.version('v1.2.0-beta'))
        self.assertIsNone(module.version('unrelated-tag'))

    def simulate(self, existing=False, fail_publish=False):
        calls = []
        tags = ['v1.0.0', 'v1.1.0', 'v1.2.0'] + (['v1.3.0'] if existing else [])

        def run(*args):
            calls.append(args)
            if args[:2] == ('git', 'rev-parse'):
                return 'target' if args[2] in ('HEAD^{commit}', 'v1.3.0^{commit}') else 'old'
            if args[:3] == ('git', 'tag', '--list'):
                return '\n'.join(tags)
            if args[:2] == ('gh', 'api'):
                return 'v1.0.0\nv1.1.0'
            if fail_publish and args[:3] == ('gh', 'release', 'create'):
                raise RuntimeError('GitHub unavailable')
            return ''

        with patch.object(module, 'run', side_effect=run):
            if fail_publish:
                with self.assertRaises(RuntimeError):
                    module.release('HEAD')
            else:
                module.release('HEAD')
        return calls

    def test_next_minor_and_backfill(self):
        calls = self.simulate()
        self.assertIn(('git', 'tag', '-a', 'v1.3.0', 'target', '-m', 'GrabMails v1.3.0'), calls)
        created = [args[3] for args in calls if args[:3] == ('gh', 'release', 'create')]
        self.assertEqual(created, ['v1.2.0', 'v1.3.0'])
        self.assertEqual(calls[-1], ('gh', 'release', 'edit', 'v1.3.0', '--latest'))

    def test_retry_reuses_tag(self):
        calls = self.simulate(existing=True)
        self.assertFalse(any(args[:3] == ('git', 'tag', '-a') for args in calls))
        self.assertIn(('git', 'push', 'origin', 'refs/tags/v1.3.0'), calls)

    def test_failure_does_not_promote_release(self):
        calls = self.simulate(fail_publish=True)
        self.assertFalse(any(args[:3] == ('gh', 'release', 'edit') for args in calls))


if __name__ == '__main__':
    unittest.main()
