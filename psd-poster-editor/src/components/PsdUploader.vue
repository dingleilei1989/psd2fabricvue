<template>
  <div class="psd-uploader">
    <!-- 上传区域 -->
    <div 
      class="upload-area"
      :class="{ 
        'drag-over': isDragOver, 
        'uploading': isUploading,
        'has-file': selectedFile
      }"
      @click="triggerFileInput"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <!-- 文件输入 -->
      <input
        ref="fileInput"
        type="file"
        accept=".psd,image/vnd.adobe.photoshop"
        @change="handleFileSelect"
        style="display: none;"
      />
      
      <!-- 上传状态显示 -->
      <div class="upload-content">
        <!-- 默认状态 -->
        <div v-if="!selectedFile && !isUploading" class="upload-prompt">
          <div class="upload-icon">📁</div>
          <h3>上传PSD文件</h3>
          <p>点击或拖拽PSD文件到此区域</p>
          <div class="upload-tips">
            <small>支持 .psd 格式文件，最大 50MB</small>
          </div>
        </div>
        
        <!-- 文件选中状态 -->
        <div v-else-if="selectedFile && !isUploading" class="file-info">
          <div class="file-icon">📄</div>
          <div class="file-details">
            <h4>{{ selectedFile.name }}</h4>
            <p>{{ formatFileSize(selectedFile.size) }}</p>
            <div class="file-actions">
              <button class="btn btn-primary" @click="parseFile">
                解析PSD文件
              </button>
              <button class="btn btn-secondary" @click="clearFile">
                重新选择
              </button>
            </div>
          </div>
        </div>
        
        <!-- 解析中状态 -->
        <div v-else-if="isUploading" class="uploading-status">
          <div class="loading-spinner"></div>
          <h4>正在解析PSD文件...</h4>
          <p>{{ uploadProgress }}</p>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 错误信息显示 -->
    <div v-if="errorMessage" class="error-message">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <h4>解析失败</h4>
        <p>{{ errorMessage }}</p>
        <button class="btn btn-secondary" @click="clearError">
          重试
        </button>
      </div>
    </div>
    
    <!-- 解析结果预览 -->
    <div v-if="parseResult && !isUploading" class="parse-result">
      <h4>解析结果</h4>
      <div class="result-info">
        <div class="info-item">
          <span class="label">文档尺寸:</span>
          <span class="value">
            {{ parseResult.documentInfo.width }} × {{ parseResult.documentInfo.height }}px
          </span>
        </div>
        <div class="info-item">
          <span class="label">图层数量:</span>
          <span class="value">{{ parseResult.layers.length }} 个</span>
        </div>
        <div class="info-item">
          <span class="label">缩放比例:</span>
          <span class="value">{{ Math.round(parseResult.scaleFactor * 100) }}%</span>
        </div>
      </div>
      
      <!-- 图层列表预览 -->
      <div class="layers-preview">
        <h5>图层列表:</h5>
        <div class="layer-list">
          <div 
            v-for="(layer, index) in parseResult.layers" 
            :key="index"
            class="layer-item"
          >
            <span class="layer-type-icon">
              {{ layer.layerType === 'text' ? '📝' : '🖼️' }}
            </span>
            <span class="layer-name">{{ layer.name }}</span>
            <span class="layer-type">{{ layer.layerType }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { createPsdParser, validatePsdFile } from '../utils/PsdParser.js';

// Props
const props = defineProps({
  maxFileSize: {
    type: Number,
    default: 50 * 1024 * 1024 // 50MB
  }
});

// Emits
const emit = defineEmits(['parsed', 'error', 'progress']);

// 响应式数据
const fileInput = ref(null);
const selectedFile = ref(null);
const isUploading = ref(false);
const isDragOver = ref(false);
const errorMessage = ref('');
const parseResult = ref(null);
const uploadProgress = ref('');
const progressPercentage = ref(0);

// 计算属性
const canUpload = computed(() => {
  return selectedFile.value && !isUploading.value;
});

/**
 * 触发文件输入框
 */
function triggerFileInput() {
  if (!isUploading.value) {
    fileInput.value?.click();
  }
}

/**
 * 处理文件选择
 * @param {Event} event - 文件选择事件
 */
function handleFileSelect(event) {
  const files = event.target.files;
  if (files && files.length > 0) {
    handleFileSelection(files[0]);
  }
}

/**
 * 处理拖拽放置
 * @param {DragEvent} event - 拖拽事件
 */
function handleDrop(event) {
  event.preventDefault();
  isDragOver.value = false;
  
  const files = event.dataTransfer.files;
  if (files && files.length > 0) {
    handleFileSelection(files[0]);
  }
}

/**
 * 处理拖拽悬停
 * @param {DragEvent} event - 拖拽事件
 */
function handleDragOver(event) {
  event.preventDefault();
  isDragOver.value = true;
}

/**
 * 处理拖拽离开
 */
function handleDragLeave() {
  isDragOver.value = false;
}

/**
 * 处理文件选择逻辑
 * @param {File} file - 选择的文件
 */
function handleFileSelection(file) {
  // 清除之前的状态
  clearError();
  clearResult();
  
  // 验证文件
  if (!validateFile(file)) {
    return;
  }
  
  selectedFile.value = file;
}

/**
 * 验证文件
 * @param {File} file - 要验证的文件
 * @returns {boolean} 验证结果
 */
function validateFile(file) {
  // 检查文件类型
  if (!validatePsdFile(file)) {
    showError('请选择有效的PSD文件');
    return false;
  }
  
  // 检查文件大小
  if (file.size > props.maxFileSize) {
    showError(`文件大小超过限制 (${formatFileSize(props.maxFileSize)})`);
    return false;
  }
  
  return true;
}

/**
 * 解析PSD文件
 */
async function parseFile() {
  if (!selectedFile.value || isUploading.value) {
    return;
  }
  
  isUploading.value = true;
  errorMessage.value = '';
  progressPercentage.value = 0;
  
  try {
    // 创建解析器实例
    const parser = createPsdParser();
    
    // 设置画布尺寸（可以从外部配置）
    parser.setCanvasSize(800, 600);
    
    // 模拟进度更新
    updateProgress('正在读取文件...', 10);
    
    // 开始解析
    updateProgress('正在解析PSD结构...', 30);
    const result = await parser.parsePsdFile(selectedFile.value);
    
    updateProgress('正在处理图层...', 60);
    
    // 模拟图层处理进度
    await new Promise(resolve => setTimeout(resolve, 500));
    updateProgress('正在生成预览...', 80);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    updateProgress('解析完成!', 100);
    
    // 保存解析结果
    parseResult.value = result;
    
    // 发出解析完成事件
    emit('parsed', result);
    
  } catch (error) {
    console.error('PSD解析失败:', error);
    showError(error.message || '解析失败，请检查文件是否有效');
    emit('error', error);
  } finally {
    isUploading.value = false;
  }
}

/**
 * 更新进度
 * @param {string} message - 进度消息
 * @param {number} percentage - 进度百分比
 */
function updateProgress(message, percentage) {
  uploadProgress.value = message;
  progressPercentage.value = percentage;
  emit('progress', { message, percentage });
}

/**
 * 显示错误信息
 * @param {string} message - 错误消息
 */
function showError(message) {
  errorMessage.value = message;
}

/**
 * 清除错误信息
 */
function clearError() {
  errorMessage.value = '';
}

/**
 * 清除文件选择
 */
function clearFile() {
  selectedFile.value = null;
  clearError();
  clearResult();
  
  // 重置文件输入框
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

/**
 * 清除解析结果
 */
function clearResult() {
  parseResult.value = null;
  progressPercentage.value = 0;
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 暴露方法给父组件
defineExpose({
  clearFile,
  clearError,
  parseFile,
  triggerFileInput
});
</script>

<style scoped>
.psd-uploader {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.upload-area.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: scale(1.02);
}

.upload-area.uploading {
  cursor: not-allowed;
  opacity: 0.8;
}

.upload-area.has-file {
  border-color: #10b981;
  background: #f0fdf4;
}

.upload-content {
  width: 100%;
}

.upload-prompt .upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-prompt h3 {
  margin: 0 0 8px 0;
  color: #374151;
  font-size: 20px;
  font-weight: 600;
}

.upload-prompt p {
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 16px;
}

.upload-tips {
  color: #9ca3af;
  font-size: 14px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: left;
}

.file-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.file-details h4 {
  margin: 0 0 4px 0;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
}

.file-details p {
  margin: 0 0 12px 0;
  color: #6b7280;
  font-size: 14px;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.uploading-status {
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-left-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.uploading-status h4 {
  margin: 0 0 8px 0;
  color: #374151;
  font-size: 18px;
  font-weight: 600;
}

.uploading-status p {
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 14px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  transition: width 0.3s ease;
}

.error-message {
  margin-top: 20px;
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.error-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.error-content h4 {
  margin: 0 0 4px 0;
  color: #dc2626;
  font-size: 16px;
  font-weight: 600;
}

.error-content p {
  margin: 0 0 12px 0;
  color: #991b1b;
  font-size: 14px;
}

.parse-result {
  margin-top: 20px;
  padding: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.parse-result h4 {
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 18px;
  font-weight: 600;
}

.result-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.info-item .label {
  font-weight: 500;
  color: #6b7280;
}

.info-item .value {
  font-weight: 600;
  color: #374151;
}

.layers-preview h5 {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
}

.layer-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.layer-item:last-child {
  border-bottom: none;
}

.layer-type-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.layer-name {
  flex: 1;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.layer-type {
  font-size: 12px;
  color: #6b7280;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 12px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .upload-area {
    padding: 30px 15px;
    min-height: 160px;
  }
  
  .file-info {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .file-actions {
    justify-content: center;
  }
  
  .result-info {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    flex-direction: column;
    gap: 4px;
  }
}
</style>