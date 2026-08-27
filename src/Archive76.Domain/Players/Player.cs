namespace Archive76.Domain.Players;

public sealed class Player
{
    public Player(Guid id, string displayName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(displayName);
        Id = id;
        DisplayName = displayName;
        IsActive = true;
        CreatedUtc = DateTimeOffset.UtcNow;
        UpdatedUtc = DateTimeOffset.UtcNow;
    }

    private Player()
    {
        Id = Guid.Empty;
        DisplayName = string.Empty;
    }

    public Guid Id { get; }
    public string DisplayName { get; }
    public bool IsActive { get; }
    public DateTimeOffset CreatedUtc { get; }
    public DateTimeOffset UpdatedUtc { get; }
}
