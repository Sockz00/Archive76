// src-tauri/src/models.rs — domain types exposed by the Archive76 native
// backend. These mirror the validated M1 domain model with the following
// M2 adjustments:
//
//   * IDs are first-class `uuid::Uuid` rather than raw strings, but are
//     persisted as TEXT in SQLite (per the schema).
//   * Timestamps are `chrono::DateTime<Utc>` for unambiguous serialisation.
//   * `Source` is added so ingestion can record provenance (AD-010).
//   * `ItemKind` and the status enums keep their integer-backed form so the
//     persisted values are stable across schema versions; we add a
//     `Display`/`FromStr` round-trip via the `From` impls below.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ItemKind {
    /// C.A.M.P. plan / buildable.
    Plan = 0,
    /// Weapon modification.
    WeaponMod = 1,
    /// Armour modification.
    ArmourMod = 2,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TrackabilityStatus {
    /// The item is trackable: known and obtainable in normal play.
    Trackable = 0,
    /// The item is no longer obtainable.
    Retired = 1,
    /// The item is obtainable but only via limited-time events.
    Limited = 2,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AvailabilityStatus {
    Unknown = 0,
    Available = 1,
    Unobtainable = 2,
    Seasonal = 3,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CatalogueItem {
    pub id: uuid::Uuid,
    pub name: String,
    pub item_kind: ItemKind,
    pub trackability_status: TrackabilityStatus,
    pub availability_status: AvailabilityStatus,
    pub source: Option<String>,
    pub source_url: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub retired_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Player {
    pub id: uuid::Uuid,
    pub display_name: String,
    pub is_active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

// ---------- integer <-> enum conversions ----------------------------------

impl From<ItemKind> for i32 {
    fn from(v: ItemKind) -> Self {
        v as i32
    }
}

impl TryFrom<i64> for ItemKind {
    type Error = String;
    fn try_from(v: i64) -> Result<Self, Self::Error> {
        Ok(match v {
            0 => Self::Plan,
            1 => Self::WeaponMod,
            2 => Self::ArmourMod,
            other => return Err(format!("unknown ItemKind: {other}")),
        })
    }
}

impl From<TrackabilityStatus> for i32 {
    fn from(v: TrackabilityStatus) -> Self {
        v as i32
    }
}

impl TryFrom<i64> for TrackabilityStatus {
    type Error = String;
    fn try_from(v: i64) -> Result<Self, Self::Error> {
        Ok(match v {
            0 => Self::Trackable,
            1 => Self::Retired,
            2 => Self::Limited,
            other => return Err(format!("unknown TrackabilityStatus: {other}")),
        })
    }
}

impl From<AvailabilityStatus> for i32 {
    fn from(v: AvailabilityStatus) -> Self {
        v as i32
    }
}

impl TryFrom<i64> for AvailabilityStatus {
    type Error = String;
    fn try_from(v: i64) -> Result<Self, Self::Error> {
        Ok(match v {
            0 => Self::Unknown,
            1 => Self::Available,
            2 => Self::Unobtainable,
            3 => Self::Seasonal,
            other => return Err(format!("unknown AvailabilityStatus: {other}")),
        })
    }
}
