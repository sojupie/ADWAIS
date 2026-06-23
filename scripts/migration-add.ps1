param(
    [Parameter(Mandatory=$true, Position=0, HelpMessage="Migration name (PascalCase)")]
    [string]$Name
)

$infra = "apps/server/ADWAIS/src/Infrastructure/Adwais.Infrastructure.csproj"
$api   = "apps/server/ADWAIS/src/Api/Adwais.Api.csproj"

dotnet ef migrations add $Name --project $infra --startup-project $api
