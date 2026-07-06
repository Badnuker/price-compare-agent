use std::sync::Arc;

use crate::ai::provider::{ChatMessage, LlmProvider};
use crate::models::product::{AgentResult, AgentStep};

use super::intent::parse_intent;
use super::tools;

pub struct AgentOrchestrator {
    llm: Arc<dyn LlmProvider>,
    all_products: Vec<crate::models::product::Product>,
}

impl AgentOrchestrator {
    pub fn new(llm: Arc<dyn LlmProvider>) -> anyhow::Result<Self> {
        let all_products = tools::load_products()?;
        Ok(Self {
            llm,
            all_products,
        })
    }

    pub async fn run(&self, user_input: &str) -> anyhow::Result<AgentResult> {
        let mut steps = vec![];

        // Step 1: 意图解析
        steps.push(AgentStep {
            step: "正在理解需求...".into(),
            status: "running".into(),
        });
        let intent = parse_intent(&self.llm, user_input).await?;
        steps.last_mut().unwrap().status = "done".into();

        // 信息不完整 → 追问
        if let Some(follow_up) = intent.missing_info() {
            return Err(anyhow::anyhow!(follow_up));
        }

        // Step 2: 粗筛候选商品
        steps.push(AgentStep {
            step: "正在筛选候选商品...".into(),
            status: "running".into(),
        });
        let candidates = tools::filter_candidates(&self.all_products, &intent);
        steps.last_mut().unwrap().status = "done".into();

        if candidates.is_empty() {
            return Err(anyhow::anyhow!("未找到匹配的商品，试试换个说法？"));
        }

        // Step 3: LLM 匹配 + 排序 + 推荐（一次调用）
        steps.push(AgentStep {
            step: "正在比价分析...".into(),
            status: "running".into(),
        });
        let products_json = tools::products_to_json(&candidates);
        let prompt = format!(
            r#"你是一个电商比价助手。根据用户需求和候选商品列表，完成以下任务，返回纯 JSON：

1. 匹配跨平台相同商品（名称不同但规格一致 → match_type: "exact"；相似 → "similar"；替代推荐 → "alternative"）
2. 在 match_type 中标注每个商品的匹配类型
3. 按价格从低到高排序
4. 给出 2-3 句话的综合推荐理由

用户需求：
- 商品类型: {}
- 品牌偏好: {}
- 预算: {} ~ {}
- 功能要求: {}
- 使用场景: {}

候选商品列表：
{}

返回 JSON 格式：
{{
  "products": [原商品列表中的对象，加上 match_type 字段],
  "recommendation": "推荐理由"
}}"#,
            intent.product_name.as_deref().unwrap_or("未知"),
            intent.brand.as_deref().unwrap_or("无偏好"),
            intent.budget_min.map_or("不限".into(), |v| format!("¥{}", v)),
            intent.budget_max.map_or("不限".into(), |v| format!("¥{}", v)),
            intent.features.join("、"),
            intent.usage_scenario.as_deref().unwrap_or("通用"),
            products_json,
        );

        let resp = self
            .llm
            .chat(
                vec![
                    ChatMessage {
                        role: "system".into(),
                        content: "你是一个精确的 JSON 输出引擎。只输出 JSON，不输出任何其他内容。".into(),
                    },
                    ChatMessage {
                        role: "user".into(),
                        content: prompt,
                    },
                ],
                Some(0.3),
                Some(4096),
            )
            .await?;

        let cleaned = resp
            .content
            .trim()
            .trim_start_matches("```json")
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim();

        #[derive(serde::Deserialize)]
        struct MatchResponse {
            products: Vec<crate::models::product::Product>,
            recommendation: String,
        }

        let result: MatchResponse = serde_json::from_str(cleaned)?;
        steps.last_mut().unwrap().status = "done".into();

        steps.push(AgentStep {
            step: "比价完成".into(),
            status: "done".into(),
        });

        Ok(AgentResult {
            products: result.products,
            recommendation: result.recommendation,
            steps,
        })
    }
}
