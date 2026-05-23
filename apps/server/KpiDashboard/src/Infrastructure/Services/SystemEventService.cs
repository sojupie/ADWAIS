using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Provides a service for logging system events to the database and standard logging.
/// </summary>
public interface ISystemEventService
{
    /// <summary>
    /// Logs a system event with a specific level, source, and message.
    /// </summary>
    /// <param name="source">The source of the event (e.g., service name).</param>
    /// <param name="message">The main message for the event.</param>
    /// <param name="level">The severity level of the event.</param>
    /// <param name="details">Optional detailed information or stack trace.</param>
    /// <param name="tenantId">Optional tenant ID associated with the event.</param>
    Task LogAsync(string source, string message, SystemEventLevel level = SystemEventLevel.Information, string? details = null, Guid? tenantId = null);

    /// <summary>
    /// Logs a warning event.
    /// </summary>
    /// <param name="source">The source of the event.</param>
    /// <param name="message">The main message.</param>
    /// <param name="details">Optional detailed information.</param>
    /// <param name="tenantId">Optional tenant ID.</param>
    Task LogWarningAsync(string source, string message, string? details = null, Guid? tenantId = null);

    /// <summary>
    /// Logs an error event, including exception details.
    /// </summary>
    /// <param name="source">The source of the event.</param>
    /// <param name="message">The main message.</param>
    /// <param name="ex">Optional exception that occurred.</param>
    /// <param name="tenantId">Optional tenant ID.</param>
    Task LogErrorAsync(string source, string message, Exception? ex = null, Guid? tenantId = null);
}

/// <summary>
/// Implementation of ISystemEventService that persists events to the database and logs them using ILogger.
/// </summary>
public class SystemEventService(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    ILogger<SystemEventService> logger) : ISystemEventService
{
    /// <inheritdoc />
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

    /// <inheritdoc />
    public Task LogWarningAsync(string source, string message, string? details = null, Guid? tenantId = null)
        => LogAsync(source, message, SystemEventLevel.Warning, details, tenantId);

    /// <inheritdoc />
    public Task LogErrorAsync(string source, string message, Exception? ex = null, Guid? tenantId = null)
        => LogAsync(source, message, SystemEventLevel.Error, ex?.ToString(), tenantId);
}