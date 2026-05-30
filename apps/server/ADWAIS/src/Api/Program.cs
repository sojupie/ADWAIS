using Adwais.Api.DTOs.Tenants;
using Adwais.Api.DTOs.Ingestion;
using Adwais.Api.Exceptions;
using DotNetEnv;
using FluentValidation;
using Hangfire;
using Hangfire.PostgreSql;
using Hangfire.Storage;
using Adwais.Infrastructure;
using Adwais.Infrastructure.Helpers;
using Adwais.Infrastructure.Jobs;
using Adwais.Infrastructure.Jobs.MaterializedViews;
using Adwais.Infrastructure.Jobs.Monitor;
using Adwais.Infrastructure.Services.Financial;
using Adwais.Infrastructure.Services.Monitoring;
using Microsoft.EntityFrameworkCore;
using Polly;
using Polly.Extensions.Http;

var builder = WebApplication.CreateBuilder(args);

Env.Load();
builder.Configuration.AddEnvironmentVariables();

builder.Services.AddControllers(options =>
{
    options.Filters.Add<Adwais.Api.Filters.ValidationFilter>();
}).AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    options.JsonSerializerOptions.Converters.Add(new Adwais.Api.Converters.DecimalRoundingConverter());
});

builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<IMonitorOrchestrationService, MonitorOrchestrationService>();
builder.Services.AddScoped<Adwais.Infrastructure.Services.ISystemEventService, Adwais.Infrastructure.Services.SystemEventService>();
builder.Services.AddScoped<IFinancialService, Adwais.Infrastructure.Services.Financial.FinancialService>();
builder.Services.AddTransient<UptimeRobotRateLimitHandler>();
builder.Services.AddHttpClient<Adwais.Infrastructure.Services.Monitoring.IUptimeRobotService, Adwais.Infrastructure.Services.Monitoring.UptimeRobotService>()
    .AddHttpMessageHandler<UptimeRobotRateLimitHandler>();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    var xmlFilename = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));
});
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddMemoryCache();

builder.Services.AddHttpClient<Adwais.Infrastructure.Services.ILitiumIngestionService, Adwais.Infrastructure.Services.LitiumIngestionService>()
    .AddPolicyHandler(HttpPolicyExtensions
        .HandleTransientHttpError()
        .OrResult(msg => msg.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
        .WaitAndRetryAsync(
            retryCount: 5,
            sleepDurationProvider: retryAttempt =>
                TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)) + TimeSpan.FromMilliseconds(new Random().Next(0, 1000))
        ));

var connectionString = builder.Configuration.GetConnectionString("AnalyticsDb");

builder.Services.AddDbContext<AnalyticsDbContext>(options =>
{
    options.UseNpgsql(connectionString)
        .UseSnakeCaseNamingConvention();
});

builder.Services.AddDbContextFactory<AnalyticsDbContext>(options =>
{
    options.UseNpgsql(connectionString)
        .UseSnakeCaseNamingConvention();
}, ServiceLifetime.Scoped);

builder.Services.AddHangfire(config =>
{
    config.UsePostgreSqlStorage(options =>
    {
        options.UseNpgsqlConnection(connectionString);
        var storageOptions = new PostgreSqlStorageOptions();
        storageOptions.SchemaName = "hangfire";
        storageOptions.PrepareSchemaIfNecessary = true;
    });
});
builder.Services.AddHangfireServer();

var app = builder.Build();

app.MapOpenApi();
app.UseSwagger();
app.UseSwaggerUI();
app.UseExceptionHandler();
app.UseHangfireDashboard();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var contextFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<AnalyticsDbContext>>();
    await using var context = await contextFactory.CreateDbContextAsync();
    context.Database.Migrate();

    // Ensure materialized views are in sync with the current schema and logic
    await Adwais.Infrastructure.Helpers.MaterializedViewOrchestrator.SyncViewsAsync(context);

    if (app.Environment.IsDevelopment())
    {
        await DatabaseSeeder.SeedSampleDataAsync(context);
    }
}

using (var connection = JobStorage.Current.GetConnection())
{
    var recurringJobManager = app.Services.GetRequiredService<IRecurringJobManager>();
    
    recurringJobManager.AddOrUpdate<MonitorSynchronizationJob>(
        "sync-uptimerobot-fleet", 
        newJob => newJob.ExecuteAsync(), 
        Cron.MinuteInterval(5));
    
    recurringJobManager.RemoveIfExists("dispatch-uptimerobot-metrics");

    using (var scope = app.Services.CreateScope())
    {
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<AnalyticsDbContext>>();
        await using var context = dbFactory.CreateDbContext();
        var config = context.GlobalConfigs.SingleOrDefault();
        
        var uptimeInterval = config?.UptimeFetchIntervalMinutes ?? 60;
        var latencyInterval = config?.LatencyFetchIntervalMinutes ?? 10;
        var litiumFetchInterval = Math.Max(1, config?.LitiumFetchIntervalMinutes ?? 10);
        var userStatsInterval = config?.UserStatsFetchIntervalMinutes ?? 60;
        
        recurringJobManager.AddOrUpdate<UptimeDispatcherJob>(
                "dispatch-uptimerobot-uptime",
                newJob => newJob.ExecuteAsync(),
                CronHelper.FromMinutes(uptimeInterval));

        recurringJobManager.AddOrUpdate<LatencyDispatcherJob>(
            "dispatch-uptimerobot-latency",
            newJob => newJob.ExecuteAsync(),
            CronHelper.FromMinutes(latencyInterval));

        recurringJobManager.AddOrUpdate<LitiumOrderFetchJob>(
            "dispatch-litium-orders",
            newJob => newJob.ExecuteAsync(),
            CronHelper.FromMinutes(litiumFetchInterval));

        recurringJobManager.AddOrUpdate<UpdateGlobalUptimeRobotUserStatsJob>(
            "sync-uptimerobot-account-stats",
            newJob => newJob.ExecuteAsync(),
            CronHelper.FromMinutes(userStatsInterval));

        recurringJobManager.AddOrUpdate<RefreshMonitoringMaterializedViewJob>(
            "refresh-monitoring-materialized-views",
            newJob => newJob.ExecuteAsync(),
            Cron.Daily);

        recurringJobManager.AddOrUpdate<RefreshFinancialMaterializedViewJob>(
            "refresh-financial-materialized-views",
            newJob => newJob.ExecuteAsync(),
            Cron.Daily);

        recurringJobManager.AddOrUpdate<SystemEventCleanupJob>(
            "system-event-cleanup",
            newJob => newJob.ExecuteAsync(),
            Cron.Daily(2));

        if (app.Environment.IsDevelopment())
        {
            recurringJobManager.AddOrUpdate<RuntimeDataSeederJob>(
                "dev-runtime-data-seeder",
                newJob => newJob.ExecuteAsync(),
                Cron.MinuteInterval(1));
        }
    }
}

app.Run();


