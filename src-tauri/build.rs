fn main() {
    // Tauri's build script handles codegen for the frontend assets and the
    // Cargo features needed by the native shell. It is intentionally minimal.
    tauri_build::build();
    println!("cargo:rerun-if-changed=tauri.conf.json");
}
