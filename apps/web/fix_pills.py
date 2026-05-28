import re

# 1. Fix TenantDiagnostics.tsx
file_td = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\pages\TenantDiagnostics.tsx'
with open(file_td, 'r', encoding='utf-8') as f:
    c = f.read()

# Replace the style block and update className
c = re.sub(
    r'className="inline-flex items-center px-4 py-1\.5 rounded-full text-\[13px\] font-black uppercase tracking-widest".*?\}',
    r'''className={`inline-flex items-center px-3 py-1 rounded-[4px] text-[11px] font-black uppercase tracking-widest shadow-sm ${
                tenantType === 'B2C' ? 'bg-[#0ea5e9] text-white' : 
                tenantType === 'Mixed' ? 'bg-[#8b5cf6] text-white' : 
                'bg-[var(--color-brand-btn-primary)] text-white'
              }`}''',
    c,
    flags=re.DOTALL
)
with open(file_td, 'w', encoding='utf-8') as f:
    f.write(c)

# 2. Fix MomentumMatrixChart.tsx Tooltip Pill
file_mm = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\components\financial\MomentumMatrixChart.tsx'
with open(file_mm, 'r', encoding='utf-8') as f:
    c2 = f.read()

c2 = re.sub(
    r'className="inline-flex items-center px-2 py-0\.5 rounded-full text-\[10px\] font-bold uppercase tracking-widest"\s*style=\{\{\s*backgroundColor: `color-mix.*?\}',
    r'''className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-[9px] font-black uppercase tracking-widest text-white ${
            point.type === 'B2C' ? 'bg-[#0ea5e9]' : 
            point.type === 'Mixed' ? 'bg-[#8b5cf6]' : 
            'bg-[var(--color-brand-btn-primary)]'
          }`}''',
    c2,
    flags=re.DOTALL
)
with open(file_mm, 'w', encoding='utf-8') as f:
    f.write(c2)

print("Updated pills to use solid colors and consistent styling.")
