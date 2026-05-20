using Api.DTOs.Tenants;
using Api.DTOs.Ingestion;
using Api.Exceptions;
using Api.Validators.Tenants;
using Api.Validators.Ingestion;
using DotNetEnv;
using FluentValidation;
using Hangfire;
using Hangfire.PostgreSql;
using Hangfire.Storage;
using Infrastructure;
using Infrastructure.Helpers;
using Infrastructure.Jobs;
using Infrastructure.Jobs.MaterializedViews;
using Infrastructure.Jobs.Monitor;
using Infrastructure.Services.Monitoring;
using Microsoft.EntityFrameworkCore;
using Polly;
using Polly.Extensions.Http;

var builder = WebApplication.CreateBuilder(args);

Env.Load();
builder.Configuration.AddEnvironmentVariables();

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddScoped<IValidator<CreateTenantRequestDto>, CreateTenantRequestDtoValidator>();
builder.Services.AddScoped<IValidator<UpdateTenantRequestDto>, UpdateTenantRequestDtoValidator>();
builder.Services.AddScoped<IValidator<HistoricalBackfillRequestDto>, HistoricalBackfillRequestDtoValidator>();
builder.Services.AddScoped<IMonitorOrchestrationService, MonitorOrchestrationService>();
builder.Services.AddScoped<Infrastructure.Services.ISystemEventService, Infrastructure.Services.SystemEventService>();
builder.Services.AddTransient<UptimeRobotRateLimitHandler>();
builder.Services.AddHttpClient<Infrastructure.Services.Monitoring.IUptimeRobotService, Infrastructure.Services.Monitoring.UptimeRobotService>()
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

builder.Services.AddHttpClient<Infrastructure.Services.ILitiumIngestionService, Infrastructure.Services.LitiumIngestionService>()
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

    if (app.Environment.IsDevelopment())
    {
        await DatabaseSeeder.SeedSampleDataAsync(context);
    }
}

using (var connection = JobStorage.Current.GetConnection())
{
    var recurringJobManager = app.Services.GetRequiredService<IRecurringJobManager>();
    var job = connection.GetRecurringJobs().FirstOrDefault(j => j.Id == "sync-uptimerobot-fleet");

    if (job == null)
    {
        recurringJobManager.AddOrUpdate<MonitorSynchronizationJob>("sync-uptimerobot-fleet", newJob => newJob.ExecuteAsync(), Cron.MinuteInterval(5));
    }
    
    recurringJobManager.RemoveIfExists("dispatch-uptimerobot-metrics");

    using (var scope = app.Services.CreateScope())
    {
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<AnalyticsDbContext>>();
        await using var context = dbFactory.CreateDbContext();
        var config = context.GlobalConfigs.SingleOrDefault();
        
        var uptimeInterval = config?.UptimeFetchIntervalMinutes ?? 60;
        var latencyInterval = config?.LatencyFetchIntervalMinutes ?? 10;
        
        var uptimeJob = connection.GetRecurringJobs().FirstOrDefault(j => j.Id == "dispatch-uptimerobot-uptime");
        if (uptimeJob == null)
        {
            recurringJobManager.AddOrUpdate<UptimeDispatcherJob>(
                    "dispatch-uptimerobot-uptime",
                    newJob => newJob.ExecuteAsync(),
                    CronHelper.FromMinutes(uptimeInterval));
        }
        
        var latencyJob = connection.GetRecurringJobs().FirstOrDefault(j => j.Id == "dispatch-uptimerobot-latency");
        if (latencyJob == null)
        {
            recurringJobManager.AddOrUpdate<LatencyDispatcherJob>(
                "dispatch-uptimerobot-latency",
                newJob => newJob.ExecuteAsync(),
                CronHelper.FromMinutes(latencyInterval));
        }
        
        var litiumFetchInterval = Math.Max(1, config?.LitiumFetchIntervalMinutes ?? 10);
        var litiumJob = connection.GetRecurringJobs().FirstOrDefault(j => j.Id == "dispatch-litium-orders");
        if (litiumJob == null)
        {
            recurringJobManager.AddOrUpdate<LitiumOrderFetchJob>(
                "dispatch-litium-orders",
                newJob => newJob.ExecuteAsync(),
                CronHelper.FromMinutes(litiumFetchInterval));
        }
        
        var latencyMatViewJob = connection.GetRecurringJobs().FirstOrDefault(j => j.Id == "refresh-latency-materialized-views");
        if (latencyMatViewJob == null)
        {
            recurringJobManager.AddOrUpdate<RefreshLatencyMaterializedViewJob>(
                "refresh-latency-materialized-views",
                newJob => newJob.ExecuteAsync(),
                Cron.Daily);
        }
        
        var financialMatViewJob = connection.GetRecurringJobs().FirstOrDefault(j => j.Id == "refresh-financial-materialized-views");
        if (financialMatViewJob == null)
        {
            recurringJobManager.AddOrUpdate<RefreshFinancialMaterializedViewJob>(
                "refresh-financial-materialized-views",
                newJob => newJob.ExecuteAsync(),
                Cron.Daily);
        }

        var cleanupJob = connection.GetRecurringJobs().FirstOrDefault(j => j.Id == "system-event-cleanup");
        if (cleanupJob == null)
        {
            recurringJobManager.AddOrUpdate<SystemEventCleanupJob>(
                "system-event-cleanup",
                newJob => newJob.ExecuteAsync(),
                Cron.Daily(2)); // Run daily at 02:00
        }
    }
}

app.Run();
