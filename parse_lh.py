import re
import json

path = r'c:\Users\ollem\Git\motillo project\dashboard\127.0.0.1_4173-20260528T031753.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# find window.__LIGHTHOUSE_JSON__ = {...};
match = re.search(r'window\.__LIGHTHOUSE_JSON__ = (\{.*?\});', content, re.DOTALL)
if match:
    data = json.loads(match.group(1))
    audits = data.get('audits', {})
    for k, v in audits.items():
        if v.get('score') == 0 or v.get('score') is None:
            if v.get('scoreDisplayMode') == 'binary' or v.get('scoreDisplayMode') == 'numeric':
                print(f"{v.get('id')}: {v.get('title')}")
                if 'details' in v and 'items' in v['details']:
                    for item in v['details']['items']:
                        if 'node' in item:
                            print(f"  - {item['node'].get('snippet')}")
                        else:
                            print(f"  - {item}")
