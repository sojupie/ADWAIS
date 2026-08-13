// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Adwais.Infrastructure.Persistence.Converters;

public class EncryptedStringConverter : ValueConverter<string?, string?>
{
    public EncryptedStringConverter(IDataProtectionProvider provider, ConverterMappingHints? mappingHints = null) 
        : base(
            v => v == null ? null : provider.CreateProtector("TenantSecrets").Protect(v),
            v => v == null ? null : provider.CreateProtector("TenantSecrets").Unprotect(v),
            mappingHints)
    {
    }
}
