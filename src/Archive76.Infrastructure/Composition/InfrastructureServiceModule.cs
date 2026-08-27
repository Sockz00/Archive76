using Archive76.Application.Composition;
using Archive76.Application.Persistence;
using Archive76.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Archive76.Infrastructure.Composition;

public sealed class InfrastructureServiceModule : IServiceModule
{
    public void ConfigureServices(IServiceCollection services, IConfiguration configuration)
    {
        var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var dbDir = System.IO.Path.Combine(localAppData, "Archive76");
        System.IO.Directory.CreateDirectory(dbDir);

        var cs = configuration.GetConnectionString("Catalogue")
            ?? $"Data Source={System.IO.Path.Combine(dbDir, "archive76.db")};Foreign Keys=True;Cache=Shared";

        services.AddDbContext<CatalogueDbContext>(o => o.UseSqlite(cs));
        services.AddScoped<IDatabaseInitializer, CatalogueDatabaseInitializer>();
    }
}
