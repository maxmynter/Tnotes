// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, export_to_apple_notes])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn export_to_apple_notes(title: String, content: String) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        export_to_notes_macos(&title, &content).await
    }
    #[cfg(not(target_os = "macos"))] // ADD THIS
    {
        Err("Apple Notes export is only available on macOS".to_string())
    }
}

#[cfg(target_os = "macos")]
async fn export_to_notes_macos(title: &str, content: &str) -> Result<String, String> {
    use std::process::Command;

    let applescript = format!(
        r#"
    tell application "Notes"
        make new note at folder "Notes" with properties {{name:"{}", body:"{}"}}
    end tell
    "#,
        title.replace("\"", "\\\""),
        content.replace("\"", "\\\"")
    );
    let output = Command::new("osascript")
        .arg("-e")
        .arg(&applescript)
        .output()
        .map_err(|e| format!("Failed to execute AppleScript: {}", e))?;

    if output.status.success() {
        Ok("Note exported successfully".to_string())
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        Err(format!("AppleScript error: {}", error))
    }
}
