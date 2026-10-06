// Bhasha desktop: a native window around the same web app used for the PWA and mobile apps.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Bhasha");
}
