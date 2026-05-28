import re

# 1. Fix MomentumMatrixChart
file1 = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\components\financial\MomentumMatrixChart.tsx'
with open(file1, 'r', encoding='utf-8') as f:
    c1 = f.read()

# Replace TYPE_COLORS
c1 = re.sub(
    r"const TYPE_COLORS: Record<string, string> = \{.*?\};",
    "const TYPE_COLORS: Record<string, string> = {\n  'B2C': 'var(--color-chart-1)',\n  'Mixed': 'var(--color-chart-2)',\n  'B2B': 'var(--color-chart-3)',\n};",
    c1,
    flags=re.DOTALL
)

# Replace scatter cell logic
c1 = c1.replace(
    """                  ? 'var(--color-chart-2)'
                  : entry.type === 'B2C'
                  ? 'var(--color-chart-1)'
                  : 'var(--color-chart-3)'""",
    """                  ? 'var(--color-chart-3)'
                  : entry.type === 'B2C'
                  ? 'var(--color-chart-1)'
                  : 'var(--color-chart-2)'"""
)
with open(file1, 'w', encoding='utf-8') as f:
    f.write(c1)

# 2. Fix RevenueEfficiencyChart
file2 = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\components\financial\RevenueEfficiencyChart.tsx'
with open(file2, 'r', encoding='utf-8') as f:
    c2 = f.read()

c2 = re.sub(
    r"const TYPE_COLORS: Record<string, string> = \{.*?\};",
    "const TYPE_COLORS: Record<string, string> = {\n  'B2C': 'var(--color-chart-1)',\n  'Mixed': 'var(--color-chart-2)',\n  'B2B': 'var(--color-chart-3)',\n};",
    c2,
    flags=re.DOTALL
)
with open(file2, 'w', encoding='utf-8') as f:
    f.write(c2)

# 3. Fix TenantDiagnostics pill and color
file3 = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\pages\TenantDiagnostics.tsx'
with open(file3, 'r', encoding='utf-8') as f:
    c3 = f.read()

c3 = c3.replace(
    "tenantType === 'B2C' ? '1' : tenantType === 'B2B' ? '2' : '3'",
    "tenantType === 'B2C' ? '1' : tenantType === 'Mixed' ? '2' : '3'"
)
c3 = c3.replace(
    'className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest"',
    'className="inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-black uppercase tracking-widest"'
)
with open(file3, 'w', encoding='utf-8') as f:
    f.write(c3)

print("Standardized B2B/B2C/Mixed colors across charts and tenant view.")
