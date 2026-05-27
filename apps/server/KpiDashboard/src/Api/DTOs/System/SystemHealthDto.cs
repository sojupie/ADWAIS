using System;

namespace Api.DTOs.System;

public record SystemHealthDto(
    string DatabaseStatus,
    HangfireHealthDto Hangfire,
    SyncHealthDto Sync,
    DateTimeOffset? LastLitiumSync,
    DateTimeOffset? LastFleetUpdate,
    DateTimeOffset? LastFleetUptimeUpdate,
    DateTimeOffset? LastFleetLatencyUpdate
);

public record HangfireHealthDto(
    long FailedCount,
    long ProcessingCount,
    long EnqueuedCount,
    long ScheduledCount
);

public record SyncHealthDto(
    int TenantsWithErrorsCount,
    int MonitorsWithErrorsCount,
    string? GlobalSyncError
);
