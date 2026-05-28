import re

# 1. TenantDiagnostics.tsx
file_td = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\pages\TenantDiagnostics.tsx'
with open(file_td, 'r', encoding='utf-8') as f:
    c1 = f.read()

# Add ArrowLeft import if missing
if 'ArrowLeft' not in c1:
    c1 = c1.replace("import { TrendingUp, TrendingDown", "import { ArrowLeft, TrendingUp, TrendingDown")

c1 = c1.replace('&larr;', '<ArrowLeft size={20} className="stroke-[3px]" />')
c1 = c1.replace(
    'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
    'text-slate-700 hover:text-brand-text hover:bg-slate-100 hover:border-slate-300'
)
with open(file_td, 'w', encoding='utf-8') as f:
    f.write(c1)


# 2. FleetStatus.tsx
file_fs = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\pages\FleetStatus.tsx'
with open(file_fs, 'r', encoding='utf-8') as f:
    c2 = f.read()

if 'ArrowLeft' not in c2:
    # find where lucide-react is imported
    if 'import { Activity, ShieldAlert, CheckCircle2, AlertTriangle, Play, Pause } from \'lucide-react\';' in c2:
        c2 = c2.replace(
            "import { Activity, ShieldAlert, CheckCircle2, AlertTriangle, Play, Pause } from 'lucide-react';",
            "import { Activity, ShieldAlert, CheckCircle2, AlertTriangle, Play, Pause, ArrowLeft } from 'lucide-react';"
        )

c2 = c2.replace('&larr; Back to Global', '<ArrowLeft size={14} className="mr-1 inline-block -mt-0.5 stroke-[3px]" /> BACK TO GLOBAL')
c2 = c2.replace(
    'bg-white border border-[#e5e7eb] px-3 py-1.5 rounded-[4px] text-[11px] font-extrabold text-brand-btn-primary hover:bg-[#f9fafa]',
    'bg-brand-bg-secondary border border-brand-bg-secondary px-3 py-1.5 rounded-[4px] text-[11px] font-extrabold text-white hover:bg-brand-text hover:border-brand-text'
)
with open(file_fs, 'w', encoding='utf-8') as f:
    f.write(c2)


# 3. SlaBreachWatchlist.tsx
file_sla = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\components\FleetStatus\SlaBreachWatchlist.tsx'
with open(file_sla, 'r', encoding='utf-8') as f:
    c3 = f.read()

c3 = c3.replace(
    'text-xs font-bold text-brand-btn-primary hover:text-brand-text uppercase tracking-widest transition-colors cursor-pointer',
    'bg-brand-bg-secondary text-white px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-brand-text transition-colors shadow-sm cursor-pointer'
)
with open(file_sla, 'w', encoding='utf-8') as f:
    f.write(c3)

print("Updated Back and Clear buttons for legibility and visual hierarchy.")
