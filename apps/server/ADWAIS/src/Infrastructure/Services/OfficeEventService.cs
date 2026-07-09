using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.Common.Interfaces;
using Adwais.Application.DTOs.Intranet;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Intranet;
using Adwais.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Infrastructure.Services;

public class OfficeEventService(IApplicationDbContext dbContext) : IOfficeEventService
{
    private readonly IApplicationDbContext _dbContext = dbContext;

    public async Task<OfficeEventDto?> GetEventByIdAsync(Guid id, CancellationToken ct = default)
    {
        var officeEvent = await _dbContext.OfficeEvents
            .Include(oe => oe.User)
            .SingleOrDefaultAsync(oe => oe.Id == id, ct);

        if (officeEvent == null) return null;
        return MapToDto(officeEvent);
    }

    public async Task<IEnumerable<OfficeEventDto>> GetEventsAsync(DateTimeOffset? start, DateTimeOffset? end, CancellationToken ct = default)
    {
        var query = _dbContext.OfficeEvents.Include(oe => oe.User).AsQueryable();

        if (start.HasValue)
        {
            var startUtc = start.Value.ToUniversalTime();
            query = query.Where(oe => oe.EndTime >= startUtc);
        }

        if (end.HasValue)
        {
            var endUtc = end.Value.ToUniversalTime();
            query = query.Where(oe => oe.StartTime <= endUtc);
        }

        var events = await query.OrderBy(oe => oe.StartTime).ToListAsync(ct);
        return events.Select(MapToDto);
    }

    public async Task<OfficeEventDto> CreateEventAsync(Guid? userId, CreateOfficeEventDto dto, CancellationToken ct = default)
    {
        var officeEvent = new OfficeEvent
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            Location = dto.Location,
            StartTime = dto.StartTime.ToUniversalTime(),
            EndTime = dto.EndTime.ToUniversalTime(),
            EventType = dto.EventType,
            IsImportant = dto.IsImportant,
            IsRecurring = dto.IsRecurring,
            IsSpecial = dto.IsSpecial,
            Recurrence = dto.Recurrence,
            UserId = userId
        };

        _dbContext.OfficeEvents.Add(officeEvent);
        await _dbContext.SaveChangesAsync(ct);

        // Fetch again to include User details if userId was provided
        if (userId.HasValue)
        {
            officeEvent.User = await _dbContext.Users.FindAsync(new object[] { userId.Value }, ct);
        }

        return MapToDto(officeEvent);
    }

    public async Task<OfficeEventDto?> UpdateEventAsync(Guid id, UpdateOfficeEventDto dto, CancellationToken ct = default)
    {
        var officeEvent = await _dbContext.OfficeEvents
            .Include(oe => oe.User)
            .SingleOrDefaultAsync(oe => oe.Id == id, ct);

        if (officeEvent == null) return null;

        if (dto.Title != null) officeEvent.Title = dto.Title;
        if (dto.Description != null) officeEvent.Description = dto.Description;
        if (dto.Location != null) officeEvent.Location = dto.Location;
        if (dto.StartTime.HasValue) officeEvent.StartTime = dto.StartTime.Value.ToUniversalTime();
        if (dto.EndTime.HasValue) officeEvent.EndTime = dto.EndTime.Value.ToUniversalTime();
        if (dto.EventType.HasValue) officeEvent.EventType = dto.EventType.Value;
        if (dto.IsImportant.HasValue) officeEvent.IsImportant = dto.IsImportant.Value;
        if (dto.IsRecurring.HasValue) officeEvent.IsRecurring = dto.IsRecurring.Value;
        if (dto.IsSpecial.HasValue) officeEvent.IsSpecial = dto.IsSpecial.Value;
        if (dto.Recurrence.HasValue) officeEvent.Recurrence = dto.Recurrence.Value;

        if (officeEvent.EndTime < officeEvent.StartTime)
        {
            throw new ArgumentException("End time must be greater than or equal to start time.");
        }

        await _dbContext.SaveChangesAsync(ct);
        return MapToDto(officeEvent);
    }

    public async Task<bool> DeleteEventAsync(Guid id, CancellationToken ct = default)
    {
        var officeEvent = await _dbContext.OfficeEvents.FindAsync(new object[] { id }, ct);
        if (officeEvent == null) return false;

        _dbContext.OfficeEvents.Remove(officeEvent);
        await _dbContext.SaveChangesAsync(ct);
        return true;
    }

    public async Task<IEnumerable<OfficeEventDto>> GetTodaysEventsAsync(CancellationToken ct = default)
    {
        var todayStart = new DateTimeOffset(DateTime.UtcNow.Date, TimeSpan.Zero);
        var todayEnd = todayStart.AddDays(1);

        var events = await _dbContext.OfficeEvents
            .Include(oe => oe.User)
            .Where(oe => oe.StartTime < todayEnd && oe.EndTime >= todayStart)
            .OrderBy(oe => oe.StartTime)
            .ToListAsync(ct);

        return events.Select(MapToDto);
    }

    private static OfficeEventDto MapToDto(OfficeEvent oe)
    {
        return new OfficeEventDto(
            oe.Id,
            oe.Title,
            oe.Description,
            oe.Location,
            oe.StartTime,
            oe.EndTime,
            oe.EventType,
            oe.IsImportant,
            oe.IsRecurring,
            oe.IsSpecial,
            oe.Recurrence,
            oe.UserId,
            oe.User?.Name,
            oe.ExternalUid,
            oe.CalendarSubscriptionId
        );
    }
}
