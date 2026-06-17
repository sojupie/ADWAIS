FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["apps/server/ADWAIS/src/Api/Adwais.Api.csproj", "apps/server/ADWAIS/src/Api/"]
COPY ["apps/server/ADWAIS/src/Infrastructure/Adwais.Infrastructure.csproj", "apps/server/ADWAIS/src/Infrastructure/"]
COPY ["apps/server/ADWAIS/src/Application/Adwais.Application.csproj", "apps/server/ADWAIS/src/Application/"]
COPY ["apps/server/ADWAIS/src/Domain/Adwais.Domain.csproj", "apps/server/ADWAIS/src/Domain/"]
RUN dotnet restore "apps/server/ADWAIS/src/Api/Adwais.Api.csproj"

COPY apps/server/ADWAIS/src/ apps/server/ADWAIS/src/
WORKDIR "/src/apps/server/ADWAIS/src/Api"
RUN dotnet publish "Adwais.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Adwais.Api.dll"]