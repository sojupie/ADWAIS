using Adwais.Domain.Entities;
using Adwais.Domain.Entities.Intranet;
using Adwais.Domain.Entities.Monitoring;
using Adwais.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Adwais.Infrastructure.DemoDataSeeding;

public static class DatabaseSeeder
{
    private static readonly double[] HourlyWeights = 
    { 
        0.020, 0.010, 0.005, 0.005, 0.007, 0.010, 0.020, 0.035, 
        0.050, 0.058, 0.065, 0.068, 0.075, 0.075, 0.068, 0.060, 
        0.050, 0.045, 0.048, 0.055, 0.070, 0.075, 0.065, 0.042 
    };

    private static readonly double[] DailyWeights = 
    { 
        0.12, 0.16, 0.16, 0.15, 0.16, 0.14, 0.11 
    };

    public static async Task SeedSampleDataAsync(AnalyticsDbContext context)
    {
        var random = new Random(42);
        var forceReSeed = Environment.GetEnvironmentVariable("RESEED") == "true";
        var reportingTimeZoneId = await context.GlobalConfigs
            .Select(config => config.ReportingTimeZoneId)
            .SingleAsync();
        var reportingTimeZone = TimeZoneInfo.FindSystemTimeZoneById(reportingTimeZoneId);

        if (forceReSeed)
        {
            Console.WriteLine("Forcing re-seed of demo tenant, monitor, and order data...");
            var currentDemoNames = DemoDataCatalog.Tenants.Select(profile => profile.Name).ToArray();
            var legacyTenants = await context.Tenants
                .Where(tenant => tenant.Name.EndsWith(" [MOCK]"))
                .ToListAsync();
            var demoTenantIds = await context.Tenants
                .Where(tenant => currentDemoNames.Contains(tenant.Name) || tenant.Name.EndsWith(" [MOCK]"))
                .Select(tenant => tenant.Id)
                .ToListAsync();

            await context.Orders
                .Where(order => demoTenantIds.Contains(order.TenantId))
                .ExecuteDeleteAsync();
            await context.Monitors
                .Where(monitor => monitor.Id < 0)
                .ExecuteDeleteAsync();

            var legacyTenantIdsWithLiveMonitors = await context.Monitors
                .Where(monitor => monitor.Id > 0 && demoTenantIds.Contains(monitor.TenantId))
                .Select(monitor => monitor.TenantId)
                .Distinct()
                .ToListAsync();
            context.Tenants.RemoveRange(
                legacyTenants.Where(tenant => !legacyTenantIdsWithLiveMonitors.Contains(tenant.Id)));
            await context.SaveChangesAsync();
        }

        if (!await context.FeedSources.AnyAsync())
        {
            context.FeedSources.AddRange(
                new FeedSource { Id = Guid.NewGuid(), Name = "Litium Blog", Url = "https://www.litium.com/blog", IsActive = true },
                new FeedSource { Id = Guid.NewGuid(), Name = "Litium Reports & Guides", Url = "https://www.litium.com/reports-and-guides", IsActive = true },
                new FeedSource { Id = Guid.NewGuid(), Name = "Litium Cision News", Url = "https://news.cision.com/se/litium/ListItems?format=rss", IsActive = true },
                new FeedSource { Id = Guid.NewGuid(), Name = "Motillo Aktuellt", Url = "https://www.motillo.com/sv/aktuellt", IsActive = true },
                new FeedSource { Id = Guid.NewGuid(), Name = "Litium Nyhetsrum", Url = "https://www.litium.se/nyhetsrum", IsActive = true },
                new FeedSource { Id = Guid.NewGuid(), Name = "Litium Rapporter & Guider (SV)", Url = "https://www.litium.se/insikter/rapporter-guider", IsActive = true }
            );
            await context.SaveChangesAsync();
        }

        if (!forceReSeed && await context.Tenants.AnyAsync(tenant => tenant.Name.EndsWith(" [MOCK]")))
        {
            Console.WriteLine("Legacy demo data detected. Set RESEED=true to replace it with the current demo portfolio.");
            return;
        }

        var tenants = await SeedTenantsAsync(context);

        var monitoringStopwatch = System.Diagnostics.Stopwatch.StartNew();
        await SeedMonitorsAndMetricsAsync(context, tenants, random);
        Console.WriteLine($"Monitoring seed completed in {monitoringStopwatch.Elapsed.TotalSeconds:F1} seconds.");

        var seededTenantIds = tenants.Select(tenant => tenant.Id).ToArray();
        if (!forceReSeed && await context.Orders.AnyAsync(order => seededTenantIds.Contains(order.TenantId)))
        {
            Console.WriteLine("Demo orders already exist, skipping order seed.");
            return;
        }

        var endDate = DateTimeOffset.UtcNow;
        var startDate = endDate.AddMonths(-24);

        Console.WriteLine($"Seeding 2 years of historical data for {tenants.Count} tenants...");
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var orderStopwatch = System.Diagnostics.Stopwatch.StartNew();
        var orderCount = await BulkInsertOrdersAsync(
            context,
            tenants,
            startDate,
            endDate,
            random,
            reportingTimeZone);
        Console.WriteLine($"Inserted {orderCount:N0} orders in {orderStopwatch.Elapsed.TotalSeconds:F1} seconds.");

        var views = new[]
        {
            "v_mat_financial_daily_tenant_rollup",
            "v_mat_financial_daily_global_rollup",
            "v_mat_daily_latency_monitor_rollup",
            "v_mat_daily_latency_tenant_rollup",
            "v_mat_daily_latency_global_rollup",
            "v_mat_daily_availability_monitor_rollup",
            "v_mat_daily_availability_tenant_rollup",
            "v_mat_daily_availability_global_rollup"
        };

        foreach (var view in views)
        {
            var viewStopwatch = System.Diagnostics.Stopwatch.StartNew();
#pragma warning disable EF1003
            await context.Database.ExecuteSqlRawAsync("REFRESH MATERIALIZED VIEW " + view + ";");
#pragma warning restore EF1003
            Console.WriteLine($"Refreshed {view} in {viewStopwatch.Elapsed.TotalSeconds:F1} seconds.");
        }

        Console.WriteLine($"Seeding completed in {sw.Elapsed.TotalMinutes:F2} minutes.");
    }

