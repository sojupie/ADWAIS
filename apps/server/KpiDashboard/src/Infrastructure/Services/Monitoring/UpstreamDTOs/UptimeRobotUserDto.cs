namespace Infrastructure.Services.Monitoring.UpstreamDTOs;

public record UptimeRobotUserDto(
    string Email,
    string FullName,
    int MonitorsCount,
    int MonitorLimit,
    string ActiveSubscriptionPlan);
