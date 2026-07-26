[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [ValidateSet('Frontend', 'Backend', 'Infrastructure', 'RestartApi', 'RestartStack', 'ReloadNginx', 'All')]
    [string]$Target,

    [string]$Ref = 'main'
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI ('gh') is required. Install it and run 'gh auth login'."
}

gh auth status --hostname github.com
if ($LASTEXITCODE -ne 0) {
    throw "GitHub CLI is not authenticated. Run 'gh auth login'."
}

$workflowTargets = @{
    Frontend       = 'frontend'
    Backend        = 'backend'
    Infrastructure = 'infrastructure'
    RestartApi     = 'restart-api'
    RestartStack   = 'restart-stack'
    ReloadNginx    = 'reload-nginx'
    All            = 'all'
}

$workflowTarget = $workflowTargets[$Target]

gh workflow run deploy-production.yml --ref $Ref --field "target=$workflowTarget"
if ($LASTEXITCODE -ne 0) {
    throw "Could not dispatch the '$workflowTarget' production deployment."
}

Write-Host "Queued '$workflowTarget' from '$Ref' on the homelab runner." -ForegroundColor Green
Write-Host "Follow it with: gh run watch" -ForegroundColor Cyan
