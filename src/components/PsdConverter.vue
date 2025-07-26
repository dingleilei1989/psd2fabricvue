<template>
  <div class="psd-converter">
    <div class="upload-section">
      <h2>上传PSD文件</h2>
      
      <div 
        class="drop-zone"
        :class="{ 'drag-over': isDragOver, 'processing': isProcessing }"
        @drop="handleDrop"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".psd"
          @change="handleFileSelect"
          style="display: none"
        />
        
        <div v-if="!isProcessing" class="drop-content">
          <div class="upload-icon">📁</div>
          <p>点击或拖拽PSD文件到此处</p>
          <p class="file-info">支持 .psd 格式文件</p>
        </div>
        
        <div v-else class="processing-content">
          <div class="spinner"></div>
          <p>正在处理PSD文件...</p>
        </div>
      </div>
      
      <div v-if="selectedFile" class="file-info-display">
        <h3>选中的文件:</h3>
        <p><strong>文件名:</strong> {{ selectedFile.name }}</p>
        <p><strong>大小:</strong> {{ formatFileSize(selectedFile.size) }}</p>
      </div>
    </div>
    
    <div v-if="psdInfo" class="psd-info">
      <h3>PSD信息</h3>
      <div class="info-grid">
        <div class="info-item">
          <label>尺寸:</label>
          <span>{{ psdInfo.width }} × {{ psdInfo.height }} px</span>
        </div>
        <div class="info-item">
          <label>图层数量:</label>
          <span>{{ psdInfo.layerCount }}</span>
        </div>
        <div class="info-item">
          <label>颜色模式:</label>
          <span>{{ psdInfo.colorMode }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PsdToFabricConverter, validatePsdFile, formatFileSize } from '@/utils/psdUtils'

const emit = defineEmits<{
  converted: [data: { json: any; width: number; height: number }]
  error: [message: string]
}>()

const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const isDragOver = ref(false)
const isProcessing = ref(false)
const psdInfo = ref<{
  width: number
  height: number
  layerCount: number
  colorMode: string
} | null>(null)

const converter = new PsdToFabricConverter({
  includeHiddenLayers: false,
  convertTextToImage: true,
  maxImageSize: 2048
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    handleFile(target.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    handleFile(event.dataTransfer.files[0])
  }
}

const handleFile = async (file: File) => {
  const validation = validatePsdFile(file)
  if (!validation.valid) {
    emit('error', validation.error!)
    return
  }
  
  selectedFile.value = file
  isProcessing.value = true
  
  try {
    const result = await converter.convertFile(file)
    
    // 设置PSD信息
    psdInfo.value = {
      width: result.width,
      height: result.height,
      layerCount: result.layerInfo.length,
      colorMode: 'RGB' // 简化处理
    }
    
    emit('converted', {
      json: result.fabricJson,
      width: result.width,
      height: result.height
    })
    
  } catch (error) {
    console.error('PSD处理错误:', error)
    emit('error', '处理PSD文件时出错: ' + (error as Error).message)
  } finally {
    isProcessing.value = false
  }
}


</script>

<style scoped>
.psd-converter {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.upload-section h2 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.drop-zone:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.drop-zone.drag-over {
  border-color: #3b82f6;
  background: #dbeafe;
  transform: scale(1.02);
}

.drop-zone.processing {
  border-color: #10b981;
  background: #ecfdf5;
}

.drop-content .upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.drop-content p {
  margin: 0.5rem 0;
  color: #374151;
}

.drop-content .file-info {
  color: #6b7280;
  font-size: 0.9rem;
}

.processing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.file-info-display {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.file-info-display h3 {
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.file-info-display p {
  margin: 0.25rem 0;
  color: #6b7280;
}

.psd-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
}

.psd-info h3 {
  color: #1e40af;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item label {
  font-weight: 600;
  color: #374151;
}

.info-item span {
  color: #6b7280;
}
</style>