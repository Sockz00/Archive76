using Archive76.Domain.Catalogue;
using FluentAssertions;
using Xunit;

namespace Archive76.Domain.Tests.Catalogue;

public class CatalogueItemTests
{
    [Fact]
    public void Constructor_WithValidArguments_CreatesCatalogueItem()
    {
        var id = Guid.NewGuid();
        var item = new CatalogueItem(id, "Test Item", ItemKind.CampPlan, TrackabilityStatus.Trackable, AvailabilityStatus.Available);

        item.Id.Should().Be(id);
        item.Name.Should().Be("Test Item");
        item.ItemKind.Should().Be(ItemKind.CampPlan);
        item.TrackabilityStatus.Should().Be(TrackabilityStatus.Trackable);
        item.AvailabilityStatus.Should().Be(AvailabilityStatus.Available);
        item.CreatedUtc.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
        item.UpdatedUtc.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
        item.RetiredUtc.Should().BeNull();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_WithInvalidName_ThrowsArgumentException(string? name)
    {
        Action act = () => new CatalogueItem(Guid.NewGuid(), name!, ItemKind.Unspecified, TrackabilityStatus.Unknown, AvailabilityStatus.Unknown);

        act.Should().Throw<ArgumentException>();
    }
}
