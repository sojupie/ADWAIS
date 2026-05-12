namespace Infrastructure.Services.Monitoring;

public record UptimeRobotMonitorDto(int Id, string FriendlyName, string Url, string Status);