param (
    [switch]$Frontend,
    [switch]$Backend,
    [switch]$Permissions,
    [switch]$RestartNginx,
    [switch]$All
)

$ServerIp = "62.238.23.122"
$SshUser = "motillo"
$WebRoot = "/var/www/kpi.motillo.com"
$ApiImage = "sojupie/adwais-api:latest"

if (-not ($Frontend -or $Backend -or $Permissions -or $RestartNginx -or $All)) {
    Write-Host "Please specify a deployment target." -ForegroundColor Red
    Write-Host "Usage: .\deploy.ps1 -Frontend | -Backend | -Permissions | -RestartNginx | -All" -ForegroundColor Yellow
    exit
}

if ($All -or $Backend) {
    Write-Host "`n[Deploying Backend API]" -ForegroundColor Cyan
    docker build --no-cache -t $ApiImage -f apps/server/ADWAIS/src/Api/Dockerfile .
    docker push $ApiImage

    Write-Host "--> Updating containers on Hetzner VPS..." -ForegroundColor DarkGray
    ssh ${SshUser}@${ServerIp} "cd /opt/adwais && sudo docker compose -f docker-compose.prod.yml pull && sudo docker compose -f docker-compose.prod.yml up -d --force-recreate"
}

if ($All -or $Frontend) {
    Write-Host "`n[Deploying Frontend SPA]" -ForegroundColor Cyan
    pnpm --filter web build
    
    Write-Host "--> Transferring static assets..." -ForegroundColor DarkGray
    scp -r apps/web/dist/* ${SshUser}@${ServerIp}:${WebRoot}/
    
    $Permissions = $true 
}

if ($All -or $Permissions) {
    Write-Host "`n[Fixing Nginx File Permissions]" -ForegroundColor Cyan
    ssh ${SshUser}@${ServerIp} "sudo find $WebRoot -type d -exec chmod 755 {} \;; sudo find $WebRoot -type f -exec chmod 644 {} \;"
}

if ($RestartNginx) {
    Write-Host "`n[Restarting Nginx Service]" -ForegroundColor Cyan
    ssh ${SshUser}@${ServerIp} "sudo systemctl restart nginx"
}

Write-Host "`nDeployment sequence complete." -ForegroundColor Green