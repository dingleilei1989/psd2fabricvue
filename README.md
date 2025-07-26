# PSD转Fabric.js Vue工具

一个基于Vue 3的PSD文件转换工具，可以将PSD文件转换为Fabric.js JSON格式，并保留文字图层的可编辑性。

## 功能特性

- 🎨 **PSD文件解析**: 支持上传和解析PSD文件
- 📝 **文字图层保留**: 文字图层转换为可编辑的Fabric.js文本对象，而非图片
- 🖼️ **图片图层处理**: 图像图层转换为Fabric.js图片对象
- 🌲 **图层树显示**: 可视化图层结构，支持显示/隐藏控制
- 🎯 **实时预览**: Fabric.js画布实时预览转换结果
- 📤 **多格式导出**: 支持导出为PNG、JPEG、SVG、JSON格式
- 🔍 **缩放控制**: 画布缩放、平移、适应屏幕等功能

## 技术栈

- **前端框架**: Vue 3
- **UI组件库**: Element Plus
- **画布库**: Fabric.js
- **PSD解析**: psd.js
- **构建工具**: Vite

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 构建生产版本

```bash
npm run build
```

## 使用说明

### 1. 上传PSD文件
- 在左侧面板点击上传区域或拖拽PSD文件
- 系统将自动解析PSD文件结构
- 显示文件基本信息（尺寸、图层数量等）

### 2. 转换为Fabric.js
- 点击"转换为Fabric.js"按钮
- 系统将解析所有图层并生成Fabric.js对象
- 文字图层保留为可编辑文本，图像图层转换为图片对象

### 3. 图层控制
- 在图层树中可以查看所有图层
- 使用复选框控制图层的显示/隐藏
- 点击图层名称可以在画布中选中对应对象

### 4. 画布操作
- **缩放**: 使用鼠标滚轮或点击缩放按钮
- **平移**: 拖拽画布进行平移
- **重置**: 点击"重置缩放"恢复默认视图
- **适应屏幕**: 自动调整画布大小适应容器

### 5. 导出功能
- **PNG/JPEG**: 导出为图片格式
- **SVG**: 导出为矢量图格式  
- **JSON**: 导出Fabric.js JSON数据

## 文字图层处理

本工具的核心特性是保留文字图层的可编辑性：

### 支持的文字属性
- 文本内容
- 字体大小
- 字体族
- 颜色
- 字重（粗体）
- 字形（斜体）
- 对齐方式
- 行高

### 文字图层识别
系统会自动识别PSD中的文字图层，并尝试提取：
1. 文本内容
2. 字体样式信息
3. 位置和尺寸信息

如果文字图层解析失败，系统会自动回退到图片模式。

## 项目结构

```
src/
├── components/           # Vue组件
│   ├── PsdUploader.vue  # PSD文件上传组件
│   ├── LayerTree.vue    # 图层树组件
│   └── FabricCanvas.vue # Fabric.js画布组件
├── utils/               # 工具类
│   └── psdToFabricConverter.js # PSD转Fabric.js转换器
├── App.vue             # 主应用组件
└── main.js            # 应用入口
```

## 注意事项

1. **PSD文件大小限制**: 建议上传小于100MB的PSD文件
2. **浏览器兼容性**: 需要支持ES6+的现代浏览器
3. **字体支持**: 文字图层的字体需要在系统中安装才能正确显示
4. **复杂效果**: 某些复杂的PSD效果可能无法完全还原

## 开发说明

### 核心类：PsdToFabricConverter

负责PSD到Fabric.js的转换逻辑：

- `convert(psdData)`: 主转换方法
- `parseNode(node)`: 递归解析PSD节点
- `createTextObject()`: 创建文字对象
- `createImageObject()`: 创建图片对象
- `extractTextInfo()`: 提取文字信息

### 组件通信

- PsdUploader → App: 发送解析完成事件
- App → LayerTree: 传递图层数据
- App → FabricCanvas: 传递画布数据
- LayerTree → App: 发送图层控制事件
- App → FabricCanvas: 转发图层控制

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！