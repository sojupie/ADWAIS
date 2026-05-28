import re

# 1. Update index.css
with open('src/index.css', 'r', encoding='utf-8') as f:
    css = f.read()

css = css.replace('--color-brand-bg-tertiary: #e6f4f5;', '--color-brand-bg-tertiary: #ffffff;')

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(css)

# 2. Update __root.tsx
with open('src/routes/__root.tsx', 'r', encoding='utf-8') as f:
    root = f.read()

# Header background
root = root.replace('bg-brand-bg-primary border-b border-brand-bg-secondary/10', 'bg-brand-bg-secondary border-b border-brand-bg-secondary/20')
# Logo invert
root = root.replace('className="h-8 object-contain"', 'className="h-8 object-contain brightness-0 invert"')
# Nav links
root = root.replace('text-slate-500 hover:text-brand-text transition-all no-underline pb-1 border-b-4 border-transparent uppercase tracking-wider', 
                    'text-white/60 hover:text-white transition-all no-underline pb-1 border-b-4 border-transparent uppercase tracking-wider')
root = root.replace("activeProps={{ className: '!text-brand-text !border-brand-btn-primary' }}", 
                    "activeProps={{ className: '!text-brand-accent !border-brand-accent' }}")
# Settings link
root = root.replace('className="p-1 text-slate-500 hover:text-brand-text transition-all"', 
                    'className="p-1 text-white/60 hover:text-white transition-all"')
root = root.replace("activeProps={{ className: '!text-brand-btn-primary' }}", 
                    "activeProps={{ className: '!text-brand-accent' }}")

with open('src/routes/__root.tsx', 'w', encoding='utf-8') as f:
    f.write(root)

# 3. Update KioskControls.tsx
with open('src/components/common/KioskControls.tsx', 'r', encoding='utf-8') as f:
    kiosk = f.read()

kiosk = kiosk.replace('bg-white border border-slate-200 rounded-[4px] text-brand-text hover:bg-brand-bg-tertiary transition-all shadow-sm active:scale-95',
                      'bg-white/10 border border-white/20 rounded-[4px] text-white hover:bg-white/20 transition-all shadow-sm active:scale-95')

with open('src/components/common/KioskControls.tsx', 'w', encoding='utf-8') as f:
    f.write(kiosk)

# 4. Update PeriodSelector.tsx
with open('src/components/common/PeriodSelector.tsx', 'r', encoding='utf-8') as f:
    period = f.read()

period = period.replace("? 'bg-brand-btn-primary text-white shadow-md'", "? 'bg-brand-accent text-brand-bg-secondary shadow-md'")
period = period.replace(": 'text-slate-500 hover:text-brand-text hover:bg-brand-bg-primary'", ": 'text-slate-500 hover:text-brand-text hover:bg-slate-50'")
period = period.replace("bg-brand-bg-tertiary", "bg-white")

with open('src/components/common/PeriodSelector.tsx', 'w', encoding='utf-8') as f:
    f.write(period)

print("Design changes applied.")
