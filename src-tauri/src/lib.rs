use chrono::Local;
use markdown::{self, mdast, Constructs, Options, ParseOptions};
use std::process::Command;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![export_to_apple_notes])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn export_to_apple_notes(note: String) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        export_to_notes_macos(&note).await
    }
    #[cfg(not(target_os = "macos"))]
    {
        Err("Apple Notes export is only available on macOS".to_string())
    }
}

fn separate_title_line(note: &str) -> (Option<String>, String) {
    if let Some(pos) = note.find('\n') {
        let leading = note[..pos].to_string();
        if pos + 1 < note.len() {
            (Some(leading), note[pos + 1..].to_string())
        } else {
            (None, leading)
        }
    } else {
        (None, note.to_string())
    }
}

fn get_markdown_parse_options() -> ParseOptions {
    let mut constructs = Constructs::default();
    constructs.gfm_table = false;
    constructs.gfm_task_list_item = false;

    ParseOptions {
        constructs,
        ..ParseOptions::default()
    }
}

fn has_markdown_formatting(text: &str) -> bool {
    let parse_options = get_markdown_parse_options();
    if let Ok(ast) = markdown::to_mdast(text, &parse_options) {
        match ast {
            mdast::Node::Root(root) => {
                for child in &root.children {
                    match child {
                        mdast::Node::Paragraph(p) => {
                            for node in &p.children {
                                match node {
                                    mdast::Node::Text(_) => continue,
                                    _ => return true,
                                }
                            }
                        }
                        mdast::Node::Heading(_) | mdast::Node::List(_) | mdast::Node::Code(_) => {
                            return true
                        }
                        _ => {}
                    }
                }
            }
            _ => return true,
        }
    }
    false
}

fn parse_markdown(note: &str) -> String {
    let parse = get_markdown_parse_options();
    let (title, text) = match separate_title_line(note) {
        (Some(title), text) => {
            let text = markdown::to_html_with_options(
                &text,
                &Options {
                    parse,
                    ..Options::default()
                },
            )
            .unwrap()
            .replace("\"", "\\\"");
            let title = if has_markdown_formatting(&title) {
                markdown::to_html(&title).replace("\"", "\\\"")
            } else {
                format!("<h1>{}</h1>", title)
            };
            (title, text)
        }
        (None, text) => {
            let title = format!(
                "<h1>Tnote import from {}<h1><br/>\n",
                Local::now().format("%Y-%m-%d %H:%M:%S").to_string()
            );
            (title, text)
        }
    };
    [title, text].join("<br/>")
}

#[cfg(target_os = "macos")]
async fn export_to_notes_macos(note: &str) -> Result<String, String> {
    let markdown_note = parse_markdown(note);
    let applescript = format!(
        r#"
    tell application "Notes"
        activate
        make new note at folder "Notes" with properties {{name:" ", body:"{}"}}
    end tell
    "#,
        markdown_note,
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