    private static int GetWeightedHour(Random random)
    {
        double r = random.NextDouble() * HourlyWeights.Sum();
        double sum = 0;
        for (int i = 0; i < HourlyWeights.Length; i++)
        {
            sum += HourlyWeights[i];
            if (r <= sum) return i;
        }
        return 23; 
    }

    private static async Task<long> BulkInsertOrdersAsync(
        AnalyticsDbContext context,
        IReadOnlyCollection<Tenant> tenants,
        DateTimeOffset startDate,
        DateTimeOffset endDate,
        Random random,
        TimeZoneInfo reportingTimeZone)
    {
        var connection = (NpgsqlConnection)context.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

        using var writer = connection.BeginBinaryImport(
            "COPY orders (id, tenant_id, order_state, litium_order_id, created_date, total_value_inc_vat, total_value_exc_vat, currency) FROM STDIN (FORMAT BINARY)");

        long count = 0;
        foreach (var tenant in tenants)
        {
            var profile = DemoDataCatalog.FindTenant(tenant.Name)
                ?? throw new InvalidOperationException($"No demo profile exists for tenant '{tenant.Name}'.");
            count += WriteOrdersForTenant(
                writer,
                tenant,
                profile,
                startDate,
                endDate,
                random,
                reportingTimeZone);
        }

        writer.Complete();
        return count;
    }

