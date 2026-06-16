namespace Adwais.Application.Interfaces;

public interface ITokenService
{
    string GenerateKioskToken(string deviceId);
}
