# 🛒 跨平台比价智能体

基于大模型的桌面比价应用。输入自然语言，AI 自动跨平台比价并给出推荐。

## 功能

- 🔍 **自然语言比价** — 输入"300 以内运动蓝牙耳机"，自动匹配推荐
- ⚡ **流式输出** — LLM 回复实时打字显示，支持中途中断
- 🌙 **暗色主题** — GitHub Dark 风格，全组件覆盖
- 🤖 **双模型兼容** — OpenAI 兼容格式 + Anthropic Claude，设置页一键切换
- 💬 **对话历史** — 历史对话侧栏，多轮追问上下文记忆
- 🧠 **思考可见** — LLM 推理过程可展开查看
- 📊 **结果卡片** — 商品详情抽屉 + 价格对比图表

## 技术栈

| 层 | 技术 |
|------|------|
| 桌面框架 | Tauri 2 |
| 后端 | Rust (tokio, async-openai, reqwest) |
| 前端 | React 19 + TypeScript |
| UI | Ant Design 5 + ECharts |

## 开发

```bash
pnpm install
pnpm tauri dev      # 启动开发服务器
pnpm tauri build    # 构建安装包
```

首次运行在设置页（右上角齿轮）配置 API Key。

## 文档

[pca-docs](https://badnuker.github.io/pca-docs/)

## 许可证

GPLv3
