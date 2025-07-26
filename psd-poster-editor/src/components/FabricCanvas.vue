<template>
  <div class="fabric-canvas-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-section">
        <h4>编辑工具</h4>
        <div class="tool-buttons">
          <button 
            class="tool-btn" 
            :class="{ active: selectedTool === 'select' }"
            @click="setTool('select')"
            title="选择工具"
          >
            🔍
          </button>
          <button 
            class="tool-btn" 
            :class="{ active: selectedTool === 'text' }"
            @click="setTool('text')"
            title="文本工具"
          >
            📝
          </button>
          <button 
            class="tool-btn" 
            @click="deleteSelected"
            :disabled="!selectedObject"
            title="删除选中"
          >
            🗑️
          </button>
        </div>
      </div>
      
      <!-- 文本样式控制 -->
      <div v-if="selectedObject && selectedObject.type === 'text'" class="toolbar-section">
        <h4>文本样式</h4>
        <div class="text-controls">
          <div class="control-group">
            <label>字体大小:</label>
            <input 
              type="number" 
              v-model="textFontSize" 
              @input="updateTextStyle('fontSize', textFontSize)"
              min="8" 
              max="200"
              class="control-input"
            />
          </div>
          <div class="control-group">
            <label>字体颜色:</label>
            <input 
              type="color" 
              v-model="textColor" 
              @input="updateTextStyle('fill', textColor)"
              class="control-color"
            />
          </div>
          <div class="control-group">
            <label>字体族:</label>
            <select 
              v-model="textFontFamily" 
              @change="updateTextStyle('fontFamily', textFontFamily)"
              class="control-select"
            >
              <option value="Arial, sans-serif">Arial</option>
              <option value="Helvetica, sans-serif">Helvetica</option>
              <option value="Times New Roman, serif">Times New Roman</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="Verdana, sans-serif">Verdana</option>
              <option value="Monaco, monospace">Monaco</option>
            </select>
          </div>
          <div class="control-group">
            <label>文本内容:</label>
            <textarea 
              v-model="textContent" 
              @input="updateTextStyle('text', textContent)"
              class="control-textarea"
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>
      
      <!-- 导出控制 -->
      <div class="toolbar-section">
        <h4>导出</h4>
        <div class="export-buttons">
          <button class="export-btn" @click="exportAsJSON">
            📄 导出JSON
          </button>
          <button class="export-btn" @click="exportAsPNG">
            🖼️ 导出PNG
          </button>
        </div>
      </div>
    </div>
    
    <!-- 画布容器 -->
    <div class="canvas-wrapper">
      <div class="canvas-container" ref="canvasContainer">
        <canvas ref="fabricCanvas"></canvas>
      </div>
      
      <!-- 图层面板 -->
      <div class="layers-panel">
        <h4>图层</h4>
        <div class="layer-list">
          <div 
            v-for="(object, index) in canvasObjects" 
            :key="object.id || index"
            class="layer-item"
            :class="{ active: selectedObject === object }"
            @click="selectObject(object)"
          >
            <span class="layer-icon">
              {{ object.type === 'text' ? '📝' : '🖼️' }}
            </span>
            <span class="layer-name">{{ object.name || `${object.type} ${index + 1}` }}</span>
            <div class="layer-controls">
              <button 
                class="layer-control-btn"
                @click.stop="toggleVisibility(object)"
                :title="object.visible !== false ? '隐藏' : '显示'"
              >
                {{ object.visible !== false ? '👁️' : '🙈' }}
              </button>
              <button 
                class="layer-control-btn"
                @click.stop="deleteObject(object)"
                title="删除"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 状态栏 -->
    <div class="status-bar">
      <span class="status-info">
        画布尺寸: {{ canvasWidth }}×{{ canvasHeight }}px
      </span>
      <span v-if="selectedObject" class="status-info">
        选中: {{ selectedObject.name || selectedObject.type }}
      </span>
      <span class="status-info">
        图层数: {{ canvasObjects.length }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { fabric } from 'fabric';

// Props
const props = defineProps({
  objects: {
    type: Array,
    default: () => []
  },
  canvasWidth: {
    type: Number,
    default: 800
  },
  canvasHeight: {
    type: Number,
    default: 600
  }
});

// Emits
const emit = defineEmits(['objectSelected', 'objectModified', 'canvasChanged']);

// 响应式数据
const fabricCanvas = ref(null);
const canvasContainer = ref(null);
const canvas = ref(null);
const selectedObject = ref(null);
const selectedTool = ref('select');
const canvasObjects = ref([]);

// 文本控制
const textFontSize = ref(16);
const textColor = ref('#000000');
const textFontFamily = ref('Arial, sans-serif');
const textContent = ref('');

/**
 * 组件挂载后初始化fabric画布
 */
onMounted(async () => {
  await initializeFabricCanvas();
  
  // 如果有初始对象，渲染它们
  if (props.objects && props.objects.length > 0) {
    await renderObjects(props.objects);
  }
});

/**
 * 监听对象变化
 */
watch(() => props.objects, async (newObjects) => {
  if (newObjects && newObjects.length > 0) {
    await renderObjects(newObjects);
  }
}, { deep: true });

/**
 * 初始化Fabric.js画布
 */
async function initializeFabricCanvas() {
  try {
    // 创建fabric画布
    canvas.value = new fabric.Canvas(fabricCanvas.value, {
      width: props.canvasWidth,
      height: props.canvasHeight,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true
    });
    
    // 设置画布边框
    canvas.value.setBackgroundColor('#ffffff', canvas.value.renderAll.bind(canvas.value));
    
    // 绑定事件监听器
    setupEventListeners();
    
    console.log('Fabric画布初始化成功');
  } catch (error) {
    console.error('Fabric画布初始化失败:', error);
  }
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  if (!canvas.value) return;
  
  // 对象选择事件
  canvas.value.on('selection:created', (event) => {
    handleObjectSelection(event.selected[0]);
  });
  
  canvas.value.on('selection:updated', (event) => {
    handleObjectSelection(event.selected[0]);
  });
  
  canvas.value.on('selection:cleared', () => {
    handleObjectSelection(null);
  });
  
  // 对象修改事件
  canvas.value.on('object:modified', (event) => {
    emit('objectModified', event.target);
    updateCanvasObjects();
  });
  
  // 画布变化事件
  canvas.value.on('path:created', () => {
    emit('canvasChanged');
    updateCanvasObjects();
  });
  
  // 鼠标事件（用于添加文本）
  canvas.value.on('mouse:down', (event) => {
    if (selectedTool.value === 'text' && !event.target) {
      addTextAtPosition(event.pointer);
    }
  });
}

/**
 * 处理对象选择
 * @param {Object} object - 选中的对象
 */
function handleObjectSelection(object) {
  selectedObject.value = object;
  
  if (object && object.type === 'text') {
    // 更新文本控制参数
    textFontSize.value = object.fontSize || 16;
    textColor.value = object.fill || '#000000';
    textFontFamily.value = object.fontFamily || 'Arial, sans-serif';
    textContent.value = object.text || '';
  }
  
  emit('objectSelected', object);
}

/**
 * 渲染对象到画布
 * @param {Array} objects - 要渲染的对象数组
 */
async function renderObjects(objects) {
  if (!canvas.value || !objects) return;
  
  try {
    // 清空画布
    canvas.value.clear();
    canvas.value.setBackgroundColor('#ffffff', canvas.value.renderAll.bind(canvas.value));
    
    // 渲染每个对象
    for (const objectData of objects) {
      await addObjectToCanvas(objectData);
    }
    
    // 更新图层列表
    updateCanvasObjects();
    
    // 重新渲染画布
    canvas.value.renderAll();
    
    console.log(`成功渲染 ${objects.length} 个对象到画布`);
  } catch (error) {
    console.error('渲染对象失败:', error);
  }
}

/**
 * 添加对象到画布
 * @param {Object} objectData - 对象数据
 */
async function addObjectToCanvas(objectData) {
  try {
    let fabricObject = null;
    
    if (objectData.type === 'text') {
      // 创建文本对象
      fabricObject = new fabric.Text(objectData.text, {
        left: objectData.left,
        top: objectData.top,
        fontSize: objectData.fontSize,
        fontFamily: objectData.fontFamily,
        fill: objectData.fill,
        fontWeight: objectData.fontWeight,
        fontStyle: objectData.fontStyle,
        textAlign: objectData.textAlign,
        opacity: objectData.opacity || 1,
        angle: objectData.angle || 0,
        scaleX: objectData.scaleX || 1,
        scaleY: objectData.scaleY || 1
      });
    } else if (objectData.type === 'image') {
      // 创建图像对象
      fabricObject = await createImageObject(objectData);
    }
    
    if (fabricObject) {
      // 设置自定义属性
      fabricObject.set({
        name: objectData.name,
        layerType: objectData.layerType,
        originalBounds: objectData.originalBounds,
        id: objectData.id || generateId()
      });
      
      // 添加到画布
      canvas.value.add(fabricObject);
    }
  } catch (error) {
    console.warn(`添加对象失败: ${objectData.name}`, error);
  }
}

/**
 * 创建图像对象
 * @param {Object} imageData - 图像数据
 * @returns {Promise<fabric.Image>} fabric图像对象
 */
function createImageObject(imageData) {
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(imageData.src, (img) => {
      if (img) {
        img.set({
          left: imageData.left,
          top: imageData.top,
          opacity: imageData.opacity || 1,
          angle: imageData.angle || 0,
          scaleX: imageData.scaleX || 1,
          scaleY: imageData.scaleY || 1,
          crossOrigin: 'anonymous'
        });
        
        // 如果有指定尺寸，缩放图像
        if (imageData.width && imageData.height) {
          img.scaleToWidth(imageData.width);
          img.scaleToHeight(imageData.height);
        }
        
        resolve(img);
      } else {
        reject(new Error('图像加载失败'));
      }
    }, {
      crossOrigin: 'anonymous'
    });
  });
}

