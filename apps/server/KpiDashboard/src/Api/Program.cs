using DotNetEnv;
using Infrastructure;
using Microsoft.EntityFrameworkCore;
using Quartz;

var builder = WebApplication.CreateBuilder(args);

Env.Load();
builder.Configuration.AddEnvironmentVariables();

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddOpenApi();
builder.Services.AddScoped<Infrastructure.Services.ITenantIngestionService, Infrastructure.Services.TenantIngestionService>();

var connectionString = builder.Configuration.GetConnectionString("AnalyticsDb");
builder.Services.AddDbContextFactory<AnalyticsDbContext>(options =>
{
    options.UseNpgsql(connectionString)
        .UseSnakeCaseNamingConvention(); 
});

builder.Services.AddQuartz(q =>
{
    var jobKey = new JobKey("CacheRefreshJob");
    
    q.AddJob<Infrastructure.Jobs.CacheRefreshJob>(opts => opts.WithIdentity(jobKey));

    q.AddTrigger(opts => opts
        .ForJob(jobKey)
        .WithIdentity("CacheRefreshJob-trigger")
        .WithCronSchedule("0 0 2 * * ?"));
});

//to do: implement fault handling, exponential back-off either with quartz or MS http polly
builder.Services.AddQuartz(q =>
{
    var ingestionJobKey = new JobKey("TenantIngestionJob");
    
    q.AddJob<Infrastructure.Jobs.TenantIngestionJob>(opts => opts.WithIdentity(ingestionJobKey));
    
    q.AddTrigger(opts => opts
        .ForJob(ingestionJobKey)
        .WithIdentity("TenantIngestionJob-trigger")
        .WithCronSchedule("0 0/10 * * * ?")); 
});

builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapControllers();
app.Run();