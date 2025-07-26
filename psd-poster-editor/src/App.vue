<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import PsdUploader from './components/PsdUploader.vue';
import FabricCanvas from './components/FabricCanvas.vue';

// 响应式数据
const parsedLayers = ref(null);
const selectedObject = ref(null);
const canvasWidth = ref(800);
const canvasHeight = ref(600);
const showInfo = ref(false);
const isLoading = ref(false);
const loadingMessage = ref('');
const loadingProgress = ref('');
const errorMessage = ref('');
const fabricCanvas = ref(null);

// 计算属性
const hasLayers = computed(() => {
  return parsedLayers.value && parsedLayers.value.length > 0;
});

/**
 * 组件挂载后的初始化
 */
onMounted(() => {
  console.log('PSD海报编辑器已启动');
  
  // 监听窗口大小变化，自适应画布
  window.addEventListener('resize', handleWindowResize);
  
  // 初始化画布尺寸
  handleWindowResize();
});

/**
 * 处理PSD解析完成
 * @param {Object} result - 解析结果
 */
function handleParsedData(result) {
  try {
    console.log('PSD解析完成:', result);
    
    // 保存解析结果
    parsedLayers.value = result.layers;
    
    // 设置画布尺寸
    if (result.canvasWidth && result.canvasHeight) {
      canvasWidth.value = result.canvasWidth;
      canvasHeight.value = result.canvasHeight;
    }
    
    // 显示成功消息
    showSuccessMessage(`成功解析 ${result.layers.length} 个图层`);
    
  } catch (error) {
    console.error('处理解析数据失败:', error);
    handleUploadError(error);
  }
}

/**
 * 处理上传错误
 * @param {Error} error - 错误对象
 */
function handleUploadError(error) {
  console.error('上传错误:', error);
  errorMessage.value = error.message || '上传失败，请重试';
  
  // 3秒后自动清除错误
  setTimeout(clearError, 3000);
}

/**
 * 处理上传进度
 * @param {Object} progress - 进度信息
 */
function handleUploadProgress(progress) {
  isLoading.value = progress.percentage < 100;
  loadingMessage.value = progress.message;
  loadingProgress.value = `${progress.percentage}%`;
  
  if (progress.percentage >= 100) {
    setTimeout(() => {
      isLoading.value = false;
    }, 500);
  }
}

/**
 * 处理对象选择
 * @param {Object} object - 选中的对象
 */
function handleObjectSelected(object) {
  selectedObject.value = object;
  console.log('对象已选中:', object);
}

/**
 * 处理对象修改
 * @param {Object} object - 修改的对象
 */
function handleObjectModified(object) {
  console.log('对象已修改:', object);
  // 这里可以添加自动保存功能
}

/**
 * 处理画布变化
 */
function handleCanvasChanged() {
  console.log('画布已变化');
  // 这里可以添加变更追踪功能
}

/**
 * 重置应用
 */
function resetApp() {
  if (confirm('确定要重新开始吗？当前的编辑内容将丢失。')) {
    parsedLayers.value = null;
    selectedObject.value = null;
    clearError();
    
    // 清空画布
    if (fabricCanvas.value) {
      fabricCanvas.value.clearCanvas();
    }
    
    console.log('应用已重置');
  }
}

/**
 * 切换信息面板
 */
function toggleInfo() {
  showInfo.value = !showInfo.value;
}

/**
 * 清除错误信息
 */
function clearError() {
  errorMessage.value = '';
}

/**
 * 显示成功消息
 * @param {string} message - 成功消息
 */
function showSuccessMessage(message) {
  // 可以实现一个成功提示组件
  console.log('成功:', message);
}

/**
 * 处理窗口大小变化
 */
function handleWindowResize() {
  // 根据窗口大小自适应画布尺寸
  const maxWidth = Math.min(window.innerWidth - 100, 1000);
  const maxHeight = Math.min(window.innerHeight - 200, 700);
  
  // 保持比例的同时适应窗口
  if (parsedLayers.value) {
    const aspectRatio = canvasWidth.value / canvasHeight.value;
    if (maxWidth / maxHeight > aspectRatio) {
      canvasHeight.value = maxHeight;
      canvasWidth.value = maxHeight * aspectRatio;
    } else {
      canvasWidth.value = maxWidth;
      canvasHeight.value = maxWidth / aspectRatio;
    }
  }
}

// 清理事件监听器
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize);
});
</script>

