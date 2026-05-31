<div align="center">
  <h1>??? ToolVault (FreeResource)</h1>
  <p><strong>一款极致本地化、基于 AI 与无限画布的个人智能资产与工作流管理神器。</strong></p>
  <p><strong>A local-first, AI-powered personal tool and asset manager built with an infinite canvas workflow.</strong></p>
  
  <p>
    <img alt="GitHub License" src="https://img.shields.io/github/license/TiAmoLam/freeresource?style=flat-square&color=blue">
    <img alt="React" src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react">
    <img alt="Electron" src="https://img.shields.io/badge/Electron-Desktop-9cf?style=flat-square&logo=electron">
    <img alt="Zustand" src="https://img.shields.io/badge/State-Zustand-orange?style=flat-square">
  </p>
</div>

---

[English](#english) | [中文](#中文)

<h2 id="中文">???? 中文说明</h2>

**ToolVault** (代码代号 FreeResource) 是一款跨平台的桌面级资源管理引擎。当你收藏了大量的网站、软件、AI Prompt、设计素材，却发现传统的收藏夹和 Notion 表格已经无法满足你对“关联性”和“处理流程”的需求时，ToolVault 为您提供了一个完美的解决方案。

### ? 核心特性 (Features)

- ?? **纯粹本地化与隐私优先 (Local-First)**：没有强制的云端同步，没有账号登录系统。你的所有数据、网页快照和标签都原封不动地保存在你的硬盘里（基于 IndexedDB 与 File System Access API 自动无感备份）。
- ?? **AI 自动归类 (Bring Your Own Key)**：内置集成各大主流大模型（DeepSeek, OpenAI, Claude, 阿里云等）。只需输入一个网址，AI 会自动为您提取关键信息、生成高斯模糊缩略图，并精准打上标签。
- ?? **无限画布工作流 (Infinite Canvas)**：所有收藏不仅是列表里的卡片。在“工作流”模式下，您可以把工具拖拽到画布上，**360° 自由双向连线**，将单一的工具串联成解决问题的“SOP 节点”。
- ?? **原生无边框设计 (Native Frameless UX)**：采用 Electron 深度定制的无边框玻璃态 UI，支持多维度过滤、智能搜索与全局暗黑模式。

### ????? 致使用者：如何开始？

1. **下载安装包**：
   前往本仓库的 [Releases 页面](../../releases)。
   - **Windows 用户**：下载 .exe 安装包。
   - **macOS 用户**：下载 .dmg 安装包 (支持 Apple Silicon & Intel)。
2. **零配置启动**：双击安装后即可使用，无需配置数据库。
3. **数据管理与备份**：点击右上角的“数据库”图标，您可以一键将所有资源与画布导出为 .json，或者授权一个本地文件夹开启“全自动静默备份”。

### ????? 致开发者：二次开发与构建

本项目的架构非常现代且轻量，如果您想基于本项目构建自己的超级大脑，请参考以下指南。

#### 技术架构
- **前端核心**：React 19 + Vite + Zustand (状态管理)
- **视觉交互**：原生 CSS 变量系统 + Radix UI + Lucide React
- **无限画布**：@xyflow/react (React Flow)
- **本地存储**：idb-keyval (IndexedDB 封装)
- **桌面引擎**：Electron + Electron-Builder

#### 本地运行指南

1. **克隆项目**
   `ash
   git clone https://github.com/TiAmoLam/freeresource.git
   cd freeresource
   `
2. **安装依赖**
   `ash
   npm install
   `
3. **启动开发环境 (热更新)**
   `ash
   npm run dev:electron
   `

#### 打包构建
我们配置了 GitHub Actions。只要您向仓库推送带有 * 的 Tag，系统会自动为您编译全平台的安装包并发布。
手动打包请执行：
`ash
npm run build:electron
`
产物将生成在 elease/ 目录。

---

<h2 id="english">???? English</h2>

**ToolVault** (codename: FreeResource) is a cross-platform desktop application designed for power users who need to organize massive amounts of digital assets, SaaS tools, prompts, and design resources. 

### ? Key Features

- ?? **Local-First & Privacy-Focused**: No forced cloud sync, no mandatory accounts. All your data is stored locally via IndexedDB with silent automated backups using the File System Access API.
- ?? **AI-Powered Tagging (BYOK)**: Connect your own API keys (DeepSeek, OpenAI, Claude). Paste a URL, and the AI automatically extracts metadata, generates a summary, and assigns semantic tags.
- ?? **Infinite Canvas Workflows**: Assets are more than just cards in a list. Drag and drop them onto the Infinite Canvas, and connect them with **360° bi-directional edges** to build operational SOP nodes.
- ?? **Frameless Native UX**: Custom-built frameless Electron window with a glassmorphism design, advanced multi-dimensional filtering, and seamless dark mode.

### ????? For Users: Getting Started

1. **Download**: Go to the [Releases page](../../releases) and grab the .exe (Windows) or .dmg (macOS).
2. **Run**: Install and use immediately—no database setup required.
3. **Backup**: Click the Database icon to export everything to a .json file, or select a local folder to enable automatic silent backups.

### ????? For Developers: Building & Hacking

#### Tech Stack
- **Core**: React 19 + Vite + Zustand
- **UI**: Vanilla CSS + Radix UI
- **Canvas**: @xyflow/react
- **Desktop**: Electron + Electron-Builder

#### Run Locally
`ash
git clone https://github.com/TiAmoLam/freeresource.git
cd freeresource
npm install
npm run dev:electron
`

#### Build
Push a tag starting with  to trigger GitHub Actions auto-build, or run manually:
`ash
npm run build:electron
`

---
<div align="center">
  <p>Released under the MIT License.</p>
</div>
