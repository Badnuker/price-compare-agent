use tauri::State;
use crate::agent::orchestrator::AgentOrchestrator;
use crate::models::product::AgentResult;

#[tauri::command]
pub async fn search_products(
    orchestrator: State<'_, AgentOrchestrator>,
    question: String,
) -> Result<AgentResult, String> {
    orchestrator.run(&question).await.map_err(|e| e.to_string())
}
