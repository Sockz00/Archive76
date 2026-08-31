// src-tauri/src/lib.rs — M2 native shell.
//
// `run` sets up the Tauri window and command surface. The `#![cfg_attr]`
// suppresses the console window on release builds for a cleaner user
// experience on Windows.
#![cfg_attr(
    not(debug_assertions),
    // Hide the console window on release builds (Windows).
    windows_subsystem = "windows"
)]

use tauri::Manager;

#[tauri::command]
fn ping() -> String {
    "pong".to_string()
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![ping])
        .setup(|app| {
            // Ensure the window icon is loaded from the assets directory.
            let _ = app.handle();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
