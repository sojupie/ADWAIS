namespace Adwais.Infrastructure.Helpers;

public class AuthStringHelper
{
    private static readonly char[] ActivationCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".ToCharArray();
    
    public static string GetRandomActivationCode()
    {
        return new string(Random.Shared.GetItems(ActivationCodeChars, 6));
    }
}