# FreeResource 📦

FreeResource 是一款基于 Electron 构建的智能化资源管理工具。它结合了 AI 分析、相似度检索、思维导图可视化以及自动化工作流，帮助您高效地组织和管理项目资产。

[English](#english) | [中文](#中文)

---

<h2 id="中文">🇨🇳 中文说明</h2>

### 👩‍💻 给普通用户的说明 (如何使用)

如果您只想直接使用这款软件，而不需要修改源码，请按照以下步骤操作：

1. **下载安装包**：
   前往本仓库的 [Releases 页面](../../releases)。
   - **Windows 用户**：下载 `.exe` 安装文件。
   - **macOS 用户**：下载 `.dmg` 安装文件。
   - **Linux 用户**：下载 `.AppImage` 文件。
2. **安装**：双击下载的安装包并按照提示完成安装。
3. **主要功能**：
   - 🧠 **AI 智能分析**：自动为您的资源生成标签和描述。
   - 🔍 **相似度检索**：快速找到关联和相似的项目资产。
   - 🗺️ **思维导图视图**：以结构化的方式浏览您的资源库。
   - ⚙️ **自动化工作流**：自定义节点处理资源。
   - 💾 **自动备份**：保护您的数据安全。

---

### 👨‍💻 给开发者的说明 (二次开发)

如果您想参与开发或自己编译打包本项目，请遵循以下指南。

#### 技术栈
- **前端框架**：React 19 + Vite
- **状态管理**：Zustand
- **UI 组件库**：Radix UI + Lucide React
- **桌面端框架**：Electron + Electron-Builder
- **其他关键依赖**：@xyflow/react (工作流/节点图), fuse.js (模糊搜索), idb-keyval (本地数据库)

#### 本地运行与开发

1. **克隆项目**
   ```bash
   git clone https://github.com/YourUsername/freeresource.git
   cd freeresource
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发环境** (将同时启动 Vite 服务和 Electron 窗口)
   ```bash
   npm run dev:electron
   ```

#### 打包构建

本项目配置了 **GitHub Actions** 自动化构建。当您推送代码带有 `v*` 标签时，云端会自动构建 Windows 和 macOS 版本并发布到 Releases 中。

如果您想在本地手动打包：

```bash
# 生成系统对应的安装包 (Windows下生成 .exe，macOS下生成 .dmg)
npm run build:electron
```
打包后的产物将位于 `release/` 目录下。

---

<h2 id="english">🇬🇧 English</h2>

### 👩‍💻 For Users (How to use)

If you just want to use the application without touching the source code:

1. **Download the Installer**:
   Go to the [Releases page](../../releases) of this repository.
   - **Windows**: Download the `.exe` file.
   - **macOS**: Download the `.dmg` file.
   - **Linux**: Download the `.AppImage` file.
2. **Install**: Double-click the downloaded file to install the application.
3. **Key Features**:
   - 🧠 **AI Analysis**: Automatically tag and describe your resources.
   - 🔍 **Similarity Search**: Quickly find related project assets.
   - 🗺️ **Mindmap View**: Visually explore your resource library.
   - ⚙️ **Automated Workflows**: Customize nodes to process resources.
   - 💾 **Auto Backup**: Keep your data safe.

---

### 👨‍💻 For Developers

If you want to modify the source code or build the application yourself:

#### Tech Stack
- **Frontend**: React 19 + Vite
- **State Management**: Zustand
- **Desktop**: Electron + Electron-Builder
- **Key Libraries**: @xyflow/react, fuse.js, Radix UI

#### Local Development

1. **Clone & Install**
   ```bash
   git clone https://github.com/YourUsername/freeresource.git
   cd freeresource
   npm install
   ```

2. **Start Dev Server**
   ```bash
   npm run dev:electron
   ```

#### Build

This project uses **GitHub Actions** for CI/CD. Pushing a tag (e.g., `v1.0.0`) will automatically build and publish installers for Windows, macOS, and Linux to the Releases page.

To build manually on your local machine:
```bash
npm run build:electron
```
The built installers will be in the `release/` directory.
