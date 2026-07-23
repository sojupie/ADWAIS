using Adwais.Domain.Enums;

namespace Adwais.Infrastructure.DemoDataSeeding;

internal sealed record DemoTenantProfile(
    string Name,
    TenantType Type,
    string BaseUrl,
    int MinAov,
    int MaxAov,
    int DailyVolume,
    int VolumeVariance,
    decimal SeasonalMultiplier);

internal sealed record DemoMonitorSpec(
    string Name,
    string Url,
    string HttpMethod,
    int TimeoutSeconds,
    IReadOnlyList<string> Regions,
    IReadOnlyList<string> Tags);

internal sealed record DemoReliabilityProfile(
    double TypicalUptime,
    double DailyJitter,
    double IncidentChance,
    double IncidentMinimum,
    double IncidentMaximum,
    double UptimeSla);

internal static class DemoDataCatalog
{
    public static readonly IReadOnlyList<DemoTenantProfile> Tenants =
    [
        // B2B: high-value account and procurement ordering.
        new("W.W. Grainger", TenantType.B2B, "https://www.grainger.com", 4_000, 55_000, 18, 7, 1.10m),
        new("Fastenal", TenantType.B2B, "https://www.fastenal.com", 3_000, 42_000, 24, 9, 1.08m),
        new("Thermo Fisher Scientific", TenantType.B2B, "https://www.thermofisher.com", 12_000, 180_000, 8, 4, 1.04m),
        new("Siemens AG", TenantType.B2B, "https://www.siemens.com", 15_000, 220_000, 7, 4, 1.03m),
        new("Caterpillar", TenantType.B2B, "https://parts.cat.com", 9_000, 150_000, 9, 5, 1.06m),
        new("CDW Corporation", TenantType.B2B, "https://www.cdw.com", 6_000, 95_000, 20, 8, 1.16m),
        new("Ferguson", TenantType.B2B, "https://www.ferguson.com", 5_000, 70_000, 22, 9, 1.08m),
        new("MSC Industrial Supply", TenantType.B2B, "https://www.mscdirect.com", 3_500, 48_000, 25, 10, 1.09m),
        new("BASF", TenantType.B2B, "https://www.basf.com", 18_000, 260_000, 6, 3, 1.02m),
        new("Schneider Electric", TenantType.B2B, "https://www.se.com", 8_000, 125_000, 12, 5, 1.05m),

        // B2C: lower basket values and substantially higher order volume.
        new("ASOS", TenantType.B2C, "https://www.asos.com", 350, 3_200, 320, 75, 1.85m),
        new("H&M", TenantType.B2C, "https://www.hm.com", 300, 2_600, 430, 95, 1.75m),
        new("Sephora", TenantType.B2C, "https://www.sephora.com", 400, 3_800, 280, 65, 1.70m),
        new("Chewy", TenantType.B2C, "https://www.chewy.com", 450, 4_200, 245, 55, 1.25m),
        new("Wayfair", TenantType.B2C, "https://www.wayfair.com", 900, 12_000, 125, 38, 1.65m),
        new("Zalando", TenantType.B2C, "https://www.zalando.com", 450, 4_000, 260, 65, 1.80m),
        new("Decathlon", TenantType.B2C, "https://www.decathlon.com", 500, 5_500, 185, 48, 1.55m),
        new("Uniqlo", TenantType.B2C, "https://www.uniqlo.com", 350, 3_200, 235, 55, 1.65m),
        new("IKEA", TenantType.B2C, "https://www.ikea.com", 750, 14_000, 155, 42, 1.55m),
        new("Lululemon", TenantType.B2C, "https://www.lululemon.com", 700, 5_500, 115, 32, 1.60m),

        // Mixed: consumer storefronts plus wholesale or enterprise channels.
        new("Nike", TenantType.Mixed, "https://www.nike.com", 650, 9_000, 225, 58, 1.85m),
        new("Apple", TenantType.Mixed, "https://www.apple.com", 2_500, 65_000, 95, 28, 2.05m),
        new("Dell Technologies", TenantType.Mixed, "https://www.dell.com", 3_000, 85_000, 78, 24, 1.75m),
        new("Bosch", TenantType.Mixed, "https://www.bosch.com", 1_200, 35_000, 105, 32, 1.45m),
        new("LEGO", TenantType.Mixed, "https://www.lego.com", 450, 8_000, 185, 52, 2.30m),
        new("Sony", TenantType.Mixed, "https://www.sony.com", 1_800, 75_000, 82, 25, 1.90m),
        new("DJI", TenantType.Mixed, "https://www.dji.com", 2_500, 48_000, 58, 20, 1.80m),
        new("Stanley Black & Decker", TenantType.Mixed, "https://www.stanleyblackanddecker.com", 1_000, 28_000, 72, 24, 1.50m),
        new("L'Oréal", TenantType.Mixed, "https://www.loreal.com", 500, 16_000, 215, 58, 1.65m),
        new("Sennheiser", TenantType.Mixed, "https://www.sennheiser.com", 1_500, 32_000, 75, 22, 1.55m)
    ];

