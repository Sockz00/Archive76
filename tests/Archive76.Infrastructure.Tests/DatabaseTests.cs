using Archive76.Domain.Catalogue;
using Archive76.Domain.Players;
using Archive76.Infrastructure.Persistence;
using Archive76.Testing;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Archive76.Infrastructure.Tests;

public sealed class DatabaseTests : IDisposable
{
    private readonly SqliteTestDatabase _db = new();

    [Fact]
    public async Task EnsureCreated_CreatesPlayersTable()
    {
        using var context = _db.CreateContext();
        await context.Database.MigrateAsync();

        var connection = context.Database.GetDbConnection();
        await connection.OpenAsync();

        using var cmd = connection.CreateCommand();
        cmd.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='players'";
        var result = await cmd.ExecuteScalarAsync();

        result.Should().NotBeNull();
        result!.ToString().Should().Be("players");
    }

    [Fact]
    public async Task EnsureCreated_CreatesCatalogueItemsTable()
    {
        using var context = _db.CreateContext();
        await context.Database.MigrateAsync();

        var connection = context.Database.GetDbConnection();
        await connection.OpenAsync();

        using var cmd = connection.CreateCommand();
        cmd.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='catalogue_items'";
        var result = await cmd.ExecuteScalarAsync();

        result.Should().NotBeNull();
        result!.ToString().Should().Be("catalogue_items");
    }

    [Fact]
    public async Task AddAndRetrievePlayer()
    {
        using var context = _db.CreateContext();
        await context.Database.MigrateAsync();

        var player = new Player(Guid.NewGuid(), "Test Character");
        context.Players.Add(player);
        await context.SaveChangesAsync();

        var retrieved = await context.Players.FirstAsync(p => p.Id == player.Id);

        retrieved.DisplayName.Should().Be("Test Character");
        retrieved.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task AddAndRetrieveCatalogueItem()
    {
        using var context = _db.CreateContext();
        await context.Database.MigrateAsync();

        var item = new CatalogueItem(Guid.NewGuid(), "Test Plan", ItemKind.CampPlan, TrackabilityStatus.Trackable, AvailabilityStatus.Available);
        context.CatalogueItems.Add(item);
        await context.SaveChangesAsync();

        var retrieved = await context.CatalogueItems.FirstAsync(c => c.Id == item.Id);

        retrieved.Name.Should().Be("Test Plan");
        retrieved.ItemKind.Should().Be(ItemKind.CampPlan);
    }

    public void Dispose() => _db.Dispose();
}
