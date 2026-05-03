using DotNetEnv;
using Infrastructure;
using Microsoft.EntityFrameworkCore;
using Hangfire;
using Hangfire.PostgreSql;
using Swashbuckle.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

Env.Load();
builder.Configuration.AddEnvironmentVariables();

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddHttpClient<Infrastructure.Services.Monitoring.IUptimeRobotService, Infrastructure.Services.Monitoring.UptimeRobotService>();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("AnalyticsDb");

builder.Services.AddDbContextFactory<AnalyticsDbContext>(options =>
{
    options.UseNpgsql(connectionString)
        .UseSnakeCaseNamingConvention(); 
});

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

// builder.Services.AddQuartz(q =>
// {
//     var jobKey = new JobKey("CacheRefreshJob");
//     
//     q.AddJob<Infrastructure.Jobs.CacheRefreshJob>(opts => opts.WithIdentity(jobKey));
//
//     q.AddTrigger(opts => opts
//         .ForJob(jobKey)
//         .WithIdentity("CacheRefreshJob-trigger")
//         .WithCronSchedule("0 0 2 * * ?"));
// });
//
// //to do: implement fault handling, exponential back-off either with quartz or MS http polly
// builder.Services.AddQuartz(q =>
// {
//     var ingestionJobKey = new JobKey("TenantIngestionJob");
//     
//     q.AddJob<Infrastructure.Jobs.TenantIngestionJob>(opts => opts.WithIdentity(ingestionJobKey));
//     
//     q.AddTrigger(opts => opts
//         .ForJob(ingestionJobKey)
//         .WithIdentity("TenantIngestionJob-trigger")
//         .WithCronSchedule("0 0/10 * * * ?")); 
// });
//
// builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);

var app = builder.Build();

app.MapOpenApi();
app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();
app.Run();