<template>
  <div class="fabric-canvas-container">
    <el-card>
      <template #header>
        <div class="canvas-header">
          <span>Fabric.js 预览画布</span>
          <div class="canvas-controls">
            <el-button size="small" @click="resetZoom">
              <el-icon><refresh /></el-icon>
              重置缩放
            </el-button>
            <el-button size="small" @click="fitToScreen">
              <el-icon><full-screen /></el-icon>
              适应屏幕
            </el-button>
            <el-button size="small" type="primary" @click="exportCanvas">
              <el-icon><download /></el-icon>
              导出画布
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="canvas-wrapper" ref="canvasWrapper">
        <div class="canvas-info" v-if="canvasData">
          <el-tag size="small">
            尺寸: {{ canvasSize.width }} × {{ canvasSize.height }}px
          </el-tag>
          <el-tag size="small" type="info">
            缩放: {{ Math.round(zoomLevel * 100) }}%
          </el-tag>
          <el-tag size="small" type="success">
            对象: {{ objectCount }}
          </el-tag>
        </div>
        
        <div class="canvas-container" ref="canvasContainer">
          <canvas ref="fabricCanvas" :id="canvasId"></canvas>
        </div>
        
        <div v-if="!canvasData" class="empty-state">
          <el-empty description="请先上传并转换PSD文件">
            <el-icon class="empty-icon"><picture /></el-icon>
          </el-empty>
        </div>
      </div>
    </el-card>
    
    <!-- 导出对话框 -->
    <el-dialog v-model="exportDialogVisible" title="导出设置" width="400px">
      <el-form :model="exportOptions" label-width="80px">
        <el-form-item label="格式">
          <el-select v-model="exportOptions.format" style="width: 100%">
            <el-option label="PNG" value="png" />
            <el-option label="JPEG" value="jpeg" />
            <el-option label="SVG" value="svg" />
            <el-option label="JSON" value="json" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="质量" v-if="exportOptions.format === 'jpeg'">
          <el-slider v-model="exportOptions.quality" :min="0.1" :max="1" :step="0.1" />
        </el-form-item>
        
        <el-form-item label="缩放">
          <el-input-number 
            v-model="exportOptions.multiplier" 
            :min="0.1" 
            :max="5" 
            :step="0.1"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmExport">确认导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { fabric } from 'fabric'

