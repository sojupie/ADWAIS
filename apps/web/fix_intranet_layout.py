import re

intranet_file = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\pages\Intranet.tsx'
with open(intranet_file, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('min-h-[300px]', 'min-h-0 h-full flex flex-col [&>*]:flex-1 [&>*]:min-h-0')
c = c.replace('min-h-[350px]', 'min-h-0 h-full flex flex-col [&>*]:flex-1 [&>*]:min-h-0')

with open(intranet_file, 'w', encoding='utf-8') as f: f.write(c)

print("Intranet layout constraints finalized.")