/**
 * 设置当前工具
 * @param {string} tool - 工具类型
 */
function setTool(tool) {
  selectedTool.value = tool;
  
  if (tool === 'select') {
    canvas.value.selection = true;
    canvas.value.defaultCursor = 'default';
  } else if (tool === 'text') {
    canvas.value.selection = false;
    canvas.value.defaultCursor = 'crosshair';
  }
}

/**
 * 在指定位置添加文本
 * @param {Object} position - 位置坐标
 */
function addTextAtPosition(position) {
  const text = new fabric.Text('新文本', {
    left: position.x,
    top: position.y,
    fontSize: 20,
    fontFamily: 'Arial, sans-serif',
    fill: '#000000'
  });
  
  text.set({
    name: `文本 ${canvasObjects.value.length + 1}`,
    layerType: 'text',
    id: generateId()
  });
  
  canvas.value.add(text);
  canvas.value.setActiveObject(text);
  updateCanvasObjects();
}

/**
 * 更新文本样式
 * @param {string} property - 属性名
 * @param {any} value - 属性值
 */
function updateTextStyle(property, value) {
  if (!selectedObject.value || selectedObject.value.type !== 'text') return;
  
  selectedObject.value.set(property, value);
  canvas.value.renderAll();
  
  emit('objectModified', selectedObject.value);
}

