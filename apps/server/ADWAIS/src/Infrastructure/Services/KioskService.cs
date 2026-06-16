using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities;
using Adwais.Infrastructure.Helpers;
using Adwais.Infrastructure.Persistence;

namespace Adwais.Infrastructure.Services;

public class KioskService(
    IDbContextFactory<AnalyticsDbContext> contextFactory,
    ITokenService tokenService)
    : IKioskService
{
    private readonly IDbContextFactory<AnalyticsDbContext> _contextFactory = contextFactory;
    private readonly ITokenService _tokenService = tokenService;

    
    public async Task<string> RegisterDeviceAsync(string deviceId, CancellationToken ct = default)
    {
        await using var db = await _contextFactory.CreateDbContextAsync(ct);
        
        string code;
        bool isDuplicate;
        do
        {
            code = AuthStringHelper.GetRandomActivationCode();
            isDuplicate = await db.KioskDevices.AnyAsync(kd => 
                kd.ActivationCode == code && 
                !kd.IsAuthorized && 
                kd.ActivationCodeExpires > DateTimeOffset.UtcNow, ct);
        } while (isDuplicate);
        
        var device = await db.KioskDevices.SingleOrDefaultAsync(kd => kd.DeviceId == deviceId, ct);
        var expiry = DateTimeOffset.UtcNow.AddMinutes(10);
        if (device == null)
        {
            db.KioskDevices.Add(new KioskDevice
            {
                DeviceId = deviceId,
                ActivationCode = code,
                ActivationCodeExpires = expiry,
                IsAuthorized = false,
                AuthorizedAt = null,
                CreatedDate = DateTimeOffset.UtcNow
            });
        }
        else
        {
            device.ActivationCode = code;
            device.ActivationCodeExpires = expiry;
            device.IsAuthorized = false;
            device.AuthorizedAt = null;
        }
        await db.SaveChangesAsync(ct);
        return code;
    }

    public async Task<bool> ActivateDeviceAsync(string activationCode, CancellationToken ct = default)
    {
        await using var db = await _contextFactory.CreateDbContextAsync(ct);

        var device = await db.KioskDevices.SingleOrDefaultAsync(kd => 
            kd.ActivationCode == activationCode && 
            !kd.IsAuthorized && 
            kd.ActivationCodeExpires > DateTimeOffset.UtcNow, ct);

        if (device == null)
        {
            return false;
        }
        
        device.IsAuthorized = true;
        device.AuthorizedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
        return true;
    }


    public async Task<string?> GetTokenAsync(string deviceId, CancellationToken ct = default)
    {
        await using var db = await _contextFactory.CreateDbContextAsync(ct);

        var device = await db.KioskDevices.SingleOrDefaultAsync(kd => kd.DeviceId == deviceId, ct);

        if (device is null || !device.IsAuthorized)
        {
            return null;
        }

        return _tokenService.GenerateKioskToken(deviceId);
    }
}
