from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1] / 'src'
patterns = [
    re.compile(r'aria-label\s*=\s*["\']([^"\']+)["\']'),
    re.compile(r'placeholder\s*=\s*["\']([^"\']+)["\']'),
    re.compile(r'<(?:Label|CardTitle|CardDescription|SelectItem|Button)[^>]*>([^<{]{4,})<'),
    re.compile(r'toast\(\{\s*title:\s*["\']([^"\']+)["\']'),
]
exclude = ('/ui/', '.test.', '/lib/i18n.ts')
for path in sorted(ROOT.rglob('*')):
    if path.suffix not in {'.ts', '.tsx'} or any(part in str(path) for part in exclude):
        continue
    lines = path.read_text(errors='ignore').splitlines()
    hits = []
    for number, line in enumerate(lines, 1):
        if any(pattern.search(line) for pattern in patterns):
            hits.append(f'{number}: {line.strip()}')
    if hits:
        print(f'=== {path.relative_to(ROOT.parent)} ===')
        print('\n'.join(hits))
