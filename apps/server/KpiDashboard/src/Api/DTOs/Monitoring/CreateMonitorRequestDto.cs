namespace Api.DTOs.Monitoring;

public record CreateMonitorRequestDto(
    string Name, 
    string Url, 
    double? UptimeSla);