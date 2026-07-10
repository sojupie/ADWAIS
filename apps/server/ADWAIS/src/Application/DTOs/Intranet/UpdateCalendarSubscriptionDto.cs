namespace Adwais.Application.DTOs.Intranet;

public record UpdateCalendarSubscriptionDto(
    string? Name,
    string? Url,
    bool? IsActive
);
