namespace Adwais.Application.Common.Interfaces;

public interface IApplicationDbContextFactory
{
    IApplicationDbContext CreateDbContext();
    Task<IApplicationDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default);
}
