#!/usr/bin/env python3
"""Publish missing versioned releases and release the selected main-branch commit."""
import os
import re
import subprocess

VERSION = re.compile(r'^v(\d+)\.(\d+)\.(\d+)$')
HISTORICAL_NOTES = {
    'v1.0.0': 'Initial GrabMails baseline before the password and MCP authorization updates.',
    'v1.1.0': 'Require new passwords to have at least 8 characters, one number, and one special character. Apply validation to registration, password changes, and account creation. Existing passwords remain usable for login.',
    'v1.2.0': 'Require explicit per-tool authorization for MCP connections. Filter tool discovery, reject unauthorized calls, and rotate credentials when permissions change. Existing unscoped keys must be replaced. Cloudflare KV changes may take time to propagate; existing placeholder tool handlers remain placeholders.',
}


def run(*args):
    return subprocess.check_output(args, text=True).strip()


def version(tag):
    match = VERSION.fullmatch(tag)
    return tuple(map(int, match.groups())) if match else None


def release(target):
    target = run('git', 'rev-parse', f'{target}^{{commit}}')
    run('git', 'merge-base', '--is-ancestor', target, 'origin/main')
    tags = sorted((tag for tag in run('git', 'tag', '--list').splitlines() if version(tag)), key=version)
    # A retry after tag creation resumes the same release rather than incrementing.
    existing = [tag for tag in tags if run('git', 'rev-parse', f'{tag}^{{commit}}') == target]
    if not existing:
        if tags:
            # Do not silently release a branch that excludes the latest feature release.
            run('git', 'merge-base', '--is-ancestor', tags[-1], target)
        major, minor, _ = version(tags[-1]) if tags else (1, -1, 0)
        tag = f'v{major}.{minor + 1}.0'
        run('git', 'tag', '-a', tag, target, '-m', f'GrabMails {tag}')
        tags.append(tag)
        existing = [tag]
    # Also retries an interrupted tag push. Existing remote tags are never moved.
    for tag in existing:
        run('git', 'push', 'origin', f'refs/tags/{tag}')
    published = set(run('gh', 'api', '--paginate', 'repos/{owner}/{repo}/releases', '--jq', '.[].tag_name').splitlines())
    for tag in tags:
        if tag in published:
            continue
        args = ['gh', 'release', 'create', tag, '--verify-tag', '--title', f'GrabMails {tag}', '--latest=false']
        if tag in HISTORICAL_NOTES:
            args += ['--notes', HISTORICAL_NOTES[tag] + '\n\nThis release identifies source code; deployment is tracked separately.']
        else:
            args += ['--generate-notes']
        run(*args)
    # Mark latest only after every missing release has been published successfully.
    run('gh', 'release', 'edit', tags[-1], '--latest')
    print(f'Release ready: {existing[-1]}')


if __name__ == '__main__':
    release(os.environ.get('GITHUB_SHA', 'HEAD'))
