using Api.DTOs.Tenants;
using Api.Exceptions;
using Api.Validators.Tenants;
using DotNetEnv;
using FluentValidation;
using Hangfire;
using Hangfire.PostgreSql;
using Infrastructure;
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
builder.Services.AddHttpClient<Infrastructure.Services.Monitoring.IUptimeRobotService, Infrastructure.Services.Monitoring.UptimeRobotService>();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

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

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var contextFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<AnalyticsDbContext>>();
    using var context = await contextFactory.CreateDbContextAsync();
    context.Database.Migrate();
}

app.Run();
