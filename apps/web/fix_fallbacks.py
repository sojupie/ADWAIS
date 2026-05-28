import os

# Fix Financial.tsx
fin_path = r"c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\pages\Financial.tsx"
with open(fin_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("(efficiencyQuery.data as any)", "((efficiencyQuery.data as any) || { tenants: [], topPerformer: null, bottomPerformer: null })")
content = content.replace("(momentumQuery.data as any)", "((momentumQuery.data as any) || { tenants: [] })")
content = content.replace("(velocityQuery.data as any)", "((velocityQuery.data as any) || [])")
content = content.replace("(anomalyQuery.data as any)", "((anomalyQuery.data as any) || [])")

with open(fin_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Fix TenantDiagnostics.tsx
td_path = r"c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\pages\TenantDiagnostics.tsx"
with open(td_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("(accumulatedQuery.data as any)", "((accumulatedQuery.data as any) || [])")
content = content.replace("(densityQuery.data as any)", "((densityQuery.data as any) || [])")
content = content.replace("(deltaQuery.data as any)", "((deltaQuery.data as any) || [])")
content = content.replace("(orderQuery.data as any)", "((orderQuery.data as any) || [])")

with open(td_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Fix FleetStatus.tsx
fs_path = r"c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\pages\FleetStatus.tsx"
with open(fs_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("(analyticsQuery.data?.latencyPoints as any)", "((analyticsQuery.data?.latencyPoints as any) || [])")

with open(fs_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fallbacks restored")
