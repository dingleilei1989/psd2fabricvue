# PSD海报编辑器

一个基于Vue 3的PSD文件解析和海报编辑应用，使用psd.js解析PSD文件，并通过fabric.js提供可视化编辑功能。

## 功能特性

### 核心功能
- 📁 **PSD文件上传** - 支持拖拽和点击上传PSD文件
- 🔍 **智能解析** - 自动解析PSD图层结构，提取图像和文本
- 🎨 **可视化编辑** - 使用fabric.js提供直观的画布编辑体验
- 💾 **多格式导出** - 支持导出为PNG图片和JSON数据

### 编辑功能
- ✏️ **文本编辑** - 实时修改文本内容、字体、颜色、大小
- 🖼️ **图层管理** - 图层显示/隐藏、删除、重新排序
- 🎯 **精确定位** - 拖拽移动、缩放、旋转图层
- 👁️ **图层面板** - 直观的图层列表和控制面板

### 技术亮点
- 🚀 **性能优化** - 大文件处理和渲染优化
- 📱 **响应式设计** - 适配各种屏幕尺寸
- 🎭 **现代UI** - 美观的用户界面和交互体验
- 🔧 **模块化架构** - 组件解耦，易于维护和扩展

## 技术栈

- **前端框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **PSD解析**: psd.js (v3.4.0+)
- **画布编辑**: fabric.js (v5.3.0+)
- **语言**: JavaScript (ES6+)

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 使用指南

### 1. 上传PSD文件
- 点击上传区域或直接拖拽PSD文件
- 支持最大100MB的文件大小
- 仅支持.psd格式文件

### 2. 等待解析
- 系统自动解析PSD文件结构
- 提取图像图层和文本图层
- 转换为fabric.js兼容格式

### 3. 编辑海报
- **选择工具**: 点击工具栏选择选择工具或文本工具
- **移动图层**: 拖拽图层进行位置调整
- **编辑文本**: 选中文本图层后在右侧面板修改属性
- **图层管理**: 在右侧图层面板控制图层显示和删除

### 4. 导出作品
- **PNG导出**: 导出高质量的海报图片
- **JSON导出**: 保存编辑数据，支持后续加载

## 项目结构

```
src/
├── components/           # Vue组件
│   ├── PsdUploader.vue  # PSD文件上传组件
│   └── FabricCanvas.vue # 画布编辑组件
├── utils/               # 工具类
│   └── PsdParser.js     # PSD解析工具
├── App.vue             # 主应用组件
└── main.js             # 应用入口
```

## 组件说明

### PsdUploader.vue
PSD文件上传组件，负责：
- 文件选择和验证
- 拖拽上传支持
- 解析进度显示
- 错误处理

**主要方法**：
- `handleFileSelect()` - 处理文件选择
- `parseFile()` - 解析PSD文件
- `validateFile()` - 文件格式验证

### FabricCanvas.vue
Fabric.js画布组件，负责：
- 画布初始化和渲染
- 图层对象管理
- 编辑工具提供
- 导出功能

**主要方法**：
- `renderObjects()` - 渲染图层对象
- `addObjectToCanvas()` - 添加对象到画布
- `exportAsPNG()` - 导出PNG图片
- `exportAsJSON()` - 导出JSON数据

### PsdParser.js
PSD解析工具类，负责：
- PSD文件读取和解析
- 图层数据提取
- 格式转换
- 性能优化

**主要方法**：
- `parsePsdFile()` - 解析PSD文件
- `parseLayers()` - 递归解析图层
- `createTextObject()` - 创建文本对象
- `createImageObject()` - 创建图像对象

## 配置说明

### 画布尺寸
默认画布尺寸为800x600px，可在以下位置修改：
```javascript
// PsdParser.js
constructor() {
  this.canvasWidth = 800;  // 修改默认宽度
  this.canvasHeight = 600; // 修改默认高度
}
```

### 文件大小限制
默认支持最大100MB文件，可在App.vue中修改：
```vue
<PsdUploader 
  :maxFileSize="100 * 1024 * 1024"  <!-- 修改文件大小限制 -->
/>
```

### 支持的字体
默认字体列表可在FabricCanvas.vue中修改：
```vue
<select v-model="textFontFamily">
  <option value="Arial, sans-serif">Arial</option>
  <!-- 添加更多字体选项 -->
</select>
```

## 性能优化

### 大文件处理
- 使用ArrayBuffer进行文件读取
- 分批处理图层数据
- 图像懒加载和缓存

### 渲染优化
- Canvas对象池管理
- 节流处理用户交互
- 自适应画布尺寸

### 内存管理
- 及时清理临时对象
- 图像资源自动释放
- 组件卸载时清理事件监听

## 常见问题

### Q: PSD文件解析失败
A: 确认文件格式正确，尝试以下解决方案：
- 检查文件是否损坏
- 确认文件大小在限制范围内
- 尝试重新保存PSD文件

### Q: 图层显示不正确
A: 可能的原因和解决方案：
- 检查图层是否包含有效数据
- 确认图层可见性设置
- 查看浏览器控制台错误信息

### Q: 文本编辑不生效
A: 确认以下设置：
- 选择了正确的文本图层
- 字体在系统中可用
- 文本内容不为空

### Q: 导出图片质量不佳
A: 调整导出设置：
- 增加导出分辨率倍数
- 检查原始图层质量
- 使用PNG格式保持透明度

## 扩展开发

### 添加新的导出格式
```javascript
// 在FabricCanvas.vue中添加新方法
function exportAsJPEG() {
  const dataURL = canvas.value.toDataURL({
    format: 'jpeg',
    quality: 0.8
  });
  // 下载逻辑
}
```

### 支持更多图层类型
```javascript
// 在PsdParser.js中扩展图层解析
if (layerInfo.type === 'shape') {
  return this.createShapeObject(layerInfo, bounds, name);
}
```

### 添加滤镜效果
```javascript
// 使用fabric.js滤镜
const filter = new fabric.Image.filters.Brightness({
  brightness: 0.2
});
imageObject.filters.push(filter);
imageObject.applyFilters();
```

## 许可证

MIT License

## 贡献指南

欢迎提交Issue和Pull Request来改进项目！

### 开发规范
- 使用ES6+语法
- 遵循Vue 3 Composition API规范
- 添加详细的代码注释
- 编写单元测试（推荐）

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建工具等

---

**享受使用PSD海报编辑器！** 🎨
