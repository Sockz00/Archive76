namespace Archive76.Domain.Catalogue;

public enum ItemKind
{
    Unspecified = 0,
    CampPlan = 1,
    CampBuildItem = 2
}

public enum TrackabilityStatus
{
    Unknown = 0,
    Trackable = 1,
    NotTrackable = 2
}

public enum AvailabilityStatus
{
    Unknown = 0,
    Available = 1,
    Unavailable = 2,
    Retired = 3
}
