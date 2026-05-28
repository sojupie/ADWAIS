import os
import glob
import re

files = glob.glob(r"c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\components\**\*Chart.tsx", recursive=True)

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    orig = content
    
    # Check if we already have debounce, to be safe
    if "debounce=" not in content:
        content = content.replace("<ResponsiveContainer", "<ResponsiveContainer debounce={50}")
    
    if content != orig:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Added debounce to {os.path.basename(filepath)}")

