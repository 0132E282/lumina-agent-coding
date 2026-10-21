#!/usr/bin/env python3
"""Validate relative Markdown links/anchors and docs index sync without modifying files."""
import json
import os
import re
import sys
import unicodedata
from pathlib import Path
from urllib.parse import unquote

ROOT_MARKDOWN_FILES = ('AGENTS.md', 'CLAUDE.md', 'CONTRACT.md', 'README.md')
SCANNED_DIRECTORIES = ('.agents', '.claude')
SKIPPED_DIRECTORIES = {'node_modules', '.git'}
ENTRY_FIELDS = ('title', 'description', 'tags', 'path')
SUB_INDEXES_SYNCED_TO_CATALOG = {'docs/repo/index.json': True, 'docs/plans/index.json': False}

FENCE = re.compile(r'^ {0,3}(`{3,}|~{3,})')
INLINE_CODE = re.compile(r'(`+)(?:.+?)\1')
LINK = re.compile(r'!?\[[^\]]*\]\(\s*(<[^>]*>|[^)\s]+)(?:\s+"[^"]*")?\s*\)')
URL_SCHEME = re.compile(r'^[A-Za-z][A-Za-z0-9+.-]*:')
HEADING = re.compile(r'^ {0,3}#{1,6}\s+(.*?)(?:\s+#+)?\s*$')
HTML_ANCHOR = re.compile(r'<a\s[^>]*(?:id|name)="([^"]+)"', re.IGNORECASE)
HEADING_LINK = re.compile(r'!?\[([^\]]*)\]\([^)]*\)')


def markdown_lines(text):
    """Yield (line number, line) outside fenced code blocks and front matter, inline code removed."""
    lines = text.splitlines()
    start = 0
    if lines and lines[0].strip() == '---':
        closing = next((index for index in range(1, len(lines)) if lines[index].strip() == '---'), None)
        if closing is not None:
            start = closing + 1
    fence = None
    for index in range(start, len(lines)):
        line = lines[index]
        match = FENCE.match(line)
        if fence:
            if match and match.group(1)[0] == fence[0] and len(match.group(1)) >= len(fence):
                fence = None
            continue
        if match:
            fence = match.group(1)
            continue
        yield index + 1, INLINE_CODE.sub('', line)


def github_slug(heading):
    text = HEADING_LINK.sub(r'\1', heading).lower()
    kept = ''.join(
        character for character in text
        if character.isalnum() or unicodedata.category(character).startswith('M') or character in '-_ '
    )
    return kept.replace(' ', '-')


def anchors_of(path, cache):
    if path not in cache:
        anchors = set()
        counts = {}
        for _, line in markdown_lines(path.read_text(encoding='utf-8')):
            anchors.update(HTML_ANCHOR.findall(line))
            match = HEADING.match(line)
            if not match:
                continue
            slug = github_slug(match.group(1))
            duplicate = counts.get(slug, 0)
            counts[slug] = duplicate + 1
            anchors.add(f'{slug}-{duplicate}' if duplicate else slug)
        cache[path] = anchors
    return cache[path]


def markdown_sources(root):
    """Return each real Markdown file once, keyed by its physical path."""
    seen = set()
    sources = []

    def add(path):
        real = Path(os.path.realpath(path))
        if real not in seen and real.is_file():
            seen.add(real)
            sources.append(real)

    for name in ROOT_MARKDOWN_FILES:
        if (root / name).is_file():
            add(root / name)
    visited_directories = set()
    for directory in SCANNED_DIRECTORIES:
        for current, folders, files in os.walk(root / directory, followlinks=True):
            real_current = os.path.realpath(current)
            if real_current in visited_directories:
                folders[:] = []
                continue
            visited_directories.add(real_current)
            folders[:] = sorted(
                folder for folder in folders
                if folder not in SKIPPED_DIRECTORIES and Path(real_current, folder) != Path(root, '.agents', 'storage').resolve()
            )
            for name in sorted(files):
                if name.endswith('.md'):
                    add(Path(current) / name)
    return sources


def display(path, root):
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.as_posix()


def link_errors(root):
    errors = []
    anchor_cache = {}
    for source in markdown_sources(root):
        for line_number, line in markdown_lines(source.read_text(encoding='utf-8')):
            for match in LINK.finditer(line):
                target = match.group(1).strip('<>')
                if not target or target.startswith(('#', '/')) or URL_SCHEME.match(target):
                    continue
                file_part, _, anchor = target.partition('#')
                location = f'{display(source, root)}:{line_number}'
                destination = Path(os.path.realpath(source.parent / unquote(file_part)))
                if not destination.exists():
                    errors.append(f'{location}: missing link target {target}')
                elif (anchor and destination.suffix == '.md' and destination.is_file()
                      and unquote(anchor) not in anchors_of(destination, anchor_cache)):
                    errors.append(f'{location}: missing anchor #{unquote(anchor)} in {display(destination, root)}')
    return errors


def load_entries(root, relative_path, errors):
    try:
        data = json.loads((root / relative_path).read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f'{relative_path}: cannot read JSON ({exc})')
        return []
    entries = data.get('entries') if isinstance(data, dict) else data
    if not isinstance(entries, list) or not all(isinstance(entry, dict) for entry in entries):
        errors.append(f'{relative_path}: expected a list of entry objects')
        return []
    for entry in entries:
        label = f'{relative_path}: entry {entry.get("path", "<no path>")}'
        if sorted(entry) != sorted(ENTRY_FIELDS):
            errors.append(f'{label} fields must be exactly {", ".join(ENTRY_FIELDS)}')
        entry_path = entry.get('path')
        if not isinstance(entry_path, str) or not (root / entry_path).exists():
            errors.append(f'{label} path does not exist')
    return entries


def index_errors(root):
    catalog_path = 'docs/index.json'
    if not (root / catalog_path).is_file():
        return []
    errors = []
    catalog = {entry.get('path'): entry for entry in load_entries(root, catalog_path, errors)}
    for index_path, synced_to_catalog in SUB_INDEXES_SYNCED_TO_CATALOG.items():
        if not (root / index_path).is_file():
            continue
        for entry in load_entries(root, index_path, errors):
            if not synced_to_catalog:
                continue
            label = f'{index_path}: entry {entry.get("path")}'
            catalog_entry = catalog.get(entry.get('path'))
            if catalog_entry is None:
                errors.append(f'{label} missing from {catalog_path}')
                continue
            different = [field for field in ENTRY_FIELDS if entry.get(field) != catalog_entry.get(field)]
            if different:
                errors.append(f'{label} differs from {catalog_path} ({", ".join(different)})')
    return errors


def find_errors(root):
    root = Path(os.path.realpath(root))
    return link_errors(root) + index_errors(root)


def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
    errors = find_errors(root)
    if errors:
        raise SystemExit('\n'.join(errors))
    print('Markdown links/anchors and docs indexes are valid.')


if __name__ == '__main__':
    main()
