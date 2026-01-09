use serde_json::Value;

const API_BASE: &str = "https://public.api.avoimuusrekisteri.fi";

#[tauri::command]
async fn fetch_activity_notifications() -> Result<Value, String> {
    let url = format!("{}/open-data-activity-notification", API_BASE);
    fetch_json(&url).await
}

#[tauri::command]
async fn fetch_register_notifications() -> Result<Value, String> {
    let url = format!("{}/open-data-register-notification", API_BASE);
    fetch_json(&url).await
}

#[tauri::command]
async fn fetch_targets() -> Result<Value, String> {
    let url = format!("{}/open-data-target/targets", API_BASE);
    fetch_json(&url).await
}

async fn fetch_json(url: &str) -> Result<Value, String> {
    let client = reqwest::Client::new();
    let response = client
        .get(url)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API error: {}", response.status()));
    }

    response
        .json::<Value>()
        .await
        .map_err(|e| format!("Parse error: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            fetch_activity_notifications,
            fetch_register_notifications,
            fetch_targets
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
