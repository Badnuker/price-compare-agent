use crate::models::product::{ParsedIntent, Product};

/// 加载离线商品数据集
pub fn load_products() -> anyhow::Result<Vec<Product>> {
    let data = include_str!("../../../data/products.json");
    let products: Vec<Product> = serde_json::from_str(data)?;
    Ok(products)
}

/// 根据意图粗筛候选商品（简单关键词匹配，控制 token 消耗）
pub fn filter_candidates(products: &[Product], intent: &ParsedIntent) -> Vec<Product> {
    let keywords: Vec<String> = {
        let mut k = vec![];
        if let Some(ref name) = intent.product_name {
            k.push(name.clone());
        }
        if let Some(ref brand) = intent.brand {
            k.push(brand.clone());
        }
        k.extend(intent.features.iter().cloned());
        k
    };

    if keywords.is_empty() {
        // 没有关键词就全返回（但限制数量）
        return products.iter().take(30).cloned().collect();
    }

    let mut scored: Vec<(usize, &Product)> = products
        .iter()
        .map(|p| {
            let text = format!(
                "{} {} {} {}",
                p.name, p.category, p.specs, p.features.join(" ")
            );
            let score = keywords
                .iter()
                .filter(|kw| text.contains(kw.as_str()))
                .count();
            (score, p)
        })
        .filter(|(score, _)| *score > 0)
        .collect();

    // 按匹配分数降序，取前 30 条
    scored.sort_by_key(|(s, _)| std::cmp::Reverse(*s));
    scored.into_iter().map(|(_, p)| p.clone()).take(30).collect()
}

/// 把候选商品列表序列化为 JSON 字符串，喂给 LLM
pub fn products_to_json(products: &[Product]) -> String {
    serde_json::to_string(products).unwrap_or_else(|_| "[]".into())
}
