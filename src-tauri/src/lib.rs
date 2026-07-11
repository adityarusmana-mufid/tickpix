#[tauri::command]
fn toggle_maximize(window: tauri::Window) {
    if let Ok(true) = window.is_maximized() {
        let _ = window.unmaximize();
    } else {
        let _ = window.maximize();
    }
}

#[tauri::command]
fn minimize_window(window: tauri::Window) {
    let _ = window.minimize();
}

#[tauri::command]
fn close_window(window: tauri::Window) {
    let _ = window.close();
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![toggle_maximize, minimize_window, close_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
