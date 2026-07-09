using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.Common.Interfaces;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Intranet;
using Ical.Net;
using Ical.Net.CalendarComponents;
using Ical.Net.DataTypes;
using Ical.Net.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Infrastructure.Services;

public class CalendarFeedService(IApplicationDbContext dbContext) : ICalendarFeedService
{
    private readonly IApplicationDbContext _dbContext = dbContext;

    public async Task<string> GetUserCalendarFeedTokenAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _dbContext.Users.FindAsync(new object[] { userId }, ct);
        if (user == null) throw new KeyNotFoundException("User not found.");

        if (string.IsNullOrEmpty(user.CalendarFeedToken))
        {
            user.CalendarFeedToken = GenerateSecureToken();
            await _dbContext.SaveChangesAsync(ct);
        }

        return user.CalendarFeedToken;
    }

    public async Task<string> RegenerateUserCalendarFeedTokenAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _dbContext.Users.FindAsync(new object[] { userId }, ct);
        if (user == null) throw new KeyNotFoundException("User not found.");

        user.CalendarFeedToken = GenerateSecureToken();
        await _dbContext.SaveChangesAsync(ct);

        return user.CalendarFeedToken;
    }

    public async Task<byte[]> GenerateIcsFeedAsync(string feedToken, CancellationToken ct = default)
    {
        // Validate user feed token
        var userExists = await _dbContext.Users.AnyAsync(u => u.CalendarFeedToken == feedToken, ct);
        if (!userExists)
        {
            throw new UnauthorizedAccessException("Invalid calendar feed token.");
        }

        // Fetch all events for the feed
        var events = await _dbContext.OfficeEvents.OrderBy(oe => oe.StartTime).ToListAsync(ct);

        var calendar = new Calendar();
        calendar.ProductId = "-//ADWAIS//Intranet Calendar//EN";

        foreach (var officeEvent in events)
        {
            var calendarEvent = new CalendarEvent
            {
                Uid = officeEvent.ExternalUid ?? officeEvent.Id.ToString(),
                Summary = officeEvent.Title,
                Description = officeEvent.Description,
                Location = officeEvent.Location,
                Start = new CalDateTime(officeEvent.StartTime.UtcDateTime),
                End = new CalDateTime(officeEvent.EndTime.UtcDateTime)
            };

            // Set categories/types
            calendarEvent.Categories.Add(officeEvent.EventType.ToString());

            calendar.Events.Add(calendarEvent);
        }

        var serializer = new CalendarSerializer();
        var icsString = serializer.SerializeToString(calendar);
        return Encoding.UTF8.GetBytes(icsString);
    }

    private static string GenerateSecureToken()
    {
        var randomBytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomBytes);
        }
        return Convert.ToHexString(randomBytes).ToLowerInvariant();
    }
}
