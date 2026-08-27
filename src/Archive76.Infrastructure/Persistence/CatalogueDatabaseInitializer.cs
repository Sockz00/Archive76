using Archive76.Application.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Archive76.Infrastructure.Persistence;

public sealed class CatalogueDatabaseInitializer : IDatabaseInitializer
{
    private readonly CatalogueDbContext _context;
    private readonly ILogger<CatalogueDatabaseInitializer> _logger;

    public CatalogueDatabaseInitializer(CatalogueDbContext context, ILogger<CatalogueDatabaseInitializer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task EnsureInitializedAsync(CancellationToken cancellationToken = default)
    {
        var databasePath = _context.Database.GetConnectionString();
        _logger.LogInformation("Ensuring database exists at: {ConnectionString}", databasePath);

        await _context.Database.MigrateAsync(cancellationToken);

        _logger.LogInformation("Database initialization complete");
    }
}
