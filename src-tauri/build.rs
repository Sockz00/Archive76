fn main() {
    // tauri-build 2.6.x reads tauri.conf.json and generates the Rust bindings.
    // In this version `build()` takes no arguments; the config is read from
    // tauri.conf.json at compile time via TAURI_CONFIG env / rerun-if-changed.
    tauri_build::build();
}
