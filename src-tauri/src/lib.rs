mod agent;
mod ai;
mod commands;
mod config;
mod models;

use agent::orchestrator::AgentOrchestrator;
use ai::openai_compat::OpenAiCompatProvider;
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenvy::dotenv().ok();

    let config = config::AppConfig::from_env();

    let provider = Arc::new(OpenAiCompatProvider::new(
        &config.llm_api_key,
        &config.llm_base_url,
        &config.llm_model,
    ));

    let orchestrator = AgentOrchestrator::new(provider).expect("Agent 初始化失败");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(orchestrator)
        .invoke_handler(tauri::generate_handler![commands::query::search_products])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
