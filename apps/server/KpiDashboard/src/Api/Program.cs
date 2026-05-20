using Api.DTOs.Tenants;
using Api.Exceptions;
using Api.Validators.Tenants;
using DotNetEnv;
using FluentValidation;
using Hangfire;
using Hangfire.PostgreSql;
using Hangfire.Storage;
using Infrastructure;
using Infrastructure.Jobs;
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
builder.Services.AddScoped<IMonitorOrchestrationService, MonitorOrchestrationService>();
builder.Services.AddTransient<UptimeRobotRateLimitHandler>();
builder.Services.AddHttpClient<Infrastructure.Services.Monitoring.IUptimeRobotService, Infrastructure.Services.Monitoring.UptimeRobotService>()
    .AddHttpMessageHandler<UptimeRobotRateLimitHandler>();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddMemoryCache();

builder.Services.AddHttpClient<Infrastructure.Services.ITenantIngestionService, Infrastructure.Services.TenantIngestionService>()
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
        var config = context.GlobalConfigs.FirstOrDefault();
        
        var uptimeInterval = config?.UptimeFetchIntervalMinutes ?? 60;
        var latencyInterval = config?.LatencyFetchIntervalMinutes ?? 10;
        

        
        var uptimeJob = connection.GetRecurringJobs().FirstOrDefault(j => j.Id == "dispatch-uptimerobot-uptime");
        if (uptimeJob == null)
        {
            recurringJobManager.AddOrUpdate<UptimeDispatcherJob>("dispatch-uptimerobot-uptime", newJob => newJob.ExecuteAsync(), CronHelper.FromMinutes(uptimeInterval));
        }
        
        var latencyJob = connection.GetRecurringJobs().FirstOrDefault(j => j.Id == "dispatch-uptimerobot-latency");
        if (latencyJob == null)
        {
            recurringJobManager.AddOrUpdate<LatencyDispatcherJob>("dispatch-uptimerobot-latency", newJob => newJob.ExecuteAsync(), CronHelper.FromMinutes(latencyInterval));
        }
        
        var litiumRateLimit = Math.Max(1, config?.LitiumRateLimit ?? 10);
        var litiumJob = connection.GetRecurringJobs().FirstOrDefault(j => j.Id == "dispatch-litium-orders");
        if (litiumJob == null)
        {
            recurringJobManager.AddOrUpdate<LitiumOrderFetchJob>("dispatch-litium-orders", newJob => newJob.ExecuteAsync(), CronHelper.FromMinutes(litiumRateLimit));
        }
    }
}

app.Run();
