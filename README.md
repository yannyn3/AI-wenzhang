# AI文章创作室

一个基于多种AI服务的文章创作工具，支持多种主题风格和排版模板。

## 功能特点

- 支持多个AI服务提供商（OpenAI、Anthropic、Poe、DeepSeek、百度文心一言、月之暗面）
- 丰富的文章主题风格（现代简约、杂志风格、科技风格、优雅商务、创意设计、学术论文、自媒体风格）
- 支持自定义API代理
- 响应式设计，支持深色模式
- 纯前端实现，无需后端服务

## 部署指南

### 部署到GitHub Pages

1. 创建GitHub仓库
   - 登录GitHub账号
   - 点击右上角的 "+" 按钮，选择 "New repository"
   - 填写仓库名称（例如：ai-writer）
   - 选择 "Public" 公开仓库
   - 点击 "Create repository"

2. 上传代码
   - 将以下文件上传到仓库：
     - index.html（将原代码文件重命名为index.html）
     - api-manager.js
     - README.md

3. 启用GitHub Pages
   - 进入仓库设置（Settings）
   - 找到 "Pages" 选项
   - 在 "Source" 部分，选择 "main" 分支
   - 点击 "Save"
   - 等待几分钟，GitHub Pages将自动部署你的网站

### 本地部署

1. 下载代码
   - 克隆仓库或下载ZIP文件
   - 解压文件（如果是ZIP）

2. 使用本地服务器
   - 使用Python：
     ```bash
     python -m http.server 8000
     ```
   - 或使用Node.js的http-server：
     ```bash
     npx http-server
     ```

3. 访问网站
   - 打开浏览器
   - 访问 http://localhost:8000

## 使用说明

1. 配置API
   - 点击 "API配置" 标签
   - 选择AI服务提供商
   - 输入对应的API密钥
   - 可选：配置API代理

2. 创作文章
   - 填写文章标题和创作提示
   - 选择文章长度
   - 选择主题风格
   - 点击 "创作精彩文章" 按钮

3. 预览和导出
   - 在 "预览排版" 标签中查看文章效果
   - 可以复制文章内容或下载为Markdown格式

## 注意事项

- API密钥安全：部署在GitHub Pages上时，API密钥存储在浏览器本地，不会上传到服务器
- 跨域问题：如果遇到API调用跨域问题，请配置合适的API代理
- 浏览器兼容：建议使用最新版本的Chrome、Firefox或Safari浏览器

## 技术栈

- HTML5
- TailwindCSS
- JavaScript (ES6+)
- Marked.js（Markdown渲染）
- DOMPurify（XSS防护）
- Font Awesome（图标）

## 许可证

MIT License