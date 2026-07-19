[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [ValidateSet('Frontend', 'Backend', 'Infrastructure', 'RestartApi', 'RestartStack', 'ReloadNginx', 'All')]
    [string]$Target,

    [string]$ServerIp = $env:ADWAIS_SERVER_IP,
    [string]$SshUser = 'motillo',
    [string]$WebRoot = '/var/www/kpi.motillo.com',
    [string]$RemoteComposeDir = '/opt/adwais',
    [string]$EnvironmentFile = '.env.production',
    [string]$ApiImage = 'ghcr.io/sojupie/adwais-api:latest'
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($ServerIp)) {
    throw 'Server IP is required. Pass -ServerIp or set ADWAIS_SERVER_IP.'
}

$destination = "${SshUser}@${ServerIp}"
$composePath = 'docker-compose.prod.yml'
$nginxPath = 'infrastructure/nginx/kpi.motillo.com.conf'

function Assert-LastCommand([string]$Description) {
    if ($LASTEXITCODE -ne 0) {
        throw "$Description failed with exit code $LASTEXITCODE."
    }
}

function Require-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found in PATH."
    }
}

function Resolve-RsyncCommand {
    $command = Get-Command rsync -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }

    $msysRsync = 'C:\msys64\usr\bin\rsync.exe'
    if (Test-Path -LiteralPath $msysRsync -PathType Leaf) { return $msysRsync }

    throw "Required command 'rsync' was not found in PATH or at '$msysRsync'. Install it with MSYS2: pacman -S rsync."
}

function Invoke-Ssh([string]$Command) {
    ssh $destination $Command
    Assert-LastCommand 'SSH command'
}

function Connect-RemoteGhcr {
    if ($env:GHCR_PULL_USERNAME -and $env:GHCR_PULL_TOKEN) {
        $env:GHCR_PULL_TOKEN | ssh $destination "sudo docker login ghcr.io --username '$($env:GHCR_PULL_USERNAME)' --password-stdin"
        Assert-LastCommand 'Remote GHCR login'
    }
    else {
        Write-Warning 'GHCR_PULL_USERNAME/GHCR_PULL_TOKEN are unset; using the server existing GHCR login.'
    }
}

function Sync-RuntimeConfiguration([switch]$IncludeEnvironment) {
    Write-Host '[Syncing production Compose configuration]' -ForegroundColor Cyan
    scp $composePath "${destination}:/tmp/docker-compose.prod.yml"
    Assert-LastCommand 'Compose upload'
    Invoke-Ssh "sudo mkdir -p '$RemoteComposeDir'; sudo install -m 644 /tmp/docker-compose.prod.yml '$RemoteComposeDir/docker-compose.prod.yml'; rm -f /tmp/docker-compose.prod.yml"

    if ($IncludeEnvironment) {
        if (-not (Test-Path -LiteralPath $EnvironmentFile -PathType Leaf)) {
            throw "Infrastructure deployment requires the ignored environment file '$EnvironmentFile'."
        }
        scp $EnvironmentFile "${destination}:/tmp/adwais-production.env"
        Assert-LastCommand 'Environment upload'
        Invoke-Ssh "sudo install -m 600 /tmp/adwais-production.env '$RemoteComposeDir/.env'; rm -f /tmp/adwais-production.env"
    }
}

function Deploy-Frontend {
    Write-Host '[Building frontend]' -ForegroundColor Cyan
    pnpm --filter web build
    Assert-LastCommand 'Frontend build'

    Write-Host '[Synchronizing frontend with rsync]' -ForegroundColor Cyan
    Invoke-Ssh "sudo mkdir -p '$WebRoot'; sudo chown -R '$SshUser`:$SshUser' '$WebRoot'"
    & $script:RsyncCommand -az --delete --chmod=D755,F644 -e ssh 'apps/web/dist/' "${destination}:${WebRoot}/"
    Assert-LastCommand 'Frontend synchronization'
    Invoke-Ssh "sudo find '$WebRoot' -type d -exec chmod 755 {} +; sudo find '$WebRoot' -type f -exec chmod 644 {} +"
}

function Remove-ObsoleteGhcrVersions {
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        Write-Warning 'GitHub CLI is unavailable; obsolete GHCR versions will be removed by the next GitHub backend deployment.'
        return
    }

    gh auth status --hostname github.com *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning 'GitHub CLI is not authenticated; obsolete GHCR versions will be removed by the next GitHub backend deployment.'
        return
    }

    $versionIds = gh api --paginate '/users/sojupie/packages/container/adwais-api/versions?per_page=100' --jq '.[] | select((.metadata.container.tags // []) | length == 0) | .id'
    if ($LASTEXITCODE -ne 0) {
        Write-Warning 'Could not list GHCR versions; cleanup was skipped.'
        return
    }

    foreach ($versionId in $versionIds) {
        if ([string]::IsNullOrWhiteSpace($versionId)) { continue }
        gh api --method DELETE "/users/sojupie/packages/container/adwais-api/versions/$versionId"
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Could not delete obsolete GHCR version $versionId."
        }
    }
}

function Deploy-Backend {
    Write-Host '[Building and publishing backend]' -ForegroundColor Cyan
    docker build -t $ApiImage -f apps/server/ADWAIS/src/Api/Dockerfile .
    Assert-LastCommand 'Backend image build'
    docker push $ApiImage
    Assert-LastCommand 'Backend image push'

    Sync-RuntimeConfiguration

    Connect-RemoteGhcr
    Invoke-Ssh "set -e; cd '$RemoteComposeDir'; sudo docker compose -f docker-compose.prod.yml pull api; sudo docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate api"
    Remove-ObsoleteGhcrVersions
}

function Deploy-Infrastructure {
    Sync-RuntimeConfiguration -IncludeEnvironment
    Connect-RemoteGhcr
    scp $nginxPath "${destination}:/tmp/kpi.motillo.com.conf"
    Assert-LastCommand 'nginx configuration upload'
    Invoke-Ssh "set -e; cd '$RemoteComposeDir'; sudo docker compose -f docker-compose.prod.yml up -d; sudo install -m 644 /tmp/kpi.motillo.com.conf /etc/nginx/sites-available/kpi.motillo.com.conf; sudo ln -sfn /etc/nginx/sites-available/kpi.motillo.com.conf /etc/nginx/sites-enabled/kpi.motillo.com.conf; sudo nginx -t; sudo systemctl reload nginx; rm -f /tmp/kpi.motillo.com.conf"
}

Require-Command ssh
Require-Command scp

switch ($Target) {
    'Frontend' { Require-Command pnpm; $script:RsyncCommand = Resolve-RsyncCommand; Deploy-Frontend }
    'Backend' { Require-Command docker; Deploy-Backend }
    'Infrastructure' { Deploy-Infrastructure }
    'RestartApi' { Invoke-Ssh "cd '$RemoteComposeDir' && sudo docker compose -f docker-compose.prod.yml restart api" }
    'RestartStack' { Invoke-Ssh "cd '$RemoteComposeDir' && sudo docker compose -f docker-compose.prod.yml restart" }
    'ReloadNginx' { Invoke-Ssh 'sudo nginx -t && sudo systemctl reload nginx' }
    'All' {
        Require-Command docker
        Require-Command pnpm
        $script:RsyncCommand = Resolve-RsyncCommand
        Deploy-Infrastructure
        Deploy-Backend
        Deploy-Frontend
    }
}

Write-Host "Deployment target '$Target' completed." -ForegroundColor Green
