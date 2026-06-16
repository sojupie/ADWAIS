using System.Threading.Tasks;
using System.Threading;

namespace Adwais.Application.Interfaces;

public interface IKioskService
{
    Task<string> RegisterDeviceAsync(string deviceId, CancellationToken ct = default);
    Task<bool> ActivateDeviceAsync(string activationCode, CancellationToken ct = default);
    Task<string?> GetTokenAsync(string deviceId, CancellationToken ct = default);
}
