use std::sync::Arc;
use std::time::Duration;
use tauri::Emitter;

use crate::ai::provider::{ChatMessage, LlmProvider};
use crate::models::product::AgentResult;

use super::rules::RuleEngine;
use super::tools;

const STEPS: &[&str] = &["理解需求", "筛选商品", "比价分析", "生成推荐"];

#[derive(Clone, serde::Serialize)]
struct StepEvent {
    index: usize,
    label: String,
}

#[derive(Clone, serde::Serialize)]
struct RecommendationChunk {
    text: String,
}

pub struct AgentOrchestrator {
    llm: Arc<dyn LlmProvider>,
    all_products: Vec<crate::models::product::Product>,
    rules: RuleEngine,
    cache: std::sync::Mutex<std::collections::HashMap<String, AgentResult>>,
}

impl AgentOrchestrator {
    pub fn new(llm: Arc<dyn LlmProvider>) -> anyhow::Result<Self> {
        let all_products = tools::load_products()?;

        let mut cats: Vec<String> = all_products
            .iter()
            .map(|p| p.category.clone())
            .collect::<std::collections::BTreeSet<_>>()
            .into_iter()
            .collect();
        cats.sort_by_key(|c| -(c.chars().count() as i32));

        let fts: Vec<String> = all_products
            .iter()
            .flat_map(|p| p.features.clone())
            .collect::<std::collections::BTreeSet<_>>()
            .into_iter()
            .collect();

        let rules = RuleEngine::new(cats, fts);

        Ok(Self { llm, all_products, rules, cache: std::sync::Mutex::new(std::collections::HashMap::new()) })
    }

    fn emit_step(&self, app_handle: &tauri::AppHandle, index: usize) {
        let _ = app_handle.emit(
            "agent-step",
            StepEvent {
                index,
                label: STEPS[index].into(),
            },
        );
    }

    async fn append_thinking(
        &self,
        app_handle: &tauri::AppHandle,
        log: &mut String,
        line: &str,
    ) {
        // 保存原日志，逐行逐字流式推送，每次推送完整累积日志
        let full_before = log.clone();
        let chars: Vec<char> = line.chars().collect();
        for chunk in chars.chunks(5) {
            let chunk_str: String = chunk.iter().collect();
            let full = format!("{}{}{}", full_before, chunk_str, if chunk.is_empty() { "\n" } else { "" });
            let _ = app_handle.emit("agent-thinking", RecommendationChunk { text: full });
            tokio::time::sleep(Duration::from_millis(15)).await;
        }
        log.push_str(line);
        log.push('\n');
        let _ = app_handle.emit("agent-thinking", RecommendationChunk { text: log.clone() });
    }

    pub async fn run(
        &self,
        app_handle: &tauri::AppHandle,
        user_input: &str,
    ) -> anyhow::Result<AgentResult> {

        let cache_key = user_input.trim().to_lowercase();
        let cached = self.cache.lock().unwrap().get(&cache_key).cloned();
        if let Some(cached) = cached {
            let mut thinking_log = String::new();
            self.append_thinking(app_handle, &mut thinking_log, "命中缓存，直接返回结果...").await;
            let mut result = cached;
            result.thinking = thinking_log;
            return Ok(result);
        }

        let mut thinking_log = String::new();

        // Step 0: 理解需求（规则引擎，无 LLM 调用）
        self.emit_step(app_handle, 0);
        self.append_thinking(app_handle, &mut thinking_log, "正在理解你的需求...").await;
        let intent = self.rules.parse(user_input);

        if let Some(follow_up) = intent.missing_info() {
            let _ = app_handle.emit("agent-step-error", follow_up.clone());
            return Err(anyhow::anyhow!(follow_up));
        }

        let summary = format!(
            "已理解需求：商品类型【{}】，预算 {} ~ {}，功能要求：{}",
            intent.product_name.as_deref().unwrap_or("未知"),
            intent.budget_min.map_or("不限".into(), |v| format!("¥{}", v)),
            intent.budget_max.map_or("不限".into(), |v| format!("¥{}", v)),
            if intent.features.is_empty() {
                "无特殊要求".into()
            } else {
                intent.features.join("、")
            },
        );
        self.append_thinking(app_handle, &mut thinking_log, &summary).await;

        // Step 1: 筛选商品
        self.emit_step(app_handle, 1);
        self.append_thinking(app_handle, &mut thinking_log, "正在从数据库中筛选匹配的商品...").await;
        let candidates = tools::filter_candidates(&self.all_products, &intent);

        if candidates.is_empty() {
            let _ = app_handle.emit("agent-step-error", "未找到匹配的商品，试试换个说法？");
            return Err(anyhow::anyhow!("未找到匹配的商品，试试换个说法？"));
        }

        let jd_count = candidates.iter().filter(|p| p.platform == "京东").count();
        let tb_count = candidates.iter().filter(|p| p.platform == "淘宝").count();
        let filter_result = format!(
            "找到 {} 款候选商品（京东 {} 款，淘宝 {} 款），正在分析比价...",
            candidates.len(),
            jd_count,
            tb_count,
        );
        self.append_thinking(app_handle, &mut thinking_log, &filter_result).await;

        // Step 2: 比价分析（LLM 匹配 + 排序 + 推荐）
        self.emit_step(app_handle, 2);
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
                        content: "你是一个精确的 JSON 输出引擎。只输出 JSON，不输出任何其他内容。"
                            .into(),
                    },
                    ChatMessage {
                        role: "user".into(),
                        content: prompt,
                    },
                ],
                Some(0.3),
                Some(2048),
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
        struct LlmOutputProduct {
            name: String,
            platform: String,
            price: f64,
            specs: String,
            features: Vec<String>,
            match_type: String,
        }

        #[derive(serde::Deserialize)]
        struct MatchResponse {
            products: Vec<LlmOutputProduct>,
            recommendation: String,
        }

        let llm_result: MatchResponse = serde_json::from_str(cleaned)?;

        // 从预筛选的候选商品中找回原始 Product，合并 match_type
        let mut products: Vec<crate::models::product::Product> = vec![];
        for (llm_p, candidate) in llm_result.products.iter().zip(candidates.iter()) {
            let mut product = candidate.clone();
            product.match_type = Some(llm_p.match_type.clone());
            products.push(product);
        }

        // Step 3: 生成推荐 — 流式推送推荐语
        self.emit_step(app_handle, 3);
        self.stream_recommendation(app_handle, &llm_result.recommendation).await;

        let result = AgentResult {
            products,
            recommendation: llm_result.recommendation,
            thinking: thinking_log,
        };

        self.cache.lock().unwrap().insert(cache_key, result.clone());

        Ok(result)
    }

    async fn stream_recommendation(&self, app_handle: &tauri::AppHandle, text: &str) {
        let chars: Vec<char> = text.chars().collect();
        let mut accumulated = String::new();

        for chunk in chars.chunks(3) {
            accumulated.push_str(&chunk.iter().collect::<String>());
            let _ = app_handle.emit(
                "agent-recommendation",
                RecommendationChunk {
                    text: accumulated.clone(),
                },
            );
            tokio::time::sleep(Duration::from_millis(25)).await;
        }
    }
}