<template>
  <div id="app">
    <!-- 应用头部 -->
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">
          <span class="title-icon">🎨</span>
          PSD海报编辑器
        </h1>
        <div class="header-actions">
          <button 
            v-if="parsedLayers" 
            class="header-btn"
            @click="resetApp"
          >
            🔄 重新开始
          </button>
          <button 
            class="header-btn"
            @click="toggleInfo"
          >
            ℹ️ 帮助
          </button>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="app-main">
      <!-- PSD上传阶段 -->
      <div v-if="!parsedLayers" class="upload-stage">
        <div class="stage-content">
          <div class="welcome-section">
            <h2>欢迎使用PSD海报编辑器</h2>
            <p>上传您的PSD文件，即可开始编辑海报设计</p>
            <div class="feature-list">
              <div class="feature-item">
                <span class="feature-icon">📁</span>
                <span>支持PSD文件解析</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🎯</span>
                <span>保持图层结构</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">✏️</span>
                <span>可视化编辑</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">💾</span>
                <span>多格式导出</span>
              </div>
            </div>
          </div>
          
          <PsdUploader 
            @parsed="handleParsedData"
            @error="handleUploadError"
            @progress="handleUploadProgress"
            :maxFileSize="100 * 1024 * 1024"
          />
        </div>
      </div>

      <!-- 编辑阶段 -->
      <div v-else class="edit-stage">
        <FabricCanvas
          ref="fabricCanvas"
          :objects="parsedLayers"
          :canvas-width="canvasWidth"
          :canvas-height="canvasHeight"
          @object-selected="handleObjectSelected"
          @object-modified="handleObjectModified"
          @canvas-changed="handleCanvasChanged"
        />
      </div>
    </main>

    <!-- 信息面板 -->
    <div v-if="showInfo" class="info-panel" @click="showInfo = false">
      <div class="info-content" @click.stop>
        <div class="info-header">
          <h3>使用说明</h3>
          <button class="close-btn" @click="showInfo = false">✕</button>
        </div>
        <div class="info-body">
          <div class="step-list">
            <div class="step-item">
              <span class="step-number">1</span>
              <div class="step-content">
                <h4>上传PSD文件</h4>
                <p>点击或拖拽PSD文件到上传区域，支持最大100MB的文件</p>
              </div>
            </div>
            <div class="step-item">
              <span class="step-number">2</span>
              <div class="step-content">
                <h4>自动解析</h4>
                <p>系统会自动解析PSD图层，提取图像和文本内容</p>
              </div>
            </div>
            <div class="step-item">
              <span class="step-number">3</span>
              <div class="step-content">
                <h4>可视化编辑</h4>
                <p>在画布上直接编辑文本、移动图层、调整样式</p>
              </div>
            </div>
            <div class="step-item">
              <span class="step-number">4</span>
              <div class="step-content">
                <h4>导出作品</h4>
                <p>将编辑结果导出为PNG图片或JSON数据</p>
              </div>
            </div>
          </div>
          
          <div class="feature-details">
            <h4>功能特性</h4>
            <ul>
              <li>支持图层层级结构保持</li>
              <li>文本内容实时编辑</li>
              <li>图层可见性控制</li>
              <li>拖拽移动和缩放</li>
              <li>字体样式调整</li>
              <li>高质量图片导出</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <h3>{{ loadingMessage }}</h3>
        <p>{{ loadingProgress }}</p>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-toast" @click="clearError">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{{ errorMessage }}</span>
        <button class="error-close">✕</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #2c3e50;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 28px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-btn {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-btn:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
  transform: translateY(-1px);
}

.app-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.upload-stage {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.stage-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.welcome-section {
  text-align: center;
  margin-bottom: 40px;
}

.welcome-section h2 {
  margin: 0 0 12px 0;
  font-size: 32px;
  font-weight: 700;
  color: #2d3748;
}

.welcome-section p {
  margin: 0 0 32px 0;
  font-size: 18px;
  color: #4a5568;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 32px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f7fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.feature-icon {
  font-size: 24px;
}

.edit-stage {
  width: 100%;
  height: calc(100vh - 120px);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.info-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.info-content {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 0 24px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 24px;
}

.info-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f7fafc;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  color: #4a5568;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #edf2f7;
}

.info-body {
  padding: 0 24px 24px 24px;
}

.step-list {
  margin-bottom: 32px;
}

.step-item {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.step-number {
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.step-content p {
  margin: 0;
  color: #4a5568;
  line-height: 1.5;
}

.feature-details h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.feature-details ul {
  margin: 0;
  padding-left: 20px;
  color: #4a5568;
  line-height: 1.6;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-content {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-left-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 24px auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.loading-content p {
  margin: 0;
  color: #4a5568;
}

.error-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #fed7d7;
  border: 1px solid #feb2b2;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  z-index: 1500;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.error-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.error-icon {
  font-size: 20px;
}

.error-text {
  color: #c53030;
  font-weight: 500;
}

.error-close {
  background: none;
  border: none;
  font-size: 16px;
  color: #c53030;
  cursor: pointer;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 12px 16px;
  }
  
  .app-title {
    font-size: 20px;
  }
  
  .app-main {
    padding: 16px;
  }
  
  .stage-content {
    padding: 24px;
  }
  
  .welcome-section h2 {
    font-size: 24px;
  }
  
  .feature-list {
    grid-template-columns: 1fr;
  }
  
  .info-panel {
    padding: 10px;
  }
  
  .info-content {
    max-height: 90vh;
  }
  
  .error-toast {
    right: 10px;
    left: 10px;
  }
}
</style>
