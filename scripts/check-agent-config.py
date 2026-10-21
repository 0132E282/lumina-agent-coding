#!/usr/bin/env python3
"""Validate shared directories and tool adapters without modifying files."""
from pathlib import Path
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
errors.extend(find_docs_errors(root))
if errors:
    raise SystemExit('\n'.join(errors))
print('Shared rules/skills, symlinks, Codex agent adapters, Markdown links and docs indexes are valid.')
