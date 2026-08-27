namespace Archive76.Domain.Catalogue;

public sealed class CatalogueItem
{
    public CatalogueItem(Guid id, string name, ItemKind itemKind, TrackabilityStatus trackabilityStatus, AvailabilityStatus availabilityStatus)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        Id = id;
        Name = name;
        ItemKind = itemKind;
        TrackabilityStatus = trackabilityStatus;
        AvailabilityStatus = availabilityStatus;
        CreatedUtc = DateTimeOffset.UtcNow;
        UpdatedUtc = DateTimeOffset.UtcNow;
    }

    private CatalogueItem()
    {
        Id = Guid.Empty;
        Name = string.Empty;
    }

    public Guid Id { get; }
    public string Name { get; }
    public ItemKind ItemKind { get; }
    public TrackabilityStatus TrackabilityStatus { get; }
    public AvailabilityStatus AvailabilityStatus { get; }
    public DateTimeOffset CreatedUtc { get; }
    public DateTimeOffset UpdatedUtc { get; }
    public DateTimeOffset? RetiredUtc { get; }
}
