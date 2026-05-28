import os
import re
import glob

base_dir = r"c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\components"
chart_files = glob.glob(os.path.join(base_dir, "**", "*Chart.tsx"), recursive=True)

for filepath in chart_files:
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()

    original = content
    
    # 1. Add isLoading to the Props interface
    # Match something like: interface MyChartProps { ... }
    # Or export function MyChart({ ... }: { ... })
    
    # Let's use a simpler approach. Just replace `<ChartPanel title=` with `<ChartPanel isLoading={isLoading} title=`
    content = content.replace("<ChartPanel title=", "<ChartPanel isLoading={isLoading} title=")
    
    # 2. Add isLoading to the function signature
    # Find `export function XChart({ ... }: ...)`
    # Since the props might be inline or using an interface, it's safer to just inject it manually or via regex.
    # Actually, many charts use `export function XChart({ foo, bar }: Props)`
    # It might be easier to use a regex to inject isLoading.
    
    if "isLoading" not in original:
        # If it has an interface:
        content = re.sub(r'(interface \w+Props \{)', r'\1\n  isLoading?: boolean;', content)
        
        # If it has inline props: `export function XChart({ foo, bar }: { foo: any; bar: any; }) {`
        content = re.sub(r'(\}\s*:\s*\{)', r'isLoading?: boolean; \1', content)
        
        # Inject into the destructured args: `export function XChart({ foo, bar` -> `export function XChart({ foo, bar, isLoading`
        content = re.sub(r'(export function \w+(?:Chart)?\s*\(\s*\{\s*)([^\}]+)(\})', r'\1isLoading, \2\3', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {os.path.basename(filepath)}")
    else:
        print(f"No changes for {os.path.basename(filepath)}")
