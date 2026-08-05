using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.Intranet;
using Adwais.Domain.Entities.Intranet;
using Adwais.Domain.Enums;
using Adwais.Infrastructure.Persistence;
using Adwais.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Adwais.Tests.Services;

public class OfficeEventServiceTests
{
    private DbContextOptions<AnalyticsDbContext> CreateNewContextOptions()
    {
        return new DbContextOptionsBuilder<AnalyticsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
    }

    [Fact]
    public async Task GetEventsAsync_MonthlyRecurrence_ClampsWithoutDriftingAndKeepsSeriesId()
    {
        var options = CreateNewContextOptions();
        using var dbContext = new AnalyticsDbContext(options);
        var officeEvent = new OfficeEvent
        {
            Id = Guid.NewGuid(),
            Title = "Month end",
            StartTime = new DateTimeOffset(2025, 1, 31, 10, 0, 0, TimeSpan.Zero),
            EndTime = new DateTimeOffset(2025, 1, 31, 11, 0, 0, TimeSpan.Zero),
            EventType = EventType.Meeting,
            IsRecurring = true,
            Recurrence = RecurrenceType.Monthly
        };
        dbContext.OfficeEvents.Add(officeEvent);
        await dbContext.SaveChangesAsync();

        var result = (await new OfficeEventService(dbContext).GetEventsAsync(
            new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2025, 3, 31, 23, 59, 59, TimeSpan.Zero))).ToArray();

        Assert.Equal(new[] { 31, 28, 31 }, result.Select(e => e.StartTime.Day));
        Assert.All(result, occurrence => Assert.Equal(officeEvent.Id, occurrence.Id));
    }

    [Fact]
    public async Task UpdateEventAsync_WithValidTimes_UpdatesSuccessfully()
    {
        // Arrange
        var options = CreateNewContextOptions();
        using (var dbContext = new AnalyticsDbContext(options))
        {
            var officeEvent = new OfficeEvent
            {
                Id = Guid.NewGuid(),
                Title = "Original Title",
                StartTime = DateTimeOffset.UtcNow,
                EndTime = DateTimeOffset.UtcNow.AddHours(1),
                EventType = EventType.Meeting
            };
            dbContext.OfficeEvents.Add(officeEvent);
            await dbContext.SaveChangesAsync();

            var service = new OfficeEventService(dbContext);
            var updatedStartTime = DateTimeOffset.UtcNow.AddHours(2);
            var updatedEndTime = DateTimeOffset.UtcNow.AddHours(3);
            var dto = new UpdateOfficeEventDto(
                Title: "Updated Title",
                Description: null,
                Location: null,
                StartTime: updatedStartTime,
                EndTime: updatedEndTime,
                EventType: null,
                IsRecurring: null,
                Recurrence: null
            );

            // Act
            var result = await service.UpdateEventAsync(officeEvent.Id, dto, CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Updated Title", result.Title);
            Assert.Equal(updatedStartTime.ToUniversalTime(), result.StartTime);
            Assert.Equal(updatedEndTime.ToUniversalTime(), result.EndTime);
        }
    }

    [Fact]
    public async Task UpdateEventAsync_WithEndTimeLessThanStartTime_ThrowsArgumentException()
    {
        // Arrange
        var options = CreateNewContextOptions();
        using (var dbContext = new AnalyticsDbContext(options))
        {
            var officeEvent = new OfficeEvent
            {
                Id = Guid.NewGuid(),
                Title = "Original Title",
                StartTime = DateTimeOffset.UtcNow,
                EndTime = DateTimeOffset.UtcNow.AddHours(1),
                EventType = EventType.Meeting
            };
            dbContext.OfficeEvents.Add(officeEvent);
            await dbContext.SaveChangesAsync();

            var service = new OfficeEventService(dbContext);
            var updatedStartTime = DateTimeOffset.UtcNow.AddHours(2);
            var updatedEndTime = DateTimeOffset.UtcNow.AddHours(1); // Less than StartTime
            var dto = new UpdateOfficeEventDto(
                Title: null,
                Description: null,
                Location: null,
                StartTime: updatedStartTime,
                EndTime: updatedEndTime,
                EventType: null,
                IsRecurring: null,
                Recurrence: null
            );

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
                service.UpdateEventAsync(officeEvent.Id, dto, CancellationToken.None));

            Assert.Equal("End time must be greater than or equal to start time.", exception.Message);
        }
    }
}
