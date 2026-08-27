using Archive76.Domain.Catalogue;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Archive76.Infrastructure.Persistence.Configurations;

internal sealed class CatalogueItemConfiguration : IEntityTypeConfiguration<CatalogueItem>
{
    public void Configure(EntityTypeBuilder<CatalogueItem> builder)
    {
        builder.ToTable("catalogue_items");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasColumnName("id");

        builder.Property(c => c.Name)
            .HasColumnName("name")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(c => c.ItemKind)
            .HasColumnName("item_kind")
            .HasConversion<int>();

        builder.Property(c => c.TrackabilityStatus)
            .HasColumnName("trackability_status")
            .HasConversion<int>();

        builder.Property(c => c.AvailabilityStatus)
            .HasColumnName("availability_status")
            .HasConversion<int>();

        builder.Property(c => c.CreatedUtc)
            .HasColumnName("created_utc")
            .IsRequired();

        builder.Property(c => c.UpdatedUtc)
            .HasColumnName("updated_utc")
            .IsRequired();

        builder.Property(c => c.RetiredUtc)
            .HasColumnName("retired_utc");
    }
}
