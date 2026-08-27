namespace Archive76.Application.Persistence;

public interface IDatabaseInitializer
{
    Task EnsureInitializedAsync(CancellationToken cancellationToken = default);
}
