#!/usr/bin/env python3
"""Publish the three requested historical releases without creating or moving tags."""
from release import HISTORICAL_NOTES, run, version

TARGETS = {
    'v1.0.0': '5489bb1273bc84c8a9775f27bcf455cd57b13f09',
    'v1.1.0': '8488b972e18d9601740bf6fcfa87a58072d8d823',
    'v1.2.0': 'bd3618ec7f4f9e9a14a472c158f38e998e0c3a89',
}


def publish():
    # Validate every existing tag before any publication takes place.
    for tag, commit in TARGETS.items():
        if run('git', 'rev-parse', f'{tag}^{{commit}}') != commit:
            raise RuntimeError(f'{tag} does not point to its expected release commit')
    published = set(run('gh', 'api', '--paginate', 'repos/{owner}/{repo}/releases', '--jq', '.[].tag_name').splitlines())
    for tag in TARGETS:
        if tag not in published:
            run('gh', 'release', 'create', tag, '--verify-tag', '--title', f'GrabMails {tag}',
                '--notes', HISTORICAL_NOTES[tag] + '\n\nThis release identifies source code; deployment is tracked separately.', '--latest=false')
    # Do not demote a newer release if this historical publication is rerun later.
    versions = [tag for tag in published | set(TARGETS) if version(tag)]
    if max(versions, key=version) == 'v1.2.0':
        run('gh', 'release', 'edit', 'v1.2.0', '--latest')
    for tag in TARGETS:
        print(run('gh', 'release', 'view', tag, '--json', 'url', '--jq', '.url'))


if __name__ == '__main__':
    publish()
