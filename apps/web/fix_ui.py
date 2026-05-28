import os
import glob
import re

# Fix index.css
css_path = r"c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\index.css"
with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("--color-chart-1: #0ea5e9;", "--color-chart-1: #0284c7;")
content = content.replace("--color-chart-2: #8b5cf6;", "--color-chart-2: #6d28d9;")
content = content.replace("--color-decline: #f03e3e;", "--color-decline: #c92a2a;")
content = content.replace("--color-decline-warning: #f59f00;", "--color-decline-warning: #d97706;")

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Fix contrast issues in components
files = glob.glob(r"c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\**\*.tsx", recursive=True)

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    orig = content
    
    # Replace low contrast slate-400 with slate-500 or 600
    # Particularly for text-slate-400, when used on white backgrounds.
    content = content.replace("text-slate-400", "text-slate-500")
    
    if content != orig:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated contrast in {os.path.basename(filepath)}")

