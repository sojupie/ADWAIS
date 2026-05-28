import re

# 1. SyncStatusWidget
file_sync = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\components\common\SyncStatusWidget.tsx'
with open(file_sync, 'r', encoding='utf-8') as f:
    c1 = f.read()

# Change widget background
c1 = c1.replace('bg-white border-slate-200', 'bg-brand-bg-secondary border-brand-bg-secondary/20')
# Change text colors
c1 = c1.replace('text-slate-700', 'text-white')
c1 = c1.replace('text-slate-500', 'text-white/60')
c1 = c1.replace('text-slate-100', 'text-white/10')

# Action button
c1 = c1.replace(
    'bg-slate-50 border border-slate-200 text-slate-500 hover:text-white hover:bg-brand-bg-secondary hover:border-brand-bg-secondary',
    'bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-transparent'
)
# Fix border between info and action
c1 = c1.replace('border-slate-100', 'border-white/10')

with open(file_sync, 'w', encoding='utf-8') as f:
    f.write(c1)

# 2. PeriodSelector
file_period = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\components\common\PeriodSelector.tsx'
with open(file_period, 'r', encoding='utf-8') as f:
    c2 = f.read()

# Change widget background
c2 = c2.replace('bg-white p-1.5', 'bg-brand-bg-secondary p-1.5')
# Inactive text and hover
c2 = c2.replace('text-slate-500 hover:text-brand-text hover:bg-slate-50', 'text-white/60 hover:text-white hover:bg-white/10')

with open(file_period, 'w', encoding='utf-8') as f:
    f.write(c2)

print("Updated floating components to use Motillo green background.")
