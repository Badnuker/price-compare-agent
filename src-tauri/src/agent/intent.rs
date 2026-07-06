use std::sync::Arc;

use crate::ai::provider::{ChatMessage, LlmProvider};
use crate::models::product::ParsedIntent;

/// 调用 LLM 解析用户意图，提取商品名/品牌/预算/功能需求
pub async fn parse_intent(
    llm: &Arc<dyn LlmProvider>,
    user_input: &str,
) -> anyhow::Result<ParsedIntent> {
    let prompt = format!(
        r#"你是一个电商比价助手。分析用户的购买需求，提取关键信息，返回纯 JSON（不要 markdown 标记）。

{{
  "product_name": "商品类型（如蓝牙耳机、手机）",
  "brand": "偏好品牌（可为 null）",
  "model": "具体型号（可为 null）",
  "budget_min": 最低预算数字或 null,
  "budget_max": 最高预算数字或 null,
  "features": ["功能要求列表"],
  "usage_scenario": "使用场景（可为 null）",
  "is_complete": true 或 false（信息是否足够进行比价）,
  "missing_fields": ["缺少的关键字段"]
}}

用户输入：{user_input}"#
    );

    let resp = llm
        .chat(
            vec![
                ChatMessage {
                    role: "system".into(),
                    content: "你是一个精确的 JSON 输出引擎。只输出 JSON，不输出任何其他内容。"
                        .into(),
                },
                ChatMessage {
                    role: "user".into(),
                    content: prompt,
                },
            ],
            Some(0.1),
            Some(500),
        )
        .await?;

    // 清洗可能包裹的 ```json ... ```
    let cleaned = resp
        .content
        .trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();

    Ok(serde_json::from_str(cleaned)?)
}
