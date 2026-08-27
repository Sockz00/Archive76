using Archive76.Domain.Players;
using FluentAssertions;
using Xunit;

namespace Archive76.Domain.Tests.Players;

public class PlayerTests
{
    [Fact]
    public void Constructor_WithValidArguments_CreatesPlayer()
    {
        var id = Guid.NewGuid();
        var player = new Player(id, "Test Character");

        player.Id.Should().Be(id);
        player.DisplayName.Should().Be("Test Character");
        player.IsActive.Should().BeTrue();
        player.CreatedUtc.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
        player.UpdatedUtc.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_WithInvalidDisplayName_ThrowsArgumentException(string? displayName)
    {
        Action act = () => new Player(Guid.NewGuid(), displayName!);

        act.Should().Throw<ArgumentException>();
    }
}
