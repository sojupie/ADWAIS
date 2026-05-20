using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public interface ISystemEventService
{
    Task LogAsync(string source, string message, SystemEventLevel level = SystemEventLevel.Information, string? details = null, Guid? tenantId = null);
    Task LogWarningAsync(string source, string message, string? details = null, Guid? tenantId = null);
    Task LogErrorAsync(string source, string message, Exception? ex = null, Guid? tenantId = null);
}

public class SystemEventService(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    ILogger<SystemEventService> logger) : ISystemEventService
{
    public async Task LogAsync(string source, string message, SystemEventLevel level = SystemEventLevel.Information, string? details = null, Guid? tenantId = null)
    {
        try
        {
            await using var db = await dbContextFactory.CreateDbContextAsync();
            var systemEvent = new SystemEvent
            {
                Source = source,
                Message = message,
                Level = level,
                Details = details,
                TenantId = tenantId
            };

            db.SystemEvents.Add(systemEvent);
            await db.SaveChangesAsync();
            
            var logLevel = level switch
            {
                SystemEventLevel.Information => LogLevel.Information,
                SystemEventLevel.Warning => LogLevel.Warning,
                SystemEventLevel.Error => LogLevel.Error,
                SystemEventLevel.Critical => LogLevel.Critical,
                _ => LogLevel.Information
            };
            
            logger.Log(logLevel, "[{Source}] {Message} (Tenant: {TenantId})", source, message, tenantId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to persist SystemEvent from {Source}: {Message}", source, message);
        }
    }

    public Task LogWarningAsync(string source, string message, string? details = null, Guid? tenantId = null)
        => LogAsync(source, message, SystemEventLevel.Warning, details, tenantId);

    public Task LogErrorAsync(string source, string message, Exception? ex = null, Guid? tenantId = null)
        => LogAsync(source, message, SystemEventLevel.Error, ex?.ToString(), tenantId);
}