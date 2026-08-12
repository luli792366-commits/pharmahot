#!/usr/bin/env python3
import json, shutil
from datetime import datetime, timezone
from pathlib import Path

src = Path('data/news.json')
archive = Path('data/archive')
archive.mkdir(parents=True, exist_ok=True)
if not src.exists():
    raise SystemExit(0)

try:
    data = json.loads(src.read_text(encoding='utf-8'))
except Exception:
    raise SystemExit('data/news.json is not valid JSON')

# Archive by ISO week so each published weekly edition remains independently accessible.
now = datetime.now(timezone.utc)
year, week, _ = now.isocalendar()
dst = archive / f'{year}-W{week:02d}.json'

# Never overwrite an existing historical edition.
if not dst.exists():
    shutil.copy2(src, dst)
    print(f'archived previous edition -> {dst}')
else:
    print(f'archive already exists -> {dst}')

# Maintain a lightweight index for a future/history UI.
entries = []
for p in sorted(archive.glob('????-W??.json'), reverse=True):
    try:
        d = json.loads(p.read_text(encoding='utf-8'))
        entries.append({
            'week': p.stem,
            'file': p.name,
            'updated_at': d.get('updated_at', ''),
            'count': len(d.get('items', []))
        })
    except Exception:
        pass
(archive / 'index.json').write_text(json.dumps({'editions': entries}, ensure_ascii=False, indent=2), encoding='utf-8')
