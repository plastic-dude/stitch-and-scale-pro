import json
import sys
from pathlib import Path

root = Path(sys.argv[1] if len(sys.argv) > 1 else 'dist-analysis')
chunks = sorted(root.glob('assets/index-*.js'), key=lambda path: path.stat().st_size, reverse=True)
if not chunks:
    raise SystemExit('No index chunks found')
js = chunks[0]
map_path = Path(str(js) + '.map')
print(f'chunk={js.name} bytes={js.stat().st_size}')
if not map_path.exists():
    raise SystemExit(f'Missing source map: {map_path}')
data = json.loads(map_path.read_text())
rows = [(len(content or ''), source) for source, content in zip(data.get('sources', []), data.get('sourcesContent', []))]
for size, source in sorted(rows, reverse=True):
    print(f'{size:7} {source}')
