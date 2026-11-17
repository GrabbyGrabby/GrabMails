import sys
import unittest
from unittest.mock import patch
sys.path.insert(0, 'scripts')
import publish_historical_releases as publisher


class HistoricalReleases(unittest.TestCase):
    def simulate(self, published='', wrong_tag=False):
        calls = []

        def run(*args):
            calls.append(args)
            if args[:2] == ('git', 'rev-parse'):
                return 'wrong' if wrong_tag else publisher.TARGETS[args[2].split('^')[0]]
            if args[:2] == ('gh', 'api'):
                return published
            return ''

        with patch.object(publisher, 'run', side_effect=run):
            if wrong_tag:
                with self.assertRaises(RuntimeError):
                    publisher.publish()
            else:
                publisher.publish()
        return calls

    def test_creates_three_releases_without_touching_tags(self):
        calls = self.simulate()
        self.assertEqual([a[3] for a in calls if a[:3] == ('gh', 'release', 'create')], list(publisher.TARGETS))
        self.assertFalse(any(a[:2] == ('git', 'tag') for a in calls))

    def test_retry_skips_existing_and_preserves_newer_latest(self):
        calls = self.simulate('v1.0.0\nv1.3.0')
        self.assertEqual([a[3] for a in calls if a[:3] == ('gh', 'release', 'create')], ['v1.1.0', 'v1.2.0'])
        self.assertFalse(any(a[:3] == ('gh', 'release', 'edit') for a in calls))

    def test_incorrect_tag_prevents_publication(self):
        calls = self.simulate(wrong_tag=True)
        self.assertFalse(any(a[0] == 'gh' for a in calls))
