using Archive76.Application.Persistence;
using Archive76.Domain.Catalogue;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Archive76.Infrastructure.Persistence;

public sealed class CatalogueDbContextFactory : IDesignTimeDbContextFactory<CatalogueDbContext>
{
    public CatalogueDbContext CreateDbContext(string[] args)
    {
        var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var dbPath = System.IO.Path.Combine(localAppData, "Archive76", "archive76.db");
        var cs = $"Data Source={dbPath};Foreign Keys=True;Cache=Shared";

        var builder = new DbContextOptionsBuilder<CatalogueDbContext>();
        builder.UseSqlite(cs);

        return new CatalogueDbContext(builder.Options);
    }
}
