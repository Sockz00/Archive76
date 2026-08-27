using System.Collections.Generic;
using Archive76.Desktop.Models;

namespace Archive76.Desktop.Services;

public static class MockCatalogueData
{
    public static IReadOnlyList<MockCatalogueItem> AllItems { get; } = new List<MockCatalogueItem>
    {
        new("C.A.M.P. Plans", "Plan: Water Filter", "Structures", "Utilities", "Crafted at C.A.M.P. workbench", "Available", true, "001A2B3C"),
        new("C.A.M.P. Plans", "Plan: Generator, Fusion", "Power & Lights", "Generators", "Quest: Hunter for Hire", "Available", true, "002B3C4D"),
        new("C.A.M.P. Plans", "Plan: Mk. II Turret", "Defenses", "Turrets", "Vendor: Brotherhood of Steel", "Available", true, "003C4D5E"),
        new("C.A.M.P. Plans", "Plan: Stash Box", "Storage", "Containers", "Known by default", "Available", false, "004D5E6F"),
        new("C.A.M.P. Plans", "Plan: Brewing Station", "Workbenches", "Brewing", "Event: Fasnacht Day", "Seasonal", true, "005E6F70"),
        new("C.A.M.P. Plans", "Plan: Fermenter", "Workbenches", "Brewing", "Atomic Shop", "Atomic Shop", true, "006F7081"),
        new("C.A.M.P. Plans", "Plan: Chandelier", "Decorations", "Lighting", "Vendor: Vendor Bot Wallace", "Available", true, "00708192"),
        new("C.A.M.P. Plans", "Plan: Wallpaper, Peeling", "Decorations", "Walls", "Loot: random containers", "Available", true, "008192A3"),
        new("C.A.M.P. Plans", "Plan: Concrete Foundation", "Structures", "Foundations", "Quest: Foundation", "Available", true, "0092A3B4"),
        new("C.A.M.P. Plans", "Plan: Scorchbeast Mixed Stew", "Cooking", "Recipes", "Event: Meat Week", "Seasonal", true, "00A3B4C5"),
        new("C.A.M.P. Plans", "Plan: Power Armor Station", "Workbenches", "Power Armor", "Quest: Miner Miracles", "Available", true, "00B4C5D6"),
        new("C.A.M.P. Plans", "Plan: Shelters", "Structures", "Shelters", "Atomic Shop", "Atomic Shop", true, "00C5D6E7"),
        new("C.A.M.P. Plans", "Plan: Holiday Wreath", "Decorations", "Seasonal", "SCORE reward (S4)", "Retired", true, "00D6E7F8"),
        new("C.A.M.P. Plans", "Plan: Wind Chimes", "Decorations", "Outdoor", "Loot: random containers", "Available", true, "00E7F809"),
        new("C.A.M.P. Plans", "Plan: Snapping Turtle Pond", "Decorations", "Outdoor", "Atomic Shop", "Atomic Shop", true, "00F8091A"),
        new("C.A.M.P. Plans", "Plan: Neon Sign, Welcome", "Decorations", "Signs", "Vendor: Watoga Bot", "Available", true, "01091A2B"),
        new("Weapon Mods", "Plan: Aligned Stock", "Stocks", "Rifle", "Vendor: Vendor Bot", "Available", true, "021A2B3C"),
        new("Weapon Mods", "Plan: Sharp Barrels", "Barrels", "Pistol", "Loot: random containers", "Available", true, "022B3C4D"),
        new("Weapon Mods", "Plan: Stabilized Grip", "Grips", "Heavy Weapon", "Quest: Order of the Tadpole", "Available", true, "023C4D5E"),
        new("Weapon Mods", "Plan: Hardened Receiver", "Receivers", "Energy Weapon", "Loot: random containers", "Available", true, "024D5E6F"),
        new("Armour Mods", "Plan: Lining, Custom", "Lining", "Combat Armor", "Vendor: Vendor Bot", "Available", true, "035E6F70"),
        new("Armour Mods", "Plan: Cushioned", "Padding", "Leather", "Loot: random containers", "Available", true, "036F7081"),
        new("Armour Mods", "Plan: Pocketed", "Pockets", "Metal Armor", "Quest: Earthborn Mover", "Available", true, "03708192"),
        new("Armour Mods", "Plan: Weighted", "Modifications", "Power Armor", "Event: Fasnacht", "Seasonal", true, "038192A3"),
    };

    public static List<string> Sections { get; } = new()
    {
        "Dashboard",
        "C.A.M.P. Plans",
        "Weapon Mods",
        "Armour Mods",
        "Favourites",
    };
}