    private static int WriteOrdersForTenant(
        NpgsqlBinaryImporter writer,
        Tenant tenant,
        DemoTenantProfile profile,
        DateTimeOffset startDate,
        DateTimeOffset endDate,
        Random random,
        TimeZoneInfo reportingTimeZone)
    {
        var count = 0;
        double weeklyVolume = profile.DailyVolume * 7.0;

        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            var localDate = TimeZoneInfo.ConvertTime(date, reportingTimeZone);
            double dayWeight = DailyWeights[(int)localDate.DayOfWeek];
            double expectedBaseDailyVolume = weeklyVolume * dayWeight;
            
            var dailyVolume = (int)expectedBaseDailyVolume + random.Next(-profile.VolumeVariance, profile.VolumeVariance + 1);
            if (dailyVolume < 0) dailyVolume = 0;
            
            var isHolidaySeason = localDate.Month == 11 || localDate.Month == 12;
            if (isHolidaySeason) dailyVolume = (int)(dailyVolume * (double)profile.SeasonalMultiplier);

            for (int i = 0; i < dailyVolume; i++)
            {
                int hour = GetWeightedHour(random);
                var localOrderDate = new DateTime(
                    localDate.Year,
                    localDate.Month,
                    localDate.Day,
                    hour,
                    random.Next(0, 60),
                    random.Next(0, 60),
                    DateTimeKind.Unspecified);
                if (reportingTimeZone.IsInvalidTime(localOrderDate)) localOrderDate = localOrderDate.AddHours(1);
                var orderDate = new DateTimeOffset(
                    TimeZoneInfo.ConvertTimeToUtc(localOrderDate, reportingTimeZone),
                    TimeSpan.Zero);

                double u1 = 1.0 - random.NextDouble();
                double u2 = 1.0 - random.NextDouble();
                double randStdNormal = Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Sin(2.0 * Math.PI * u2);

                double meanLog = Math.Log((double)profile.MinAov * 2.5); 
                double stdDevLog = 0.6; 

                double logNormalValue = Math.Exp(meanLog + stdDevLog * randStdNormal);

                decimal valueIncVat = Math.Round(
                    Math.Clamp((decimal)logNormalValue, profile.MinAov, profile.MaxAov),
                    2);

                decimal valueExcVat = Math.Round(valueIncVat / 1.25m, 2);

                writer.StartRow();
                writer.Write(Guid.NewGuid());
                writer.Write(tenant.Id);
                writer.Write("Completed");
                writer.Write($"SEED-{tenant.Id.ToString()[..4]}-{orderDate.Ticks}-{i}");
                writer.Write(orderDate);
                writer.Write(valueIncVat);
                writer.Write(valueExcVat);
                writer.Write("SEK");
                count++;
            }
        }

