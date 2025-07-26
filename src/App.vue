<template>
  <div class="app">
    <header class="header">
      <h1>PSD to Fabric.js 转换器</h1>
      <p>上传PSD文件并预览转换后的Fabric.js画布</p>
    </header>
    
    <main class="main">
      <PsdConverter 
        @converted="handlePsdConverted"
        @error="handleError"
      />
      
      <FabricPreview 
        v-if="fabricJson"
        :fabric-json="fabricJson"
        :canvas-width="canvasWidth"
        :canvas-height="canvasHeight"
        @export="handleExport"
      />
      
      <div v-if="error" class="error">
        <h3>错误:</h3>
        <p>{{ error }}</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PsdConverter from './components/PsdConverter.vue'
import FabricPreview from './components/FabricPreview.vue'
import { saveAs } from 'file-saver'

const fabricJson = ref<any>(null)
const canvasWidth = ref(800)
const canvasHeight = ref(600)
const error = ref<string>('')

const handlePsdConverted = (data: { json: any; width: number; height: number }) => {
  fabricJson.value = data.json
  canvasWidth.value = data.width
  canvasHeight.value = data.height
  error.value = ''
}

const handleError = (errorMessage: string) => {
  error.value = errorMessage
  fabricJson.value = null
}

const handleExport = (json: any) => {
  const blob = new Blob([JSON.stringify(json, null, 2)], { 
    type: 'application/json' 
  })
  saveAs(blob, 'fabric-canvas.json')
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header h1 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

.header p {
  color: #666;
  font-size: 1.1rem;
}

.main {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.error {
  background: #fee;
  border: 1px solid #fcc;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.error h3 {
  color: #c00;
  margin-bottom: 0.5rem;
}

.error p {
  color: #800;
}
</style>