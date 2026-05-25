using System;

namespace Api.DTOs.GlobalConfig;

public record GlobalConfigResponseDto(
    int Id,
    DateTimeOffset? LastPolled,
    bool LitiumFetchEnabled,
    bool UptimeRobotFetchEnabled,
    int LitiumFetchIntervalMinutes,
    int? LatencyDegradedFloor,
    string? UptimeRobotApiKey,
    int UptimeFetchIntervalMinutes,
    int LatencyFetchIntervalMinutes,
    int UserStatsFetchIntervalMinutes,
    int SystemEventRetentionDays,
    int? MonitorsCount,
    int? MonitorsLimit,
    string? ActiveSubscription
);
