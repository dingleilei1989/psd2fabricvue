<template>
  <div class="fabric-preview">
    <div class="preview-header">
      <h2>Fabric.js 画布预览</h2>
      <div class="controls">
        <button @click="fitToCanvas" class="btn btn-secondary">
          适应画布
        </button>
        <button @click="resetZoom" class="btn btn-secondary">
          重置缩放
        </button>
        <button @click="toggleGrid" class="btn btn-secondary">
          {{ showGrid ? '隐藏' : '显示' }}网格
        </button>
        <button @click="exportJson" class="btn btn-primary">
          导出JSON
        </button>
      </div>
    </div>
    
    <div class="canvas-container" ref="canvasContainer">
      <canvas 
        ref="fabricCanvas" 
        :class="{ 'show-grid': showGrid }"
      ></canvas>
    </div>
    
    <div class="info-panel">
      <div class="info-section">
        <h3>画布信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>尺寸:</label>
            <span>{{ canvasWidth }} × {{ canvasHeight }} px</span>
          </div>
          <div class="info-item">
            <label>对象数量:</label>
            <span>{{ objectCount }}</span>
          </div>
          <div class="info-item">
            <label>缩放比例:</label>
            <span>{{ Math.round(zoomLevel * 100) }}%</span>
          </div>
        </div>
      </div>
      
      <div class="info-section">
        <h3>图层列表</h3>
        <div class="layer-list">
          <div 
            v-for="(obj, index) in fabricObjects" 
            :key="index"
            class="layer-item"
            :class="{ active: selectedObjectIndex === index }"
            @click="selectObject(index)"
          >
            <div class="layer-info">
              <span class="layer-type">{{ getObjectType(obj) }}</span>
              <span class="layer-position">
                {{ Math.round(obj.left || 0) }}, {{ Math.round(obj.top || 0) }}
              </span>
            </div>
            <div class="layer-controls">
              <button 
                @click.stop="toggleObjectVisibility(index)"
                class="visibility-btn"
                :class="{ hidden: !obj.visible }"
              >
                {{ obj.visible ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { fabric } from 'fabric'

interface Props {
  fabricJson: any
  canvasWidth: number
  canvasHeight: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  export: [json: any]
}>()

const fabricCanvas = ref<HTMLCanvasElement>()
const canvasContainer = ref<HTMLDivElement>()
const canvas = ref<fabric.Canvas>()
const showGrid = ref(false)
const zoomLevel = ref(1)
const objectCount = ref(0)
const fabricObjects = ref<any[]>([])
const selectedObjectIndex = ref(-1)

onMounted(async () => {
  await nextTick()
  initCanvas()
})

watch(() => props.fabricJson, () => {
  if (props.fabricJson && canvas.value) {
    loadFabricJson()
  }
}, { deep: true })

const initCanvas = () => {
  if (!fabricCanvas.value) return
  
  canvas.value = new fabric.Canvas(fabricCanvas.value, {
    width: Math.min(props.canvasWidth, 800),
    height: Math.min(props.canvasHeight, 600),
    backgroundColor: '#ffffff',
    preserveObjectStacking: true
  })
  
  // 添加事件监听
  canvas.value.on('selection:created', handleSelection)
  canvas.value.on('selection:updated', handleSelection)
  canvas.value.on('selection:cleared', () => {
    selectedObjectIndex.value = -1
  })
  
  canvas.value.on('mouse:wheel', handleMouseWheel)
  
  if (props.fabricJson) {
    loadFabricJson()
  }
}

const handleSelection = (e: any) => {
  const activeObject = e.selected[0]
  if (activeObject) {
    const index = canvas.value?.getObjects().indexOf(activeObject)
    if (index !== undefined && index >= 0) {
      selectedObjectIndex.value = index
    }
  }
}

const handleMouseWheel = (opt: any) => {
  const delta = opt.e.deltaY
  let zoom = canvas.value!.getZoom()
  zoom *= 0.999 ** delta
  
  if (zoom > 20) zoom = 20
  if (zoom < 0.01) zoom = 0.01
  
  canvas.value!.zoomToPoint(
    { x: opt.e.offsetX, y: opt.e.offsetY }, 
    zoom
  )
  
  zoomLevel.value = zoom
  opt.e.preventDefault()
  opt.e.stopPropagation()
}

const loadFabricJson = () => {
  if (!canvas.value || !props.fabricJson) return
  
  canvas.value.loadFromJSON(props.fabricJson, () => {
    canvas.value!.renderAll()
    updateObjectsList()
    fitToCanvas()
  })
}

const updateObjectsList = () => {
  if (!canvas.value) return
  
  const objects = canvas.value.getObjects()
  fabricObjects.value = objects.map(obj => ({
    type: obj.type,
    left: obj.left,
    top: obj.top,
    width: obj.width,
    height: obj.height,
    visible: obj.visible !== false,
    opacity: obj.opacity
  }))
  
  objectCount.value = objects.length
}

const fitToCanvas = () => {
  if (!canvas.value || !canvasContainer.value) return
  
  const containerWidth = canvasContainer.value.clientWidth - 40
  const containerHeight = canvasContainer.value.clientHeight - 40
  
  const scaleX = containerWidth / props.canvasWidth
  const scaleY = containerHeight / props.canvasHeight
  const scale = Math.min(scaleX, scaleY, 1)
  
  canvas.value.setZoom(scale)
  canvas.value.setWidth(props.canvasWidth * scale)
  canvas.value.setHeight(props.canvasHeight * scale)
  
  zoomLevel.value = scale
  canvas.value.renderAll()
}

const resetZoom = () => {
  if (!canvas.value) return
  
  canvas.value.setZoom(1)
  canvas.value.setWidth(props.canvasWidth)
  canvas.value.setHeight(props.canvasHeight)
  
  zoomLevel.value = 1
  canvas.value.renderAll()
}

const toggleGrid = () => {
  showGrid.value = !showGrid.value
}

const selectObject = (index: number) => {
  if (!canvas.value) return
  
  const objects = canvas.value.getObjects()
  if (objects[index]) {
    canvas.value.setActiveObject(objects[index])
    canvas.value.renderAll()
    selectedObjectIndex.value = index
  }
}

const toggleObjectVisibility = (index: number) => {
  if (!canvas.value) return
  
  const objects = canvas.value.getObjects()
  if (objects[index]) {
    const obj = objects[index]
    obj.visible = !obj.visible
    fabricObjects.value[index].visible = obj.visible
    canvas.value.renderAll()
  }
}

const getObjectType = (obj: any): string => {
  const typeMap: { [key: string]: string } = {
    'image': '图像',
    'text': '文本',
    'rect': '矩形',
    'circle': '圆形',
    'path': '路径',
    'group': '组合'
  }
  return typeMap[obj.type] || obj.type
}

const exportJson = () => {
  if (!canvas.value) return
  
  const json = canvas.value.toJSON()
  emit('export', json)
}
</script>

<style scoped>
.fabric-preview {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.preview-header h2 {
  color: #333;
  font-size: 1.5rem;
  margin: 0;
}

.controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.canvas-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: auto;
  padding: 20px;
  margin-bottom: 1.5rem;
}

.canvas-container canvas {
  border: 1px solid #d1d5db;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.canvas-container canvas.show-grid {
  background-image: 
    linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px);
  background-size: 20px 20px;
}

.info-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .info-panel {
    grid-template-columns: 1fr;
  }
}

.info-section {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.info-section h3 {
  color: #374151;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.info-grid {
  display: grid;
  gap: 0.5rem;
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

.layer-list {
  max-height: 300px;
  overflow-y: auto;
}

.layer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-bottom: 0.25rem;
}

.layer-item:hover {
  background: #e5e7eb;
}

.layer-item.active {
  background: #dbeafe;
  border: 1px solid #3b82f6;
}

.layer-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.layer-type {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.layer-position {
  color: #6b7280;
  font-size: 0.8rem;
}

.layer-controls {
  display: flex;
  gap: 0.25rem;
}

.visibility-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.visibility-btn:hover {
  background: rgba(0,0,0,0.1);
}

.visibility-btn.hidden {
  opacity: 0.5;
}
</style>