        return count;
    }

    private static async Task<List<Tenant>> SeedTenantsAsync(AnalyticsDbContext context)
    {
        var profileNames = DemoDataCatalog.Tenants.Select(profile => profile.Name).ToArray();
        var existingTenants = await context.Tenants
            .Where(tenant => profileNames.Contains(tenant.Name))
            .ToDictionaryAsync(tenant => tenant.Name);
        var tenants = new List<Tenant>();
        foreach (var profile in DemoDataCatalog.Tenants)
        {
            if (!existingTenants.TryGetValue(profile.Name, out var tenant))
            {
                tenant = new Tenant
                {
                    Id = Guid.NewGuid(),
                    Name = profile.Name,
                    Type = profile.Type,
                    LitiumBaseUrl = profile.BaseUrl,
                    ServiceAccountToken = $"seed-token-{profile.Name.GetHashCode()}",
                    OrderFetchingEnabled = false
                };
                context.Tenants.Add(tenant);
            }
            else
            {
                tenant.Type = profile.Type;
                tenant.LitiumBaseUrl = profile.BaseUrl;
                tenant.OrderFetchingEnabled = false;
            }
            tenants.Add(tenant);
        }
        await context.SaveChangesAsync();
        return tenants;
    }

    private static async Task SeedMonitorsAndMetricsAsync(
        AnalyticsDbContext context,
        IReadOnlyCollection<Tenant> tenants,
        Random random)
    {
        var tenantIds = tenants.Select(tenant => tenant.Id).ToArray();
        var existingMonitorRows = await context.Monitors
            .AsNoTracking()
            .Where(monitor => tenantIds.Contains(monitor.TenantId))
            .Select(monitor => new { monitor.TenantId, monitor.Name })
            .ToListAsync();
        var existingMonitorKeys = existingMonitorRows
            .Select(monitor => (monitor.TenantId, monitor.Name))
            .ToHashSet();
        var lowestExistingId = await context.Monitors.Where(m => m.Id < 0).MinAsync(m => (int?)m.Id) ?? 0;
        var nextId = lowestExistingId - 1;
        var monitorOrdinal = 0;

        foreach (var tenant in tenants)
        {
            var profile = DemoDataCatalog.FindTenant(tenant.Name)
                ?? throw new InvalidOperationException($"No demo profile exists for tenant '{tenant.Name}'.");

            foreach (var spec in DemoDataCatalog.GetMonitors(profile))
            {
                var currentOrdinal = monitorOrdinal++;
                if (!existingMonitorKeys.Add((tenant.Id, spec.Name)))
                    continue;

                var monitorId = nextId--;
                var reliability = DemoDataCatalog.GetReliability((int)(Math.Abs((long)monitorId) - 1));

                var lastIncidentStartedAt = currentOrdinal % 6 == 0
                    ? DateTimeOffset.UtcNow.AddDays(-random.Next(4, 75)).AddMinutes(-random.Next(5, 240))
                    : (DateTimeOffset?)null;
                var lastIncidentDurationSeconds = lastIncidentStartedAt.HasValue
                    ? random.Next(90, 7_200)
                    : (long?)null;
                var degradedFloor = reliability.TypicalUptime switch
                {
                    >= 99.98 => random.Next(380, 650),
                    >= 99.95 => random.Next(280, 480),
                    >= 99.80 => random.Next(170, 260),
                    _ => random.Next(125, 190)
                };

                context.Monitors.Add(new UptimeMonitor
                {
                    Id = monitorId,
                    TenantId = tenant.Id,
                    Name = spec.Name,
                    Url = spec.Url,
                    Type = UptimeMonitorTypes.Http,
                    UptimeSla = reliability.UptimeSla,
                    LatencyDegradedFloor = degradedFloor,
                    UptimeMonitorEnabled = true,
                    CreatedDate = DateTimeOffset.UtcNow.AddDays(-random.Next(730, 1_800)),
                    UpdateInterval = 300,
                    HttpMethod = spec.HttpMethod,
                    TimeoutSeconds = spec.TimeoutSeconds,
                    SslExpiresAt = DateTimeOffset.UtcNow.AddDays(random.Next(25, 260)),
                    DomainExpiresAt = DateTimeOffset.UtcNow.AddDays(random.Next(90, 700)),
                    MonitoredRegions = spec.Regions.ToList(),
                    CurrentStateDurationSeconds = random.NextInt64(3_600, 5_000_000),
                    Tags = spec.Tags.ToList(),
                    LastIncidentId = lastIncidentStartedAt.HasValue ? $"seed-{tenant.Id:N}-{currentOrdinal}" : null,
                    LastIncidentStatus = lastIncidentStartedAt.HasValue ? "Resolved" : null,
                    LastIncidentCause = lastIncidentStartedAt.HasValue ? "HTTP timeout" : null,
                    LastIncidentReason = lastIncidentStartedAt.HasValue ? "The endpoint exceeded its response timeout." : null,
                    LastIncidentStartedAt = lastIncidentStartedAt,
                    LastIncidentDurationSeconds = lastIncidentDurationSeconds
                });
            }
        }
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        var allMonitors = await context.Monitors
            .AsNoTracking()
            .Where(monitor => monitor.Id < 0)
            .OrderByDescending(monitor => monitor.Id)
            .ToListAsync();
        var monitorIds = allMonitors.Select(monitor => monitor.Id).ToArray();
        var monitorIdsWithAvailability = (await context.MonitorAvailabilities
                .AsNoTracking()
                .Where(availability => monitorIds.Contains(availability.MonitorId))
                .Select(availability => availability.MonitorId)
                .Distinct()
                .ToListAsync())
            .ToHashSet();
        var monitorIdsWithLatency = (await context.ResponseTimes
                .AsNoTracking()
                .Where(responseTime => monitorIds.Contains(responseTime.MonitorId))
                .Select(responseTime => responseTime.MonitorId)
                .Distinct()
                .ToListAsync())
            .ToHashSet();
        var seedNow = DateTimeOffset.UtcNow;
        var historyStartDate = seedNow.Date.AddDays(-729);
        var monitorsWithOrdinals = allMonitors
            .Select((monitor, ordinal) => (Monitor: monitor, Ordinal: ordinal))
            .ToArray();

        var availabilityTargets = monitorsWithOrdinals
            .Where(item => !monitorIdsWithAvailability.Contains(item.Monitor.Id))
            .ToArray();
        if (availabilityTargets.Length > 0)
        {
            var count = await CopyMonitorAvailabilityHistoryAsync(
                context,
                availabilityTargets,
                historyStartDate,
                seedNow,
                random);
            Console.WriteLine($"Inserted {count:N0} availability rows with binary COPY.");
        }

        var latencyTargets = monitorsWithOrdinals
            .Where(item => !monitorIdsWithLatency.Contains(item.Monitor.Id))
            .ToArray();
        if (latencyTargets.Length > 0)
        {
            var count = await CopyResponseTimeHistoryAsync(
                context,
                latencyTargets,
                historyStartDate,
                seedNow,
                random);
            Console.WriteLine($"Inserted {count:N0} response-time rows with binary COPY.");
        }
    }

    private static async Task<long> CopyMonitorAvailabilityHistoryAsync(
        AnalyticsDbContext context,
        IReadOnlyCollection<(UptimeMonitor Monitor, int Ordinal)> monitors,
        DateTimeOffset historyStartDate,
        DateTimeOffset historyEnd,
        Random random)
    {
        var connection = (NpgsqlConnection)context.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

        using var writer = connection.BeginBinaryImport(
            "COPY monitor_availability (monitor_id, date, uptime_percentage, is_finalized) FROM STDIN (FORMAT BINARY)");
        long count = 0;
        var currentUtcDayStart = new DateTimeOffset(historyEnd.UtcDateTime.Date, TimeSpan.Zero);

        foreach (var (monitor, ordinal) in monitors)
        {
            var reliability = DemoDataCatalog.GetReliability(ordinal);
            for (var date = historyStartDate.Date; date <= historyEnd.Date; date = date.AddDays(1))
            {
                var utcMidnight = new DateTimeOffset(date.Year, date.Month, date.Day, 0, 0, 0, TimeSpan.Zero);
                var dailyUptime = DemoDataCatalog.GenerateUptime(random, reliability);
                var sampleIntervalMinutes = date >= historyEnd.Date.AddDays(-13) ? 30 : 360;

                for (var minute = 0; minute < 24 * 60; minute += sampleIntervalMinutes)
                {
                    var timestamp = utcMidnight.AddMinutes(minute);
                    if (timestamp > historyEnd) break;

                    var uptimePercentage = Math.Clamp(
                        dailyUptime + (random.NextDouble() - 0.5) * reliability.DailyJitter,
                        0,
                        100);

                    writer.StartRow();
                    writer.Write(monitor.Id);
                    writer.Write(timestamp);
                    writer.Write(uptimePercentage);
                    writer.Write(timestamp < currentUtcDayStart);
                    count++;
                }
            }
        }

        writer.Complete();
        return count;
    }

    private static async Task<long> CopyResponseTimeHistoryAsync(
        AnalyticsDbContext context,
        IReadOnlyCollection<(UptimeMonitor Monitor, int Ordinal)> monitors,
        DateTimeOffset historyStartDate,
        DateTimeOffset historyEnd,
        Random random)
    {
        var connection = (NpgsqlConnection)context.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

        using var writer = connection.BeginBinaryImport(
            "COPY response_time (monitor_id, date, average, lowest, highest) FROM STDIN (FORMAT BINARY)");
        long count = 0;

        foreach (var (monitor, _) in monitors)
        {
            var stableBaseLatency = 80 + (int)(Math.Abs((long)monitor.Id) % 200);
            for (var date = historyStartDate.Date; date <= historyEnd.Date; date = date.AddDays(1))
            {
                var utcMidnight = new DateTimeOffset(date.Year, date.Month, date.Day, 0, 0, 0, TimeSpan.Zero);
                var sampleIntervalMinutes = date >= historyEnd.Date.AddDays(-13) ? 30 : 360;

                for (var minute = 0; minute < 24 * 60; minute += sampleIntervalMinutes)
                {
                    var timestamp = utcMidnight.AddMinutes(minute);
                    if (timestamp > historyEnd) break;

                    var avg = stableBaseLatency + random.Next(-10, 20);
                    var highest = avg + random.Next(10, 60);

                    double spikeChance = random.NextDouble();
                    if (spikeChance < 0.005)
                    {
                        highest += random.Next(800, 2500);
                        avg += random.Next(150, 400);
                    }
                    else if (spikeChance < 0.03)
                    {
                        highest += random.Next(150, 300);
                        avg += random.Next(30, 80);
                    }

                    writer.StartRow();
                    writer.Write(monitor.Id);
                    writer.Write(timestamp);
                    writer.Write((double)Math.Max(10, avg));
                    writer.Write((double)Math.Max(10, avg - random.Next(5, 20)));
                    writer.Write((double)highest);
                    count++;
                }
            }
        }

        writer.Complete();
        return count;
    }
}
