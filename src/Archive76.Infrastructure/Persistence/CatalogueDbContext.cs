using Archive76.Domain.Catalogue;
using Archive76.Domain.Players;
using Microsoft.EntityFrameworkCore;

namespace Archive76.Infrastructure.Persistence;

public sealed class CatalogueDbContext : DbContext
{
    public CatalogueDbContext(DbContextOptions<CatalogueDbContext> options)
        : base(options)
    {
    }

    public DbSet<Player> Players => Set<Player>();
    public DbSet<CatalogueItem> CatalogueItems => Set<CatalogueItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CatalogueDbContext).Assembly);
    }
}
