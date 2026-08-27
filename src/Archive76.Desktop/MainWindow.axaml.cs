using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Avalonia.Controls;
using Avalonia.Interactivity;
using Archive76.Desktop.Models;
using Archive76.Desktop.Services;

namespace Archive76.Desktop;

public partial class MainWindow : Window
{
    private static readonly Dictionary<string, string> SectionSubtitles = new()
    {
        ["Dashboard"] = "Overview of your catalogue and collection status",
        ["C.A.M.P. Plans"] = "Buildable items, plans and unlock conditions",
        ["Weapon Mods"] = "Weapon modification plans and availability",
        ["Armour Mods"] = "Armour modification plans and availability",
        ["Favourites"] = "Your saved items and quick access",
    };

    private List<MockCatalogueItem> _allItems = new();
    private List<MockCatalogueItem> _filteredItems = new();
    private bool _suppressRefresh;

    public MainWindow()
    {
        InitializeComponent();
    }

    protected override async void OnLoaded(RoutedEventArgs e)
    {
        base.OnLoaded(e);

        LoadingPanel.IsVisible = true;
        ContentArea.IsVisible = false;
        EmptyState.IsVisible = false;
        ComingSoonPanel.IsVisible = false;

        await Task.Delay(600);

        _allItems = MockCatalogueData.AllItems.ToList();

        SectionTitle.Text = "C.A.M.P. Plans";
        SectionSubtitle.Text = SectionSubtitles["C.A.M.P. Plans"];

        NavList.SelectedIndex = 1;

        PopulateCategoryFilter();

        RefreshItems();
    }

    private void NavList_SelectionChanged(object? sender, SelectionChangedEventArgs e)
    {
        if (NavList.SelectedItem is not ListBoxItem item)
            return;

        var section = item.Content?.ToString() ?? "C.A.M.P. Plans";
        SectionTitle.Text = section;
        SectionSubtitle.Text = SectionSubtitles.GetValueOrDefault(section, "");

        _suppressRefresh = true;
        PopulateCategoryFilter();
        _suppressRefresh = false;

        SearchBox.Text = "";

        RefreshItems();
    }

    private void PopulateCategoryFilter()
    {
        var section = GetCurrentSection();

        CategoryFilter.Items.Clear();
        CategoryFilter.Items.Add(new ComboBoxItem { Content = "All Categories" });
        CategoryFilter.SelectedIndex = 0;

        var categories = _allItems
            .Where(x => x.Section == section)
            .Select(x => x.Category)
            .Distinct()
            .OrderBy(x => x)
            .ToList();

        foreach (var cat in categories)
            CategoryFilter.Items.Add(new ComboBoxItem { Content = cat });

        CategoryFilter.SelectionChanged += CategoryFilter_SelectionChanged;
    }

    private void CategoryFilter_SelectionChanged(object? sender, SelectionChangedEventArgs e)
    {
        if (!_suppressRefresh)
            RefreshItems();
    }

    private void SearchBox_TextChanged(object? sender, TextChangedEventArgs e)
    {
        RefreshItems();
    }

    private void SortFilter_SelectionChanged(object? sender, SelectionChangedEventArgs e)
    {
        if (!_suppressRefresh)
            RefreshItems();
    }

    private string GetCurrentSection()
    {
        if (NavList.SelectedItem is ListBoxItem item)
            return item.Content?.ToString() ?? "C.A.M.P. Plans";
        return "C.A.M.P. Plans";
    }

    private void RefreshItems()
    {
        var section = GetCurrentSection();

        var sectionsWithMockData = new HashSet<string> { "C.A.M.P. Plans", "Weapon Mods", "Armour Mods" };

        if (!sectionsWithMockData.Contains(section))
        {
            ContentArea.IsVisible = false;
            LoadingPanel.IsVisible = false;
            EmptyState.IsVisible = false;
            ComingSoonPanel.IsVisible = true;
            ItemCountText.Text = "0 items";
            return;
        }

        var query = _allItems.Where(x => x.Section == section);

        var searchText = SearchBox.Text?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(searchText))
        {
            query = query.Where(x =>
                x.Name.Contains(searchText, StringComparison.OrdinalIgnoreCase) ||
                x.Category.Contains(searchText, StringComparison.OrdinalIgnoreCase) ||
                x.Subcategory.Contains(searchText, StringComparison.OrdinalIgnoreCase) ||
                x.UnlockCondition.Contains(searchText, StringComparison.OrdinalIgnoreCase));
        }

        if (CategoryFilter.SelectedIndex > 0 && CategoryFilter.SelectedItem is ComboBoxItem catItem)
        {
            var selectedCat = catItem.Content?.ToString();
            if (!string.IsNullOrEmpty(selectedCat))
                query = query.Where(x => x.Category == selectedCat);
        }

        var sortIndex = SortFilter.SelectedIndex;
        query = sortIndex switch
        {
            1 => query.OrderBy(x => x.Category).ThenBy(x => x.Name),
            2 => query.OrderBy(x => x.Availability).ThenBy(x => x.Name),
            _ => query.OrderBy(x => x.Name),
        };

        _filteredItems = query.ToList();
        CardGrid.ItemsSource = _filteredItems;

        ItemCountText.Text = $"{_filteredItems.Count} item{(_filteredItems.Count == 1 ? "" : "s")}";

        LoadingPanel.IsVisible = false;
        ContentArea.IsVisible = _filteredItems.Count > 0;
        EmptyState.IsVisible = _filteredItems.Count == 0;
        ComingSoonPanel.IsVisible = false;
    }
}