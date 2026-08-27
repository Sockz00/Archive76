using Avalonia.Media;

namespace Archive76.Desktop.Models;

public sealed class MockCatalogueItem
{
    public string Section { get; }
    public string Name { get; }
    public string Category { get; }
    public string Subcategory { get; }
    public string UnlockCondition { get; }
    public string Availability { get; }
    public bool IsTrackable { get; }
    public string FormId { get; }

    public MockCatalogueItem(
        string section,
        string name,
        string category,
        string subcategory,
        string unlockCondition,
        string availability,
        bool isTrackable,
        string formId)
    {
        Section = section;
        Name = name;
        Category = category;
        Subcategory = subcategory;
        UnlockCondition = unlockCondition;
        Availability = availability;
        IsTrackable = isTrackable;
        FormId = formId;
    }

    public string CategoryDisplay => $"{Category} > {Subcategory}";

    public IBrush StatusColor => Availability switch
    {
        "Available" => new SolidColorBrush(Color.FromArgb(0xFF, 0x1F, 0x6F, 0xEB)),
        "Seasonal" => new SolidColorBrush(Color.FromArgb(0xFF, 0xD2, 0x99, 0x22)),
        "Retired" => new SolidColorBrush(Color.FromArgb(0xFF, 0xDA, 0x36, 0x33)),
        "Atomic Shop" => new SolidColorBrush(Color.FromArgb(0xFF, 0x89, 0x57, 0xE5)),
        _ => new SolidColorBrush(Color.FromArgb(0xFF, 0x48, 0x4F, 0x58)),
    };
}
