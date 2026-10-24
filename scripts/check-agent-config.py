#!/usr/bin/env python3
"""Validate shared directories and tool adapters without modifying files."""
from pathlib import Path
import os
import re
import sys
import tomllib

sys.dont_write_bytecode = True
from check_docs import find_errors as find_docs_errors

root = Path(__file__).resolve().parents[1]
errors = []
for tool in ('.claude', '.codex'):
    for folder in ('rules', 'skills'):
        path = root / tool / folder
        if not path.is_symlink() or path.resolve() != (root / '.agents' / folder).resolve():
            errors.append(f'{tool}/{folder}: expected link to .agents/{folder}')
for folder in ('hooks', 'agents', 'commands'):
    path = root / '.agents' / folder
    if not path.is_symlink() or os.readlink(path) != f'../.claude/{folder}':
        errors.append(f'.agents/{folder}: expected symlink to ../.claude/{folder}')
# Must end on a filename character (no trailing "." or quote); paths with shell variables ($X, ${X}) cannot be checked statically.
hook_script = re.compile(r'\.agents/hooks/scripts/[\w./${}-]*[\w}-]')
for config in ('.claude/settings.json', '.codex/hooks.json'):
    if not (root / config).is_file():
        continue
    for script in sorted(set(hook_script.findall((root / config).read_text()))):
        if '$' in script:
            continue
        if not (root / script).is_file():
            errors.append(f'{config}: missing hook script {script}')
for path in (root / '.agents').iterdir():
    if path.is_symlink() and not path.exists():
        errors.append(f'Broken link: {path.relative_to(root)}')
for folder in (root / '.agents/skills').iterdir():
    if folder.name.startswith('.') or not folder.is_dir():
        continue
    if not (folder / 'SKILL.md').is_file():
        errors.append(f'Missing SKILL.md: {folder.name}')
for path in (root / '.codex/agents').glob('*.toml'):
    try:
        config = tomllib.loads(path.read_text())
        if not all(config.get(key) for key in ('name', 'description', 'developer_instructions')):
            errors.append(f'Missing agent fields: {path.name}')
        if not (root / '.claude/agents' / f'{path.stem}.md').is_file():
            errors.append(f'Missing role source: {path.stem}')
    except tomllib.TOMLDecodeError as exc:
        errors.append(f'{path.name}: {exc}')
# Stdlib-only (PyYAML is not guaranteed in CI): plain scalars with ": " or a reserved first char break strict YAML parsers.
frontmatter_line = re.compile(r'([\w-]+):[ \t]+(.+)')
markdown_sources = [
    *(root / '.agents/skills').glob('*/SKILL.md'),
    *(root / '.claude/agents').rglob('*.md'),
    *(root / '.claude/commands').glob('*.md'),
]
for path in markdown_sources:
    lines = path.read_text().splitlines()
    if not lines or lines[0] != '---':
        continue
    for number, line in enumerate(lines[1:], start=2):
        if line == '---':
            break
        match = frontmatter_line.fullmatch(line)
        if not match:
            continue
        key, value = match.groups()
        if value[0] in '"\'|>[{':
            continue
        if re.search(r':(\s|$)', value) or value[0] in '@`':
            errors.append(f'{path.relative_to(root)}:{number}: unquoted frontmatter value for {key} must be quoted')
errors.extend(find_docs_errors(root))
if errors:
    raise SystemExit('\n'.join(errors))
print('Shared rules/skills, symlinks, Codex agent adapters, Markdown links and docs indexes are valid.')
