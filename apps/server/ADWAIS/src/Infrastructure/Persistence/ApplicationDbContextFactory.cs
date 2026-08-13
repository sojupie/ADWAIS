// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Infrastructure.Persistence;

public class ApplicationDbContextFactory(IDbContextFactory<AnalyticsDbContext> factory) 
    : IApplicationDbContextFactory
{
    public IApplicationDbContext CreateDbContext() => factory.CreateDbContext();

    public async Task<IApplicationDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default)
    {
        return await factory.CreateDbContextAsync(cancellationToken);
    }
}
