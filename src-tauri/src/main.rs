// src-tauri/src/main.rs — M2 native shell entry point.
//
// This is intentionally minimal: it registers the Tauri window and a single
// `ping` invoke command so the Rust backend can be verified end-to-end against
// the React frontend before more substantial capabilities (SQLite access,
// image caching) are wired up.
fn main() {
    archive76_lib::run();
}
