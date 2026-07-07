use async_trait::async_trait;
use serde_json::json;

use super::provider::*;

pub struct AnthropicProvider {
    client: reqwest::Client,
    api_key: String,
    model: String,
    base_url: String,
}

impl AnthropicProvider {
    pub fn new(api_key: &str, base_url: &str, model: &str) -> Self {
        Self {
            client: reqwest::Client::new(),
            api_key: api_key.to_string(),
            model: model.to_string(),
            base_url: base_url.to_string(),
        }
    }
}

#[async_trait]
impl LlmProvider for AnthropicProvider {
    async fn chat(
        &self,
        messages: Vec<ChatMessage>,
        temperature: Option<f32>,
        max_tokens: Option<u32>,
    ) -> anyhow::Result<ChatCompletionResponse> {
        // 分离 system 消息
        let system = messages
            .iter()
            .find(|m| m.role == "system")
            .map(|m| m.content.clone());

        // 其余消息只有 user / assistant
        let api_messages: Vec<_> = messages
            .iter()
            .filter(|m| m.role != "system")
            .map(|m| json!({ "role": m.role, "content": m.content }))
            .collect();

        let mut body = json!({
            "model": self.model,
            "max_tokens": max_tokens.unwrap_or(4096),
            "messages": api_messages,
            "temperature": temperature.unwrap_or(0.7),
        });

        if let Some(s) = system {
            body["system"] = json!(s);
        }

        let resp = self
            .client
            .post(format!("{}/v1/messages", self.base_url))
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&body)
            .send()
            .await?;

        if !resp.status().is_success() {
            let err = resp.text().await.unwrap_or_default();
            anyhow::bail!("Anthropic API error: {}", err);
        }

        let json: serde_json::Value = resp.json().await?;

        // Anthropic content 是数组 [{type: "text", text: "..."}]
        let content = json["content"]
            .as_array()
            .and_then(|blocks| {
                blocks
                    .iter()
                    .filter_map(|b| b["text"].as_str())
                    .collect::<Vec<_>>()
                    .join("")
                    .into()
            })
            .filter(|s: &String| !s.is_empty())
            .unwrap_or_default();

        let model = json["model"].as_str().unwrap_or(&self.model).into();

        Ok(ChatCompletionResponse { content, model })
    }
}
