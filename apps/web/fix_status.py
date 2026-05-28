import re

new_normalize = """function normalizeStatus(status?: string | number): string {
  if (status === undefined || status === null) return 'UNKNOWN';
  const s = status.toString().toUpperCase().trim();
  if (s === '2' || s === 'UP') return 'UP';
  if (s === '8' || s === '9' || s === 'DOWN' || s === 'SEEMS DOWN' || s === 'CRITICAL') return 'DOWN';
  if (s === '0' || s === 'PAUSED') return 'PAUSED';
  return 'UNKNOWN';
}"""

# 1. FleetMatrix.tsx
f_matrix = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\components\FleetStatus\FleetMatrix.tsx'
with open(f_matrix, 'r', encoding='utf-8') as f:
    c = f.read()

# Replace normalizeStatus
c = re.sub(r'function normalizeStatus\([^\}]+\}', new_normalize, c, count=1, flags=re.DOTALL)

# Replace getMonitorStatus
new_getMonitorStatus = """function getMonitorStatus(monitor: UptimeMonitorDto): 'operational' | 'degraded' | 'down' | 'unknown' {
  const status = normalizeStatus(monitor.currentStatus);
  if (status === 'DOWN') return 'down';
  if (status === 'UNKNOWN' || status === 'PAUSED') return 'unknown';
  
  const lat = Number(monitor.currentLatency) || 0;
  if (lat > 0 && monitor.latencyDegradedFloor && lat > monitor.latencyDegradedFloor) {
    return 'degraded';
  }
  
  return 'operational';
}"""
c = re.sub(r'function getMonitorStatus[^\}]+return \'operational\';\n\}', new_getMonitorStatus, c, count=1, flags=re.DOTALL)

# Replace latency render logic (if not already handled)
c = re.sub(
    r"\{\(status === 'down' \|\| status === 'unknown' \|\| monitor\.currentLatency === 0\) \? 'N/A' : `\$\{Math\.round\(monitor\.currentLatency \?\? 0\)\}ms`\}",
    "{(status === 'down' || status === 'unknown' || !Number(monitor.currentLatency)) ? 'N/A' : `${Math.round(Number(monitor.currentLatency))}ms`}",
    c
)

with open(f_matrix, 'w', encoding='utf-8') as f:
    f.write(c)


# 2. FleetStatus.tsx
f_status = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\pages\FleetStatus.tsx'
with open(f_status, 'r', encoding='utf-8') as f:
    c2 = f.read()

# Replace normalizeStatus
c2 = re.sub(r'function normalizeStatus\([^\}]+\}', new_normalize, c2, count=1, flags=re.DOTALL)

with open(f_status, 'w', encoding='utf-8') as f:
    f.write(c2)


# 3. SlaBreachWatchlist.tsx
f_sla = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\components\FleetStatus\SlaBreachWatchlist.tsx'
with open(f_sla, 'r', encoding='utf-8') as f:
    c3 = f.read()

c3 = re.sub(
    r"const isDown = m\.currentStatus\.toUpperCase\(\) === 'DOWN' \|\| m\.currentStatus\.toUpperCase\(\) === 'CRITICAL';",
    "const isDown = ['8', '9', 'DOWN', 'SEEMS DOWN', 'CRITICAL'].includes(m.currentStatus?.toString().toUpperCase().trim() || '');",
    c3
)
c3 = re.sub(
    r"const isPaused = m\.currentStatus === 0 \|\| m\.currentStatus === '0';",
    "const isPaused = ['0', 'PAUSED'].includes(m.currentStatus?.toString().toUpperCase().trim() || '');",
    c3
)
c3 = re.sub(
    r"const isUnknown = m\.currentStatus === 1 \|\| m\.currentStatus === '1';",
    "const isUnknown = !m.currentStatus || ['1', 'UNKNOWN', 'NOT YET CHECKED'].includes(m.currentStatus?.toString().toUpperCase().trim() || '');",
    c3
)

with open(f_sla, 'w', encoding='utf-8') as f:
    f.write(c3)

print("Status normalization robustly implemented.")
