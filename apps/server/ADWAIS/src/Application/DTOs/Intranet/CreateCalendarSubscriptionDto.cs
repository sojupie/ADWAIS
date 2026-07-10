namespace Adwais.Application.DTOs.Intranet;

public record CreateCalendarSubscriptionDto(
    string Name,
    string Url,
    bool IsActive
);
