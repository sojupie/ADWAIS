using System.ComponentModel.DataAnnotations;

namespace Adwais.Api.DTOs.Financial;

public record TransactionDensityPointResponseDto(
    [property: Required] int DayOfWeek,
    [property: Required] int Hour,
    [property: Required] int Count,
    [property: Required] decimal TotalRevenue);