/**
 * 选择对象
 * @param {Object} object - 要选择的对象
 */
function selectObject(object) {
  if (!canvas.value) return;
  
  const fabricObjects = canvas.value.getObjects();
  const targetObject = fabricObjects.find(obj => 
    obj.id === object.id || obj === object
  );
  
  if (targetObject) {
    canvas.value.setActiveObject(targetObject);
    canvas.value.renderAll();
  }
}

/**
 * 删除选中对象
 */
function deleteSelected() {
  if (!selectedObject.value || !canvas.value) return;
  
  canvas.value.remove(selectedObject.value);
  selectedObject.value = null;
  updateCanvasObjects();
}

/**
 * 删除指定对象
 * @param {Object} object - 要删除的对象
 */
function deleteObject(object) {
  if (!canvas.value) return;
  
  const fabricObjects = canvas.value.getObjects();
  const targetObject = fabricObjects.find(obj => 
    obj.id === object.id || obj === object
  );
  
  if (targetObject) {
    canvas.value.remove(targetObject);
    updateCanvasObjects();
  }
}

/**
 * 切换对象可见性
 * @param {Object} object - 要切换的对象
 */
function toggleVisibility(object) {
  if (!canvas.value) return;
  
  const fabricObjects = canvas.value.getObjects();
  const targetObject = fabricObjects.find(obj => 
    obj.id === object.id || obj === object
  );
  
  if (targetObject) {
    targetObject.set('visible', !targetObject.visible);
    canvas.value.renderAll();
    updateCanvasObjects();
  }
}

