using Adwais.Application.Common.Models;
using Adwais.Application.Interfaces;
using Adwais.Application.Services;
using Adwais.Domain.Entities;
using Adwais.Domain.Entities.OrderData;
using Adwais.Domain.Enums;
using Adwais.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace Adwais.Tests.Services;

public class FinancialServiceTests : IDisposable
{
    private readonly AnalyticsDbContext _dbContext;
    private readonly FinancialService _service;
    private readonly ResolvedPeriod _period;
    private readonly Guid _b2bTenantId = Guid.NewGuid();
    private readonly Guid _b2cTenantId = Guid.NewGuid();

    public FinancialServiceTests()
    {
        var options = new DbContextOptionsBuilder<AnalyticsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _dbContext = new AnalyticsDbContext(options);
        _service = new FinancialService(_dbContext, Mock.Of<IReportingCalendar>());

        var currentStart = DateTimeOffset.UtcNow.AddHours(-2);
        _period = new ResolvedPeriod(
            currentStart,
            currentStart.AddHours(2),
            currentStart.AddHours(-2),
            currentStart,
            2,
            isHourly: true,
            includeActualTime: true);

        _dbContext.Tenants.AddRange(
            new Tenant { Id = _b2bTenantId, Name = "Wholesale", Type = TenantType.B2B },
            new Tenant { Id = _b2cTenantId, Name = "Retail", Type = TenantType.B2C });
        AddOrder(_b2bTenantId, _period.CurrentStart.AddMinutes(30), 100m, "b2b-current");
        AddOrder(_b2bTenantId, _period.PreviousStart.AddMinutes(30), 50m, "b2b-previous");
        AddOrder(_b2cTenantId, _period.CurrentStart.AddMinutes(30), 300m, "b2c-current");
        AddOrder(_b2cTenantId, _period.PreviousStart.AddMinutes(30), 100m, "b2c-previous");
        _dbContext.SaveChanges();
    }

    [Fact]
    public async Task GetKpisAsync_WithTenantTypes_RecalculatesPortfolioFromMatchingTenants()
    {
        var result = await _service.GetKpisAsync(
            _period,
            tenantTypes: [TenantType.B2B],
            ct: CancellationToken.None);

        Assert.Equal(100m, result.CurrentRevenue);
        Assert.Equal(50m, result.PreviousRevenue);
        Assert.Equal(100m, result.RevenueGrowthPercentage);
        Assert.Equal(1, result.TransactionVolume);
        Assert.Equal(1, result.ActiveTenants);
        Assert.Equal(100m, result.AverageOrderValue);
    }

    [Fact]
    public async Task PortfolioCharts_WithTenantTypes_RecalculateReferenceValuesAndSeries()
    {
        var accumulated = await _service.GetAccumulatedRevenueAsync(
            _period,
            tenantTypes: [TenantType.B2C],
            ct: CancellationToken.None);
        var efficiency = await _service.GetRevenueEfficiencyAsync(
            _period,
            [TenantType.B2B],
            CancellationToken.None);
        var portfolioImpact = await _service.GetPortfolioImpactAsync(
            _period,
            [TenantType.B2B],
            CancellationToken.None);

        var distribution = await _service.GetCrossSegmentDistributionAsync(
            _period,
            [TenantType.B2B],
            CancellationToken.None);

        Assert.Equal(300m, accumulated[^1].CurrentAccumulated);
        Assert.Single(efficiency.Tenants);
        Assert.Equal(_b2bTenantId, efficiency.Tenants[0].TenantId);
        Assert.Equal(100m, efficiency.GlobalAverageOrderValue);
        Assert.Equal(100m, efficiency.Tenants[0].PortfolioSharePercentage);
        Assert.Single(portfolioImpact.Tenants);
        Assert.Equal(100m, portfolioImpact.GlobalGrowthPercentage);
        Assert.Equal(50m, portfolioImpact.MedianBaselineRevenue);
        Assert.Equal(100m, portfolioImpact.Tenants[0].PortfolioSharePercentage);
        Assert.Equal(100m, portfolioImpact.MedianPortfolioShare);

        Assert.Single(distribution.Cohorts);
        Assert.Equal(TenantType.B2B, distribution.Cohorts[0].Type);
        Assert.Equal(100m, distribution.Cohorts[0].MedianAov);
        Assert.Single(distribution.Tenants);
        Assert.Equal(_b2bTenantId, distribution.Tenants[0].TenantId);
        Assert.Equal(100m, distribution.Tenants[0].PeriodRevenue);
    }

    private void AddOrder(Guid tenantId, DateTimeOffset createdDate, decimal value, string litiumOrderId)
    {
        _dbContext.Orders.Add(new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            LitiumOrderId = litiumOrderId,
            CreatedDate = createdDate,
            TotalValueIncVat = value,
            TotalValueExcVat = value,
            OrderState = OrderState.Completed,
        });
    }

    public void Dispose()
    {
        _dbContext.Dispose();
        GC.SuppressFinalize(this);
    }
}
