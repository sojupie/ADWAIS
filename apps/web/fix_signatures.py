import os
import glob
import re

files = glob.glob(r"c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\components\**\*Chart.tsx", recursive=True)

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    orig = content
    
    # Clean up mangled CustomTooltip
    content = re.sub(r'payload\s*isLoading\?:\s*boolean;\s*\}', r'payload }', content)
    content = re.sub(r'label\s*isLoading\?:\s*boolean;\s*\}', r'label }', content)
    content = re.sub(r'active\s*isLoading\?:\s*boolean;\s*\}', r'active }', content)

    # Clean up mangled export function args
    content = re.sub(r'(\w+)\s+isLoading\?:\s*boolean;\s*\}', r'\1 }', content)
    
    # If the type signature is inline `{ ... }: { ... }` or interface `Props { ... }`
    # Let's just make sure `isLoading?: boolean;` is in the interface.
    
    # Many files have something like:
    # `}: {`
    # We want it to be `}: { isLoading?: boolean;`
    if 'isLoading?: boolean;' not in content and 'export function' in content and 'isLoading' in content:
        content = re.sub(r'\}\s*:\s*\{', r'}: { isLoading?: boolean; ', content)
    
    # Also if it's using an interface (e.g. `interface Props {`)
    if 'isLoading?: boolean;' not in content and 'interface ' in content and 'Props {' in content:
        content = re.sub(r'(interface\s+\w*Props\s*\{)', r'\1\n  isLoading?: boolean;', content)
        
    # If `isLoading?: boolean;` is randomly floating:
    content = re.sub(r'isLoading\?:\s*boolean;\s*\}', r'}', content)

    # Make sure we don't have duplicate isLoading in destructured args
    content = re.sub(r'isLoading,\s*isLoading,', r'isLoading,', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