/**
 * 更新画布对象列表
 */
function updateCanvasObjects() {
  if (!canvas.value) return;
  
  const objects = canvas.value.getObjects().map(obj => ({
    id: obj.id,
    name: obj.name || `${obj.type} ${canvas.value.getObjects().indexOf(obj) + 1}`,
    type: obj.type,
    layerType: obj.layerType,
    visible: obj.visible !== false,
    // 保持对原始fabric对象的引用
    ...obj
  }));
  
  canvasObjects.value = objects;
}

/**
 * 导出为JSON
 */
function exportAsJSON() {
  if (!canvas.value) return;
  
  const json = canvas.value.toJSON(['name', 'layerType', 'id', 'originalBounds']);
  
  // 创建下载链接
  const dataStr = JSON.stringify(json, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'poster-design.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 导出为PNG
 */
function exportAsPNG() {
  if (!canvas.value) return;
  
  // 设置高质量导出
  const dataURL = canvas.value.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: 2 // 2倍分辨率
  });
  
  // 创建下载链接
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'poster-design.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
function generateId() {
  return 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 暴露方法给父组件
defineExpose({
  getCanvas: () => canvas.value,
  exportAsJSON,
  exportAsPNG,
  addText: addTextAtPosition,
  clearCanvas: () => {
    if (canvas.value) {
      canvas.value.clear();
      updateCanvasObjects();
    }
  },
  loadFromJSON: (json) => {
    if (canvas.value) {
      canvas.value.loadFromJSON(json, () => {
        canvas.value.renderAll();
        updateCanvasObjects();
      });
    }
  }
});
</script>

<style scoped>
.fabric-canvas-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.toolbar {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
}

.toolbar-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.tool-buttons {
  display: flex;
  gap: 8px;
}

.tool-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.tool-btn:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.tool-btn.active {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-group label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

.control-input, .control-select {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  width: 80px;
}

.control-color {
  width: 40px;
  height: 30px;
  padding: 0;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
}

.control-textarea {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  width: 150px;
  resize: vertical;
}

.export-buttons {
  display: flex;
  gap: 8px;
}

.export-btn {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.export-btn:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.canvas-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f9fafb;
}

.canvas-container canvas {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.layers-panel {
  width: 250px;
  background: white;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}

.layers-panel h4 {
  margin: 0;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e2e8f0;
}

.layer-list {
  flex: 1;
  overflow-y: auto;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.layer-item:hover {
  background: #f8fafc;
}

.layer-item.active {
  background: #eff6ff;
  border-color: #3b82f6;
}

.layer-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.layer-name {
  flex: 1;
  font-size: 14px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layer-controls {
  display: flex;
  gap: 4px;
}

.layer-control-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.layer-control-btn:hover {
  background: #e5e7eb;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: white;
  border-top: 1px solid #e2e8f0;
  font-size: 12px;
  color: #6b7280;
}

.status-info {
  padding: 4px 8px;
  background: #f8fafc;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .canvas-wrapper {
    flex-direction: column;
  }
  
  .layers-panel {
    width: 100%;
    max-height: 200px;
  }
  
  .toolbar {
    flex-wrap: wrap;
  }
  
  .text-controls {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .toolbar {
    padding: 12px;
    gap: 12px;
  }
  
  .canvas-container {
    padding: 10px;
  }
  
  .status-bar {
    flex-wrap: wrap;
  }
}
</style>