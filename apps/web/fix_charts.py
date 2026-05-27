import os
import re

files = [
    "src/components/FleetStatus/NetworkLatencyChart.tsx",
    "src/components/TenantSpecific/CumulativeGrowthDeltaChart.tsx",
    "src/components/TenantSpecific/OrderValueDistributionChart.tsx",
    "src/components/TenantSpecific/PortfolioRevenueShareTrajectoryChart.tsx",
    "src/components/TenantSpecific/TenantRevenueVelocityChart.tsx",
    "src/components/financial/GrowthExtremesChart.tsx",
    "src/components/financial/MomentumMatrixChart.tsx",
    "src/components/financial/RevenueDistributionChart.tsx",
    "src/components/financial/RevenueVelocityChart.tsx",
    "src/pages/Financial.tsx",
]

base_dir = r"c:\Users\ollem\Git\motillo project\dashboard\apps\web"

for f in files:
    filepath = os.path.join(base_dir, f)
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}, does not exist.")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
    
    original = content
    
    # Text colors
    content = content.replace("text-[#51B5B9]", "text-brand-btn-primary")
    content = content.replace("text-[#37b24d]", "text-growth")
    content = content.replace("text-[#f03e3e]", "text-decline")
    
    # Bg colors
    content = content.replace("bg-[#51B5B9]", "bg-brand-btn-primary")
    
    # Recharts props (using style variables directly in stroke/fill isn't as nice as importing CHART_COLORS, 
    # but since the task was to use CSS variables, we can just inject 'var(--color-...)' directly 
    # instead of doing complex imports. Recharts supports CSS variables in stroke/fill!)
    content = content.replace('stroke="#f1f5f9"', 'stroke="var(--color-chart-grid)"')
    content = content.replace("stroke: '#f1f5f9'", "stroke: 'var(--color-chart-grid)'")
    
    content = content.replace('stroke="#cbd5e1"', 'stroke="var(--color-chart-prev-line)"')
    content = content.replace('stroke="#51B5B9"', 'stroke="var(--color-brand-btn-primary)"')
    content = content.replace('fill="#51B5B9"', 'fill="var(--color-brand-btn-primary)"')
    content = content.replace("fill: '#51B5B9'", "fill: 'var(--color-brand-btn-primary)'")
    content = content.replace("stroke: '#51B5B9'", "stroke: 'var(--color-brand-btn-primary)'")
    
    content = content.replace("fill: '#94a3b8'", "fill: 'var(--color-chart-tick)'")
    
    content = content.replace("fill: '#1A1A1A'", "fill: 'var(--color-chart-label)'")
    content = content.replace("fill: '#64748b'", "fill: 'var(--color-slate-500)'") # slate-500
    
    content = content.replace("stroke: '#022D2E'", "stroke: 'var(--color-brand-text)'")
    content = content.replace('stroke="#022D2E"', 'stroke="var(--color-brand-text)"')
    
    # Momentum Matrix specific
    content = content.replace("fill={tenant.growthPercentage < 0 ? '#EF4444' : '#10B981'}", "fill={tenant.growthPercentage < 0 ? 'var(--color-status-down)' : 'var(--color-status-up)'}")
    content = content.replace("tenant.momentum === 'declining' ? '#f03e3e'", "tenant.momentum === 'declining' ? 'var(--color-decline)'")
    content = content.replace("tenant.momentum === 'at_risk' ? '#f59f00'", "tenant.momentum === 'at_risk' ? 'var(--color-decline-warning)'")
    content = content.replace("tenant.momentum === 'growing' ? '#37b24d'", "tenant.momentum === 'growing' ? 'var(--color-growth)'")
    content = content.replace("tenant.momentum === 'stable' ? '#94a3b8'", "tenant.momentum === 'stable' ? 'var(--color-chart-tick)'")
    
    content = content.replace("fill={tenant.isAtRisk ? '#f03e3e' : '#37b24d'}", "fill={tenant.isAtRisk ? 'var(--color-decline)' : 'var(--color-growth)'}")

    # Fix any Typescript 'any' in CustomTooltip
    content = re.sub(
        r'const CustomTooltip = \(\{ active, payload, label \}: any\) => \{',
        r'const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {',
        content
    )
    content = re.sub(
        r'const CustomTooltip = \(\{ active, payload \}: any\) => \{',
        r'const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {',
        content
    )
    
    # PortfolioRevenueShareTrajectoryChart index safety
    if "PortfolioRevenueShareTrajectoryChart" in f:
        content = content.replace(
            "const portfolioRevenue = portfolioVelocity[index]?.currentRevenue ?? 0;",
            "const portfolioRevenue = portfolioVelocity.find(p => p.label === point.label)?.currentRevenue ?? 0;"
        )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
    else:
        print(f"No changes for {f}")

print("Done")
