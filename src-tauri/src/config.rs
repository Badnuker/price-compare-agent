#[derive(Clone)]
pub struct AppConfig {
    pub llm_api_key: String,
    pub llm_base_url: String,
    pub llm_model: String,
}

impl AppConfig {
    pub fn from_env() -> Self {
        Self {
            llm_api_key: std::env::var("LLM_API_KEY").expect("LLM_API_KEY 未设置"),
            llm_base_url: std::env::var("LLM_BASE_URL").expect("LLM_BASE_URL 未设置"),
            llm_model: std::env::var("LLM_MODEL").expect("LLM_MODEL 未设置"),
        }
    }
}
