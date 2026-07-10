# 🛒 PriceCompare — 跨平台 AI 比价智能体

> **版本**：2.0.0 | **技术栈**：Tauri 2.x + React 19 + TypeScript + Rust | **许可证**：MIT

---

## 目录

1. [项目概述](#1-项目概述)
2. [新手入手指南](#2-新手入手指南)
3. [架构总览](#3-架构总览)
4. [文件清单与作用](#4-文件清单与作用)
5. [文件间调用关系](#5-文件间调用关系)
6. [功能全览](#6-功能全览)
7. [项目亮点](#7-项目亮点)
8. [项目意义](#8-项目意义)

---

## 1. 项目概述

PriceCompare 是一个**桌面端跨平台电商比价应用**，使用自然语言与用户交互。用户只需告诉 AI 想买什么，应用便自动解析意图、模拟多平台商品搜索、生成比价图表和购物建议。

### 核心流程

```
用户输入："300以内适合运动的蓝牙耳机"
    │
    ▼
┌─────────────────────────────────────────────────┐
│  Step 0: 意图解析 (LLM)                          │
│  提取: product_name="蓝牙耳机", budget_max=300    │
│        features=["运动","防水"]                    │
├─────────────────────────────────────────────────┤
│  Step 1: 商品搜索 (LLM 扮演搜素引擎)              │
│  输出: 京东/淘宝/拼多多/苏宁的 3-6 款商品 JSON     │
├─────────────────────────────────────────────────┤
│  Step 2: 流式生成推荐 (LLM 流式输出)              │
│  输出: 📋总结 + 💰推荐理由 + ⚡省钱贴士            │
└─────────────────────────────────────────────────┘
    │
    ▼
  前端展示: 推荐理由 + 商品卡片 + ECharts 柱状图
```

### 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 桌面框架 | Tauri 2.11 | 比 Electron 更轻量，Rust 后端 |
| 前端 | React 19 + TypeScript 6 | 现代化 UI |
| UI 组件库 | Ant Design 6 | 深色主题定制 |
| 图表 | ECharts 6 | 柱状图价格对比 |
| Markdown | react-markdown 10 | AI 推荐富文本渲染 |
| LLM Provider | OpenAI Compatible / Anthropic 双支持 | 通过 async-openai / reqwest 直连 |

---

## 2. 新手入手指南

### 2.1 环境要求

| 工具 | 版本 | 用途 |
|------|------|------|
| Node.js | ≥18 | 前端运行时 |
| Rust | ≥1.77 | 后端编译 |
| pnpm | ≥8 | 包管理器（推荐）|
| Windows 10+ / macOS 12+ / Linux | — | 运行平台 |

### 2.2 克隆并安装

```bash
# 1. 克隆项目
git clone <repo-url>
cd price-compare-agent

# 2. 安装前端依赖
pnpm install

# 3. 启动开发模式（前后端同时热更新）
pnpm run tauri dev

# 4. 生产构建（生成 .exe / .dmg / .AppImage）
pnpm run tauri build
```

### 2.3 配置 LLM

首次启动会自动弹出设置窗口，填写以下信息：

| 配置项 | 示例值 | 说明 |
|--------|--------|------|
| Provider | `OpenAI Compatible` | 或 `Anthropic` |
| API Key | `sk-xxxx` | 你的 API Key |
| Base URL | `https://api.deepseek.com` | API 地址 |
| Model | `deepseek-chat` | 模型名 |

> 💡 推荐使用 DeepSeek（便宜且快），也支持 OpenAI、Anthropic 及任何兼容接口。

### 2.4 阅读顺序建议

想深入理解源码，按以下顺序阅读：

```
第 1 步: package.json  →  了解依赖和脚本
第 2 步: src/main.tsx  →  React 入口
第 3 步: src/App.tsx   →  主应用（# 最核心的前端文件）
第 4 步: src/App.css   →  全局样式 + 深色主题
第 5 步: src/types/product.ts  →  所有 TypeScript 类型定义
第 6 步: src/api/query.ts  →  前端如何调用后端命令
第 7 步: src/hooks/useConversations.ts  →  对话持久化逻辑
第 8 步: src/components/chat/ChatInput.tsx  →  输入框组件
第 9 步: src/components/chat/ThinkingBlock.tsx  →  步骤进度条
第 10 步: src/components/results/ResultCard.tsx  →  商品卡片
第 11 步: src/components/results/PriceComparison.tsx  →  ECharts 图表
第 12 步: src/components/sidebar/Sidebar.tsx + ConversationList.tsx
第 13 步: src/components/settings/SettingsModal.tsx  →  设置弹窗
         ↓ 以下进入 Rust 后端 ↓
第 14 步: src-tauri/src/main.rs  →  入口
第 15 步: src-tauri/src/lib.rs  →  模块注册（# 最核心的后端文件）
第 16 步: src-tauri/src/ai/provider.rs  →  LLM 接口 trait
第 17 步: src-tauri/src/ai/openai_compat.rs  →  OpenAI 实现（含流式）
第 18 步: src-tauri/src/agent/orchestrator.rs  →  三阶段流水线
第 19 步: src-tauri/src/agent/intent.rs  →  意图解析
第 20 步: src-tauri/src/agent/tools.rs  →  搜索 prompt 构建
第 21 步: src-tauri/src/commands/  →  Tauri 命令注册
```

---

## 3. 架构总览

```
┌─────────────────────────────────────────────────────────┐
│  前端 (React 19 + TypeScript)                            │
│                                                           │
│  App.tsx ──布局容器───────────────────────────────────   │
│  ├── Sidebar ──对话管理───────────────────────────────   │
│  │   └── ConversationList ──列表 + 重命名/删除────────   │
│  ├── Header ──标题 + 设置⚙────────────────────────────   │
│  ├── Content ──消息流─────────────────────────────────   │
│  │   ├── ChatBubble (user) ──用户消息────────────────   │
│  │   └── ChatBubble (agent) ──AI 回复─────────────────   │
│  │       ├── ThinkingBlock ──三步骤进度──────────────   │
│  │       ├── MarkdownContent ──推荐文本───────────────   │
│  │       ├── ResultCard ──商品卡片────────────────────   │
│  │       └── PriceComparison ──ECharts 柱状图────────   │
│  ├── Footer ──ChatInput───────────────────────────────   │
│  └── SettingsModal ──LLM 配置─────────────────────────   │
│                                                           │
│  Hooks:                                                   │
│  ├── useConversations ──对话 CRUD + localStorage─────   │
│  └── useZoom ──Ctrl+滚轮缩放─────────────────────────   │
│                                                           │
│  API Layer (Tauri invoke):                                │
│  ├── api/query.ts → invoke("search_products")────────   │
│  └── api/settings.ts → invoke("get/save_settings")────   │
├─────────────────────────────────────────────────────────┤
│  通信层: Tauri IPC + Event System                        │
│  ├── invoke() 请求-响应指令                               │
│  └── listen() 事件推送 (agent-step, agent-stream-chunk)  │
├─────────────────────────────────────────────────────────┤
│  后端 (Rust)                                             │
│                                                           │
│  commands/                                                │
│  ├── query.rs → search_products 命令───────────────────   │
│  └── settings.rs → get/save_settings 命令──────────────   │
│                                                           │
│  agent/                                                   │
│  └── orchestrator.rs ──三阶段流水线───────────────────   │
│      ├── intent.rs → 调用 LLM 解析意图────────────────   │
│      └── tools.rs → 构建搜索 prompt───────────────────   │
│                                                           │
│  ai/                                                      │
│  ├── provider.rs → LlmProvider trait───────────────────   │
│  ├── openai_compat.rs → OpenAI 兼容实现────────────────   │
│  └── anthropic.rs → Anthropic 原生实现─────────────────   │
│                                                           │
│  models/                                                  │
│  └── product.rs → Product, ParsedIntent, AgentResult───   │
│                                                           │
│  lib.rs → 模块注册 + Provider 工厂 + Tauri Builder────   │
│  main.rs → 程序入口───────────────────────────────────   │
│  config.rs → 环境变量读取─────────────────────────────   │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 文件清单与作用

### 4.1 根目录配置文件

| 文件 | 作用 | 关键内容 |
|------|------|----------|
| `package.json` | 前端项目定义 | 依赖(antd, echarts, react-markdown), 脚本(dev/build/tauri) |
| `vite.config.ts` | Vite 构建配置 | `@` 路径别名, Tauri 开发端口 1420, chunk 大小警告 1024KB |
| `tsconfig.json` | TypeScript 配置 | ES2020 target, strict 模式, `@/*` 映射 `src/*` |
| `index.html` | HTML 入口 | `<div id="root">` 挂载点 |
| `pnpm-workspace.yaml` | pnpm 工作区声明 | `onlyBuiltDependencies` 仅允许 esbuild 构建 |

### 4.2 前端源码 (`src/`)

#### 入口

| 文件 | 作用 | 加载时机 |
|------|------|----------|
| `main.tsx` | React 渲染入口，挂载 `<App/>` | 应用启动最先执行 |
| `vite-env.d.ts` | Vite 类型声明引用 | 编译时 |
| `App.tsx` | **主组件**（679→700 行）— 所有业务逻辑 | 挂载后 |
| `App.css` | 全局样式 + Ant Design 深色主题覆盖 | 挂载后 |

#### 类型定义 (`types/`)

| 文件 | 定义 | 说明 |
|------|------|------|
| `product.ts` | `Product` | 商品数据模型（12 个字段） |
| 同上 | `AgentResult` | 后端返回给前端的最终结果 `{products, recommendation}` |
| 同上 | `ChatMessage` | LLM 对话历史 `{role, content}` |
| 同上 | `Conversation` | 对话元数据 `{id, title, lastMessage, createdAt, updatedAt}` |
| 同上 | `Message` | 聊天消息（含 loading/error/result/streamingText 等状态） |
| 同上 | `WELCOME_MESSAGE` | 欢迎语常量 |

#### API 层 (`api/`)

| 文件 | 函数 | 作用 |
|------|------|------|
| `query.ts` | `searchProducts(question, history)` | 通过 `invoke("search_products")` 调用 Rust 后端 |
| `settings.ts` | `getSettings()` / `saveSettings()` | 读写 LLM 配置到后端文件 |

#### 自定义 Hooks (`hooks/`)

| 文件 | 功能 | 持久化 |
|------|------|--------|
| `useConversations.ts` | 对话列表 CRUD + 消息管理 | localStorage (`pc_conversations` / `pc_msg_{id}`) |
| `useZoom.ts` | Ctrl+滚轮缩放 (0.75x ~ 1.5x) | localStorage (`pc_zoom`) |

**`useConversations` 核心状态：**
```
conversations[]   ← localStorage "pc_conversations"
activeId          ← 当前选中对话的 id
messages[]        ← localStorage "pc_msg_{activeId}"
```

#### 组件 (`components/`)

| 文件 | 组件 | 作用 | 关键交互 |
|------|------|------|----------|
| `chat/ChatInput.tsx` | ChatInput | 文本输入框 + 快捷模板 + 发送/停止 | Enter 发送, Shift+Enter 换行, ⚡ 展开快捷模板 |
| `chat/ThinkingBlock.tsx` | ThinkingBlock | 三步骤进度指示器 | 完成→绿, 当前→蓝+脉冲, 计时器 |
| `results/ResultCard.tsx` | ResultCard | 商品卡片列表 + 详情抽屉 | 最低价绿标, 性价比评分, 平台标签, 查看详情 |
| `results/PriceComparison.tsx` | PriceComparison | ECharts 柱状图 | 10 色调色板, 统计摘要, 动态高度 |
| `settings/SettingsModal.tsx` | SettingsModal | LLM 配置弹窗 | 自动弹出(无API Key时), 保存后即刻生效 |
| `sidebar/Sidebar.tsx` | Sidebar | 侧边栏容器 | 折叠/展开 48px↔260px 动画 |
| `sidebar/ConversationList.tsx` | ConversationList | 对话列表 | 重命名(内联编辑), 删除, 时间显示 |

### 4.3 后端源码 (`src-tauri/src/`)

#### 入口与配置

| 文件 | 作用 |
|------|------|
| `main.rs` | Rust 程序入口，隐藏 Windows 控制台，调用 `lib::run()` |
| `lib.rs` | **后端核心**：注册模块、Provider 工厂、Tauri Builder 配置、命令注册 |
| `config.rs` | 环境变量读取，LLM_PROVIDER / LLM_API_KEY / LLM_BASE_URL / LLM_MODEL |

#### 数据模型 (`models/`)

| 文件 | 结构体 | 作用 |
|------|--------|------|
| `product.rs` | `Product` | 商品数据（12 字段，含 `match_type` 标注） |
| 同上 | `ParsedIntent` | LLM 意图解析结果（8 字段） |
| 同上 | `AgentResult` | Agent 最终输出 `{products, recommendation}` |

#### AI Provider 层 (`ai/`)

| 文件 | 核心内容 | 实现方式 |
|------|----------|----------|
| `provider.rs` | `LlmProvider` trait | `chat()` 非流式 + `chat_stream()` 流式 + `StreamCallback` |
| `openai_compat.rs` | OpenAI 兼容实现 | 非流式用 `async-openai` 库，流式用 `reqwest` SSE 解析 |
| `anthropic.rs` | Anthropic 原生实现 | 全部用 `reqwest`，system prompt 分离，SSE 解析 |

#### Agent 编排层 (`agent/`)

| 文件 | 函数 | 作用 |
|------|------|------|
| `orchestrator.rs` | `AgentOrchestrator::run()` | **三阶段流水线**：意图→搜索→推荐，含超时、进度事件、上下文构建 |
| `orchestrator.rs` | `build_context()` | 将对话历史翻译为上下文文本（含商品摘要） |
| `intent.rs` | `parse_intent()` | 调用 LLM 解析用户意图为 `ParsedIntent`，支持上下文追问推断 |
| `tools.rs` | `build_search_prompt()` | 构建详细搜索 prompt，要求 LLM 扮演比价搜索引擎 |

#### Tauri 命令 (`commands/`)

| 文件 | 命令 | 功能 |
|------|------|------|
| `query.rs` | `search_products(app_handle, orchestrator, question, history)` | 从状态获取 orchestrator 读锁，执行流水线 |
| `settings.rs` | `get_settings(app_handle)` | 从文件读取配置，回退到环境变量 |
| `settings.rs` | `save_settings(app_handle, settings)` | 写入文件并**立即重建 orchestrator** |

---

## 5. 文件间调用关系

### 5.1 前端到后端

```
App.tsx (doSearch)
  │
  ├── invoke("search_products", { question, history })
  │     │
  │     ▼  (Tauri IPC)
  │   commands/query.rs
  │     │  orchestrator.read().await
  │     ▼
  │   agent/orchestrator.rs :: run()
  │     │
  │     ├── [Step 0] emit_step(0) ──► Tauri event "agent-step"
  │     │   intent::parse_intent() → LLM chat() (非流式)
  │     │
  │     ├── [Step 1] emit_step(1) ──► Tauri event "agent-step"
  │     │   tools::build_search_prompt() → LLM chat() (非流式)
  │     │
  │     └── [Step 2] emit_step(2) ──► Tauri event "agent-step"
  │         LLM chat_stream() (流式) ──► Tauri event "agent-stream-chunk"
  │
  ├── listen("agent-step") → 更新 msg.stepIndex → ThinkingBlock 进度
  ├── listen("agent-stream-chunk") → 追加以 msg.streamingText → MarkdownContent 渲染
  └── listen("agent-step-error") → 设置 msg.error → 错误提示
```

### 5.2 Rust 后端内部

```
lib.rs :: run()
  │
  ├── config::AppConfig::from_env()
  │   └── 读取环境变量 LLM_PROVIDER/LLM_API_KEY/LLM_BASE_URL/LLM_MODEL
  │
  ├── create_provider(&settings)
  │   ├── "anthropic" → AnthropicProvider::new()
  │   └── "openai"   → OpenAiCompatProvider::new()
  │
  ├── AgentOrchestrator::new(Arc<dyn LlmProvider>)
  │   └── 注册为 Tauri State: Arc<RwLock<AgentOrchestrator>>
  │
  └── Tauri Builder
      ├── .plugin(tauri_plugin_opener)
      ├── .manage(orchestrator)
      └── .invoke_handler([search_products, get_settings, save_settings])
```

### 5.3 数据流（完整请求生命周期）

```
1. 用户输入 "300以内的蓝牙耳机"
        ↓
2. App.tsx → setMessages 添加 user 消息 + loading agent 消息
        ↓
3. App.tsx → 注册 3 个 Tauri 事件监听器
        ↓
4. App.tsx → invoke("search_products")
        ↓
5. query.rs → orchestrator.run(app_handle, question, history)
        ↓
6. orchestrator.rs → build_context(history) → 构建上下文
        ↓
7. orchestrator.rs → emit_step(0), emit_thought("🔍 正在分析…")
        ↓
8. intent.rs → parse_intent(llm, contextual_input)
   → LLM chat(temperature=0.1, max_tokens=500)
   → 返回 ParsedIntent { product_name, budget_max: 300, features: ["运动"] }
        ↓
9. orchestrator.rs → emit_step(1), emit_thought("🛒 正在搜索…")
        ↓
10. tools.rs → build_search_prompt() → 构建详细 prompt
    → LLM chat(temperature=0.3, max_tokens=4096)
    → 返回 JSON { products: [...], recommendation: "" }
    → serde_json::from_str 解析为 SearchResponse
        ↓
11. orchestrator.rs → emit_step(2), emit_thought("💡 正在生成建议…")
        ↓
12. orchestrator.rs → rec_prompt → LLM chat_stream(temperature=0.5, max_tokens=512)
    → 每个 chunk 通过 on_chunk → app.emit("agent-stream-chunk")
    → 前端 listen 回调 → setMessages 追加 streamingText
        ↓
13. 流式结束 → searchProducts 返回 AgentResult → setMessages 设置 result
        ↓
14. ChatBubble 渲染 ResultCard(商品卡片) + PriceComparison(ECharts 柱状图)
```

### 5.4 设置保存的数据流

```
SettingsModal.tsx → 用户点击 Save
  → form.validateFields() → saveSettings(values)
  → invoke("save_settings", { settings })
        ↓
commands/settings.rs
  → serde_json::to_string_pretty → fs::write(settings.json)
  → create_provider(&settings) → AgentOrchestrator::new()
  → state.write().await → *orch = new_orch  ← 热更新！
```

---

## 6. 功能全览

### 6.1 核心功能

| 功能 | 描述 | 实现位置 |
|------|------|----------|
| 🧠 **AI 意图解析** | 从自然语言提取商品类型/预算/功能需求 | `agent/intent.rs` |
| 🔍 **多平台商品搜索** | LLM 模拟京东/淘宝/拼多多/苏宁/天猫搜索 | `agent/tools.rs` |
| 📊 **价格柱状图** | ECharts 动态渲染，10 色调色板，平台颜色与图例一一对应 | `components/results/PriceComparison.tsx` |
| 💡 **结构化推荐** | 📋总结 + 💰推荐理由 + ⚡省钱贴士 三段式输出 | `agent/orchestrator.rs` |
| 📝 **流式输出** | 推荐文本实时打字机效果，逐字展示 | `ai/openai_compat.rs` SSE 解析 + `App.tsx` 事件监听 |
| 🏷️ **匹配度标注** | exact / similar / alternative 三级标注 | `agent/tools.rs` prompt + `ResultCard.tsx` 渲染 |
| ⭐ **性价比评分** | 基于价格+评分计算综合分数，标注最佳性价比 | `ResultCard.tsx` `scoreProduct()` |

### 6.2 交互功能

| 功能 | 描述 | 实现位置 |
|------|------|----------|
| 💬 **连续追问** | 从对话历史推断上下文，支持 "把预算缩小到150" 等 | `orchestrator.rs` `build_context()` + `intent.rs` prompt 规则 4 |
| 🔄 **重新生成** | 点击为 AI 回复重新生成 | `App.tsx` `handleRegenerate()` |
| 🗑️ **配对删除** | 删除任意消息同时移除配对的用户+AI 消息 | `App.tsx` `handleDeleteMessage()` |
| ⏹️ **停止生成** | 中止正在进行的 LLM 请求 | `App.tsx` `handleStop()` → `AbortController.abort()` |
| 📋 **复制内容** | 一键复制消息文字 | `ChatBubble` `handleCopy()` |
| 🔊 **朗读** | 浏览器 TTS 朗读推荐文字 | `ChatBubble` Web Speech API |
| 📂 **对话管理** | 新建/切换/重命名/删除对话 | `hooks/useConversations.ts` + `Sidebar/` |
| 📏 **Ctrl+滚轮缩放** | 0.75x ~ 1.5x 页面缩放 | `hooks/useZoom.ts` → CSS `--zoom-level` |
| ⚡ **快捷模板** | 6 个预设搜索模板（耳机/手机/手表/笔记本/键盘/显示器） | `ChatInput.tsx` |
| 🏆 **最佳价格标注** | 绿色 "🏆 Best price" 徽章 | `ResultCard.tsx` |

### 6.3 系统功能

| 功能 | 描述 | 实现位置 |
|------|------|----------|
| 🔌 **双 Provider 支持** | OpenAI Compatible / Anthropic 随时切换 | `ai/openai_compat.rs` + `ai/anthropic.rs` |
| ⚙️ **设置热更新** | 修改 API 配置后立即生效，无需重启 | `commands/settings.rs` 重建 orchestrator |
| 💾 **对话持久化** | localStorage 存储对话列表和消息 | `hooks/useConversations.ts` |
| ⏱️ **超时保护** | 意图解析 25s，商品搜索 40s 超时 | `orchestrator.rs` `tokio::time::timeout` |
| 🐛 **错误处理** | LLM 失败/JSON 解析失败/超时/空结果均有提示 | `orchestrator.rs` + `App.tsx` |
| 🎨 **深色主题** | GitHub Dark 风格，Ant Design 全覆盖 | `App.css` CSS 变量 + `ConfigProvider` |

---

## 7. 项目亮点

### 7.1 架构设计

**1. Tauri 2.x 桌面框架 — 轻量高效**

相比 Electron，Tauri 使用系统原生 WebView 渲染 + Rust 后端，安装包仅 ~15MB（Electron 同类应用通常 >100MB）。`Arc<RwLock<AgentOrchestrator>>` 作为共享状态管理，读写锁粒度精细。

**2. 三阶段 Agent 流水线**

```
意图解析 → 商品搜索 → 流式推荐
(非流式)    (非流式)    (流式 SSE)
```

每一步通过 Tauri Event 实时通知前端进度，前端 `ThinkingBlock` 动画展示当前步骤。搜索阶段用非流式保证结构化 JSON 完整，推荐阶段用流式保证打字机体验。

**3. Tauri Event 系统替代 WebSocket**

前后端通信不依赖 HTTP 轮询或 WebSocket，直接使用 Tauri 原生 `emit()`/`listen()` IPC 事件系统。`agent-stream-chunk` 事件在 HTTP 字节流回调中**同步发射**，零延迟到达前端。

**4. 双 LLM Provider 架构**

`LlmProvider` trait 抽象了 `chat()` 和 `chat_stream()` 接口，新增 LLM 接入只需实现一个 trait，不用改任何编排逻辑。

### 7.2 前端

**5. Streaming Markdown 渲染**

LLM 流式输出的是 Markdown 文本，前端用 `react-markdown` 实时渲染，每个 chunk 到达时追加到 `streamingText` 状态。自定义了所有 Markdown 元素样式（h1-h3, p, ul, li, code, blockquote, a 等），深色主题统一。

**6. ECharts 动态调色板**

10 色调色板 (`PLATFORM_PALETTE`) 自动为每个平台分配唯一颜色，柱状图颜色与图例 `roundRect` 图标一一对应。顶部统计摘要栏显示最低/最高/均价/平台数。

**7. 性价比评分算法**

```typescript
priceScore = 1 - (price - minPrice) / (maxPrice - minPrice)  // 价格越接近最低，得分越高
ratingScore = rating / 5                                       // 评分标准化
total = priceScore * 0.7 + ratingScore * 0.3                   // 价格权重大于评分
```

### 7.3 后端

**8. REST API + SSE 流式双重实现**

`chat()` 和 `chat_stream()` 分别在同一个 Provider 中实现。非流式用于获取完整 JSON，流式用于实时文本输出，`StreamCallback` 在 HTTP 字节流解析循环中调用，不需要中间 channel。

**9. 上下文感知追问**

`build_context()` 将对话历史中的商品摘要（品名+平台+价格）保留在上下文，并在 prompt 末尾加入 "如果用户追问没有明确重复商品类型，必须从对话历史中推断" 的指令。这使得 "把预算缩小到150" 这样的追问能正确关联到之前讨论的蓝牙耳机。

**10. 设置热更新**

`save_settings` 不仅写文件，还**原地重建 `AgentOrchestrator`**，无需重启应用即可切换 LLM 服务商或 API Key。

### 7.4 UI/UX

**11. 无处不在的进度反馈**

不只是骨架屏。每个阶段都有具体的文字反馈（"🔍 正在分析你的需求…"、"🛒 正在为你搜索蓝牙耳机…"、"💡 正在生成购物建议…"），配合三进度点动画 + 秒表计时器，消除等待焦虑。

**12. 微交互细节**

- 欢迎卡片 hover 上浮 2px + 渐变叠加
- 输入框 focus 蓝色光晕
- 消息气泡 fadeIn 动画
- 步骤点 pulse 动画
- 光标 blink 动画
- 商品卡片 hover 阴影
- 侧边栏展开/折叠过渡动画

---

## 8. 项目意义

### 8.1 技术意义

**Tauri 2.x 实战范例** — 该项目是 Tauri 框架在电商领域的一个完整应用案例，展示了：

- 如何用 Rust 实现复杂的异步 Agent 流水线
- Tauri Event 系统用于实时流式通信的模式
- `Arc<RwLock<T>>` 作为共享状态的正确用法
- 前端 TypeScript + 后端 Rust 的类型对应关系

**LLM Agent 模式** — 并非简单的一问一答 ChatBot，而是一个**编排式的 Agent**：

- 多个 LLM 调用串联为流水线
- 每个调用的 prompt、temperature、max_tokens 独立调优
- 上下文管理实现多轮对话记忆
- 实时事件反馈让用户感知 Agent 思考过程

**流式渲染实践** — 从 Rust SSE → Tauri Event → React setState → ReactMarkdown 渲染的完整流式数据管道。

### 8.2 产品意义

**降低电商决策成本** — 用户用自然语言描述需求，AI 自动完成跨平台比价、评分排序、性价比分析，把原本需要 30 分钟的手动比价压缩到 10 秒。

**去中心化购物建议** — 不依赖单一电商平台的推荐算法，由 LLM 综合多平台信息给出中立的比价建议，减少信息茧房和算法偏见。

**桌面应用形态** — 作为常驻桌面的比价工具，不依赖浏览器插件，没有隐私泄露风险（所有 API 调用走用户自己的 Key）。

### 8.3 扩展潜力

项目架构为以下扩展预留了清晰的切入点：

- 🔌 **真实爬虫接入** — 将 `tools.rs` 的 LLM 模拟搜索替换为真实电商 API / 爬虫
- 📈 **价格历史** — 在 `Conversation` 模型中加入价格趋势数据
- 🌐 **多语言** — 修改 `intent.rs` 和 `tools.rs` 的 prompt 即可切换语言
- 🔐 **OAuth 登录** — Tauri 插件生态支持 OAuth
- 📱 **移动端** — Tauri 2.x 支持 Android/iOS

---

> 📅 文档生成于 2026-07-10 · 项目版本 2.0.0
