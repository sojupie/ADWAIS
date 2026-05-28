import re

file_path = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\components\common\SyncStatusWidget.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    c = f.read()

# Update the refresh button hover states
c = c.replace(
    'hover:text-brand-text hover:bg-slate-100',
    'hover:text-white hover:bg-brand-bg-secondary hover:border-brand-bg-secondary'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated SyncStatusWidget hover state to motillo green.")
