using Archive76.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Archive76.Testing;

public sealed class SqliteTestDatabase : IDisposable
{
    private readonly string _tempDir;
    private readonly string _dbPath;
    private readonly string _connectionString;
    private bool _disposed;

    public SqliteTestDatabase()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), "Archive76Tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_tempDir);
        _dbPath = Path.Combine(_tempDir, "test.db");
        _connectionString = $"Data Source={_dbPath};Foreign Keys=True;Cache=Shared";
        Options = new DbContextOptionsBuilder<CatalogueDbContext>()
            .UseSqlite(_connectionString)
            .Options;
    }

    public DbContextOptions<CatalogueDbContext> Options { get; }

    public CatalogueDbContext CreateContext() => new(Options);

    public async Task InitializeAsync()
    {
        using var context = CreateContext();
        await context.Database.EnsureCreatedAsync();
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        SqliteConnection.ClearAllPools();

        try
        {
            if (Directory.Exists(_tempDir))
            {
                Directory.Delete(_tempDir, recursive: true);
            }
        }
        catch
        {
            // Best effort cleanup
        }
    }
}
