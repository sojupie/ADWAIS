import os
import glob

files = glob.glob(r"c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\**\*.tsx", recursive=True)

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    orig = content
    content = content.replace("'text-decline'", "'text-[#c92a2a]'")
    
    if content != orig:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated decline text in {os.path.basename(filepath)}")
