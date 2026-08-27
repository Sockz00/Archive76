using Archive76.Domain.Players;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Archive76.Infrastructure.Persistence.Configurations;

internal sealed class PlayerConfiguration : IEntityTypeConfiguration<Player>
{
    public void Configure(EntityTypeBuilder<Player> builder)
    {
        builder.ToTable("players");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .HasColumnName("id");

        builder.Property(p => p.DisplayName)
            .HasColumnName("display_name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(p => p.IsActive)
            .HasColumnName("is_active");

        builder.Property(p => p.CreatedUtc)
            .HasColumnName("created_utc")
            .IsRequired();

        builder.Property(p => p.UpdatedUtc)
            .HasColumnName("updated_utc")
            .IsRequired();
    }
}