export default {
  name: 'FabricCanvas',
  props: {
    canvasData: {
      type: Object,
      default: null
    }
  },
  emits: ['canvas-ready'],
  data() {
    return {
      canvas: null,
      canvasId: 'fabric-canvas-' + Date.now(),
      zoomLevel: 1,
      canvasSize: { width: 800, height: 600 },
      objectCount: 0,
      layerObjects: new Map(), // 存储图层ID到Fabric对象的映射
      exportDialogVisible: false,
      exportOptions: {
        format: 'png',
        quality: 0.8,
        multiplier: 1
      }
    }
  },
  watch: {
    canvasData: {
      handler(newData) {
        if (newData) {
          this.loadCanvas(newData)
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.initCanvas()
  },
  beforeUnmount() {
    if (this.canvas) {
      this.canvas.dispose()
    }
  },
  methods: {
    initCanvas() {
      this.$nextTick(() => {
        const canvasElement = this.$refs.fabricCanvas
        if (!canvasElement) return
        
        this.canvas = new fabric.Canvas(canvasElement, {
          width: 800,
          height: 600,
          backgroundColor: '#ffffff'
        })
        
        // 添加事件监听
        this.canvas.on('object:selected', this.onObjectSelected)
        this.canvas.on('selection:cleared', this.onSelectionCleared)
        this.canvas.on('object:modified', this.onObjectModified)
        
        // 启用鼠标滚轮缩放
        this.canvas.on('mouse:wheel', this.onMouseWheel)
        
        this.$emit('canvas-ready', this)
      })
    },
    
    async loadCanvas(data) {
      if (!this.canvas || !data) return
      
      try {
        // 清空画布
        this.canvas.clear()
        this.layerObjects.clear()
        
        // 设置画布尺寸
        if (data.canvasSize) {
          this.canvasSize = data.canvasSize
          this.canvas.setDimensions(data.canvasSize)
        }
        
        // 加载Fabric JSON数据
        if (data.fabricJson) {
          await this.loadFromJSON(data.fabricJson)
        }
        
        // 构建图层映射
        this.buildLayerMapping(data.layers)
        
        // 适应屏幕
        this.fitToScreen()
        
      } catch (error) {
        console.error('加载画布失败:', error)
        this.$message.error('加载画布失败: ' + error.message)
      }
    },
    
    loadFromJSON(json) {
      return new Promise((resolve, reject) => {
        this.canvas.loadFromJSON(json, () => {
          this.canvas.renderAll()
          this.objectCount = this.canvas.getObjects().length
          resolve()
        }, (o, object) => {
          // 对象加载回调
          if (object.layerId) {
            this.layerObjects.set(object.layerId, object)
          }
        })
      })
    },
    
    buildLayerMapping(layers) {
      const buildMapping = (layerList) => {
        layerList.forEach(layer => {
          const objects = this.canvas.getObjects().filter(obj => obj.layerId === layer.id)
          objects.forEach(obj => {
            this.layerObjects.set(layer.id, obj)
          })
          
          if (layer.children) {
            buildMapping(layer.children)
          }
        })
      }
      
      if (layers) {
        buildMapping(layers)
      }
    },
    
    // 图层控制方法
    toggleLayer(layerId, visible) {
      const objects = this.canvas.getObjects().filter(obj => obj.layerId === layerId)
      objects.forEach(obj => {
        obj.visible = visible
      })
      this.canvas.renderAll()
    },
    
    selectLayer(layerId) {
      const objects = this.canvas.getObjects().filter(obj => obj.layerId === layerId)
      if (objects.length > 0) {
        this.canvas.setActiveObject(objects[0])
        this.canvas.renderAll()
      }
    },
    
    // 缩放控制
    resetZoom() {
      this.zoomLevel = 1
      this.canvas.setZoom(1)
      this.canvas.absolutePan({ x: 0, y: 0 })
      this.canvas.renderAll()
    },
    
    fitToScreen() {
      const container = this.$refs.canvasContainer
      if (!container) return
      
      const containerWidth = container.clientWidth - 40
      const containerHeight = container.clientHeight - 40
      
      const scaleX = containerWidth / this.canvasSize.width
      const scaleY = containerHeight / this.canvasSize.height
      const scale = Math.min(scaleX, scaleY, 1) // 不放大，只缩小
      
      this.zoomLevel = scale
      this.canvas.setZoom(scale)
      
      // 居中显示
      const offsetX = (containerWidth - this.canvasSize.width * scale) / 2
      const offsetY = (containerHeight - this.canvasSize.height * scale) / 2
      this.canvas.absolutePan({ x: offsetX, y: offsetY })
      
      this.canvas.renderAll()
    },
    
    onMouseWheel(opt) {
      const delta = opt.e.deltaY
      let zoom = this.canvas.getZoom()
      zoom *= 0.999 ** delta
      
      if (zoom > 20) zoom = 20
      if (zoom < 0.01) zoom = 0.01
      
      this.zoomLevel = zoom
      this.canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)
      
      opt.e.preventDefault()
      opt.e.stopPropagation()
    },
    
    // 事件处理
    onObjectSelected(e) {
      const obj = e.target
      if (obj && obj.layerId) {
        console.log('选中图层:', obj.layerId)
      }
    },
    
    onSelectionCleared() {
      console.log('清除选择')
    },
    
    onObjectModified(e) {
      console.log('对象修改:', e.target)
    },
    
    // 导出功能
    exportCanvas() {
      this.exportDialogVisible = true
    },
    
    confirmExport() {
      const { format, quality, multiplier } = this.exportOptions
      
      try {
        let result
        
        switch (format) {
          case 'png':
            result = this.canvas.toDataURL({
              format: 'png',
              multiplier: multiplier
            })
            this.downloadDataURL(result, 'canvas.png')
            break
            
          case 'jpeg':
            result = this.canvas.toDataURL({
              format: 'jpeg',
              quality: quality,
              multiplier: multiplier
            })
            this.downloadDataURL(result, 'canvas.jpg')
            break
            
          case 'svg':
            result = this.canvas.toSVG()
            this.downloadText(result, 'canvas.svg', 'image/svg+xml')
            break
            
          case 'json':
            result = JSON.stringify(this.canvas.toJSON(['layerId']), null, 2)
            this.downloadText(result, 'canvas.json', 'application/json')
            break
        }
        
        this.$message.success('导出成功!')
        this.exportDialogVisible = false
        
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error('导出失败: ' + error.message)
      }
    },
    
    downloadDataURL(dataURL, filename) {
      const link = document.createElement('a')
      link.download = filename
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    
    downloadText(content, filename, mimeType) {
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = filename
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }
}
</script>

<style scoped>
.fabric-canvas-container {
  height: 100%;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.canvas-controls {
  display: flex;
  gap: 8px;
}

.canvas-wrapper {
  height: calc(100vh - 200px);
  position: relative;
}

.canvas-info {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  display: flex;
  gap: 8px;
}

.canvas-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: #f0f0f0;
  background-image: 
    linear-gradient(45deg, #e0e0e0 25%, transparent 25%), 
    linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #e0e0e0 75%), 
    linear-gradient(-45deg, transparent 75%, #e0e0e0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 64px;
  color: #dcdfe6;
  margin-bottom: 16px;
}

:deep(.el-card__body) {
  padding: 20px;
  height: calc(100% - 60px);
}

:deep(canvas) {
  border: 1px solid #dcdfe6;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>