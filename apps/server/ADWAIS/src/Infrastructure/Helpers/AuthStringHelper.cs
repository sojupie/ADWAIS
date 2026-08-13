// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Infrastructure.Helpers;

public class AuthStringHelper
{
    private static readonly char[] ActivationCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".ToCharArray();
    
    public static string GetRandomActivationCode()
    {
        return new string(Random.Shared.GetItems(ActivationCodeChars, 6));
    }
}