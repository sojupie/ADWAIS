using System;

namespace Adwais.Api.DTOs.System;

public record SystemHealthDto(
    string DatabaseStatus,
    HangfireHealthDto Hangfire,
    SyncHealthDto Sync,
    DateTimeOffset? LastLitiumSync,
    DateTimeOffset? LastBlogSync,
    DateTimeOffset? LastFleetUpdate,
    DateTimeOffset? LastFleetUptimeUpdate,
    DateTimeOffset? LastFleetLatencyUpdate
);

public record HangfireHealthDto(
    string Status, // "Healthy", "Warning", "Failed"
    long FailedCount,
    long ProcessingCount,
    long EnqueuedCount,
    long ScheduledCount
);

public record SyncHealthDto(
    string Status, // "Healthy", "Degraded", "Failed"
    int TenantsWithErrorsCount,
    int MonitorsWithErrorsCount,
    int FeedsWithErrorsCount,
    string? GlobalSyncError
);

public record BackgroundJobStatusDto(
    string JobId,
    string JobName,
    string? JobArgs,
    string State,
    DateTime? CreatedAt,
    double? DurationSeconds,
    string? ExceptionMessage
);