    public static DemoTenantProfile? FindTenant(string name)
        => Tenants.FirstOrDefault(profile => profile.Name == name);

    public static IReadOnlyList<DemoMonitorSpec> GetMonitors(DemoTenantProfile tenant)
    {
        var commerceName = tenant.Type == TenantType.B2B ? "Procurement portal" : "Online store";
        var journeyName = tenant.Type switch
        {
            TenantType.B2B => "Account sign-in",
            TenantType.B2C => "Checkout journey",
            _ => "Partner portal"
        };
        var journeyPath = tenant.Type switch
        {
            TenantType.B2B => "account",
            TenantType.B2C => "checkout",
            _ => "business"
        };

        return
        [
            new(
                commerceName,
                tenant.BaseUrl,
                "HEAD",
                30,
                ["eu", "na"],
                ["PROD", "CUSTOMER-FACING"]),
            new(
                journeyName,
                CombineUrl(tenant.BaseUrl, journeyPath),
                "GET",
                45,
                tenant.Type == TenantType.B2C ? ["eu", "na", "apac"] : ["eu", "na"],
                ["PROD", tenant.Type == TenantType.B2B ? "B2B" : "COMMERCE"]),
            new(
                "Test storefront",
                BuildEnvironmentUrl(tenant.BaseUrl, "test", "smoke"),
                "GET",
                45,
                ["eu"],
                ["TEST", "QA", "INTERNAL"]),
            new(
                "Development API",
                BuildEnvironmentUrl(tenant.BaseUrl, "dev-api", "health"),
                "GET",
                20,
                ["eu"],
                ["DEV", "API", "INTERNAL"])
        ];
    }

    public static DemoReliabilityProfile GetReliability(int monitorOrdinal)
        => (Math.Abs(monitorOrdinal) % 20) switch
        {
            <= 13 => new(99.995, 0.004, 0.001, 99.50, 99.92, 99.90),
            <= 17 => new(99.975, 0.012, 0.003, 99.20, 99.85, 99.90),
            18 => new(99.930, 0.025, 0.008, 98.50, 99.65, 99.90),
            _ => new(99.800, 0.080, 0.015, 97.50, 99.35, 99.50)
        };

    public static double GenerateUptime(Random random, DemoReliabilityProfile reliability)
    {
        if (random.NextDouble() < reliability.IncidentChance)
        {
            return RandomBetween(random, reliability.IncidentMinimum, reliability.IncidentMaximum);
        }

        return Math.Clamp(
            reliability.TypicalUptime + RandomBetween(random, -reliability.DailyJitter, reliability.DailyJitter),
            0,
            100);
    }

    private static string CombineUrl(string baseUrl, string relativePath)
        => new Uri(new Uri(baseUrl.TrimEnd('/') + "/"), relativePath).ToString().TrimEnd('/');

    private static string BuildEnvironmentUrl(string baseUrl, string subdomain, string relativePath)
    {
        var baseUri = new Uri(baseUrl);
        var productionHost = baseUri.Host.StartsWith("www.", StringComparison.OrdinalIgnoreCase)
            ? baseUri.Host[4..]
            : baseUri.Host;
        var builder = new UriBuilder(baseUri)
        {
            Host = $"{subdomain}.{productionHost}",
            Path = relativePath
        };

        return builder.Uri.ToString().TrimEnd('/');
    }

    private static double RandomBetween(Random random, double minimum, double maximum)
        => minimum + random.NextDouble() * (maximum - minimum);
}
