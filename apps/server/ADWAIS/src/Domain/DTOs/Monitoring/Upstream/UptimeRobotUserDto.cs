namespace Adwais.Domain.DTOs.Monitoring.Upstream;

public record UptimeRobotUserDto(
    string Email,
    string FullName,
    int MonitorsCount,
    int MonitorLimit,
    string ActiveSubscriptionPlan);


