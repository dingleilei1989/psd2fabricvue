<template>
  <div class="editor-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-section">
        <h3>文件操作</h3>
        <input
          ref="psdFileInput"
          type="file"
          accept=".psd"
          @change="handlePsdUpload"
          class="file-input"
        />
        <button class="btn" @click="$refs.psdFileInput.click()">
          导入PSD文件
        </button>
        <button class="btn" @click="exportCanvas" :disabled="!canvas">
          导出图片
        </button>
        <button class="btn" @click="clearCanvas" :disabled="!canvas">
          清除画布
        </button>
        <button class="btn" @click="createSamplePoster" :disabled="!canvas">
          创建示例海报
        </button>
      </div>

      <div class="toolbar-section">
        <h3>文字工具</h3>
        <div class="form-group">
          <label>文字内容</label>
          <input
            v-model="textOptions.text"
            type="text"
            placeholder="输入文字内容"
          />
        </div>
        <div class="form-group">
          <label>字体大小</label>
          <input
            v-model.number="textOptions.fontSize"
            type="number"
            min="10"
            max="200"
          />
        </div>
        <div class="form-group">
          <label>字体颜色</label>
          <input
            v-model="textOptions.fill"
            type="color"
            class="color-picker"
          />
        </div>
        <div class="form-group">
          <label>字体家族</label>
          <select v-model="textOptions.fontFamily" class="form-group input">
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
        </div>
        <button class="btn" @click="addText" :disabled="!canvas || !textOptions.text">
          添加文字
        </button>
      </div>

      <div class="toolbar-section">
        <h3>形状工具</h3>
        <button class="btn" @click="addRectangle" :disabled="!canvas">
          添加矩形
        </button>
        <button class="btn" @click="addCircle" :disabled="!canvas">
          添加圆形
        </button>
        <div class="form-group">
          <label>形状颜色</label>
          <input
            v-model="shapeColor"
            type="color"
            class="color-picker"
          />
        </div>
      </div>

      <div class="toolbar-section">
        <h3>对象操作</h3>
        <button class="btn" @click="deleteSelected" :disabled="!canvas">
          删除选中对象
        </button>
        <button class="btn" @click="bringToFront" :disabled="!canvas">
          置于顶层
        </button>
        <button class="btn" @click="sendToBack" :disabled="!canvas">
          置于底层
        </button>
        <button class="btn" @click="duplicateSelected" :disabled="!canvas">
          复制选中对象
        </button>
      </div>

      <div class="toolbar-section">
        <h3>快捷键</h3>
        <div class="shortcut-list">
          <div class="shortcut-item">
            <span>Delete/Backspace</span>
            <span>删除对象</span>
          </div>
          <div class="shortcut-item">
            <span>Ctrl+D</span>
            <span>复制对象</span>
          </div>
          <div class="shortcut-item">
            <span>Ctrl+S</span>
            <span>导出图片</span>
          </div>
          <div class="shortcut-item">
            <span>Escape</span>
            <span>取消选择</span>
          </div>
        </div>
      </div>

      <div class="toolbar-section" v-if="psdInfo || errorMessage">
        <h3>PSD 信息</h3>
        <PsdViewer 
          :psd-info="psdInfo" 
          :layer-count="psdLayers.length"
          :error="errorMessage"
        />
      </div>

      <div class="toolbar-section" v-if="psdLayers.length > 0">
        <h3>PSD图层</h3>
        <div v-for="(layer, index) in psdLayers" :key="index" class="layer-item">
          <label>{{ layer.name || `图层 ${index + 1}` }}</label>
          <button class="btn" @click="addLayerToCanvas(layer)">
            添加到画布
          </button>
        </div>
      </div>
    </div>

    <!-- 画布区域 -->
    <div class="canvas-area">
      <div class="canvas-wrapper">
        <canvas ref="fabricCanvas" width="800" height="600"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, reactive } from 'vue'
import { fabric } from 'fabric'
import { readPsd } from 'ag-psd'
import PsdViewer from './components/PsdViewer.vue'

export default {
  name: 'App',
  components: {
    PsdViewer
  },
  setup() {
    const canvas = ref(null)
    const fabricCanvas = ref(null)
    const psdFileInput = ref(null)
    const psdLayers = ref([])
    const psdInfo = ref(null)
    const errorMessage = ref('')
    const shapeColor = ref('#3498db')

    const textOptions = reactive({
      text: '示例文字',
      fontSize: 30,
      fill: '#000000',
      fontFamily: 'Arial'
    })

    // 初始化Fabric.js画布
    const initCanvas = () => {
      canvas.value = new fabric.Canvas(fabricCanvas.value, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff'
      })

      // 添加画布事件监听
      canvas.value.on('selection:created', () => {
        console.log('对象被选中')
      })

      canvas.value.on('selection:cleared', () => {
        console.log('取消选择')
      })
    }

    // 处理PSD文件上传
    const handlePsdUpload = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      // 清除之前的错误信息
      errorMessage.value = ''
      psdInfo.value = null
      psdLayers.value = []

      try {
        const arrayBuffer = await file.arrayBuffer()
        const psd = readPsd(arrayBuffer)
        
        console.log('PSD文件解析成功:', psd)
        
        // 设置PSD信息
        psdInfo.value = {
          width: psd.width,
          height: psd.height,
          colorMode: psd.colorMode || 'RGB',
          bitDepth: psd.bitDepth || 8
        }
        
        // 提取图层信息
        if (psd.children) {
          psdLayers.value = extractLayers(psd.children)
        }

        // 如果有主画布图像，设置为背景
        if (psd.canvas) {
          const dataUrl = canvasToDataUrl(psd.canvas)
          fabric.Image.fromURL(dataUrl, (img) => {
            img.set({
              left: 0,
              top: 0,
              selectable: false
            })
            canvas.value.setBackgroundImage(img, canvas.value.renderAll.bind(canvas.value))
          })
        }

      } catch (error) {
        console.error('PSD文件解析失败:', error)
        errorMessage.value = `PSD文件解析失败: ${error.message}`
      }
    }

    // 提取PSD图层
    const extractLayers = (children) => {
      const layers = []
      
      children.forEach((child, index) => {
        if (child.canvas) {
          layers.push({
            name: child.name || `图层 ${index + 1}`,
            canvas: child.canvas,
            visible: child.visible !== false,
            opacity: child.opacity || 1,
            left: child.left || 0,
            top: child.top || 0
          })
        }
        
        // 递归处理子图层
        if (child.children) {
          layers.push(...extractLayers(child.children))
        }
      })
      
      return layers
    }

    // Canvas转DataURL
    const canvasToDataUrl = (canvasElement) => {
      return canvasElement.toDataURL('image/png')
    }

    // 添加图层到Fabric画布
    const addLayerToCanvas = (layer) => {
      if (!layer.canvas) return

      const dataUrl = canvasToDataUrl(layer.canvas)
      fabric.Image.fromURL(dataUrl, (img) => {
        img.set({
          left: layer.left,
          top: layer.top,
          opacity: layer.opacity
        })
        canvas.value.add(img)
        canvas.value.renderAll()
      })
    }

    // 添加文字
    const addText = () => {
      if (!canvas.value || !textOptions.text) return

      const text = new fabric.Text(textOptions.text, {
        left: 100,
        top: 100,
        fontSize: textOptions.fontSize,
        fill: textOptions.fill,
        fontFamily: textOptions.fontFamily
      })

      canvas.value.add(text)
      canvas.value.setActiveObject(text)
      canvas.value.renderAll()
    }

    // 删除选中对象
    const deleteSelected = () => {
      if (!canvas.value) return
      
      const activeObjects = canvas.value.getActiveObjects()
      activeObjects.forEach(obj => {
        canvas.value.remove(obj)
      })
      canvas.value.discardActiveObject()
      canvas.value.renderAll()
    }

    // 置于顶层
    const bringToFront = () => {
      if (!canvas.value) return
      
      const activeObject = canvas.value.getActiveObject()
      if (activeObject) {
        canvas.value.bringToFront(activeObject)
        canvas.value.renderAll()
      }
    }

    // 置于底层
    const sendToBack = () => {
      if (!canvas.value) return
      
      const activeObject = canvas.value.getActiveObject()
      if (activeObject) {
        canvas.value.sendToBack(activeObject)
        canvas.value.renderAll()
      }
    }

    // 导出画布
    const exportCanvas = () => {
      if (!canvas.value) return

      const dataURL = canvas.value.toDataURL({
        format: 'png',
        quality: 1.0
      })

      const link = document.createElement('a')
      link.download = 'poster.png'
      link.href = dataURL
      link.click()
    }

    // 清除画布
    const clearCanvas = () => {
      if (!canvas.value) return
      
      canvas.value.clear()
      canvas.value.setBackgroundColor('#ffffff', canvas.value.renderAll.bind(canvas.value))
    }

    // 添加矩形
    const addRectangle = () => {
      if (!canvas.value) return

      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 80,
        fill: shapeColor.value,
        stroke: '#333',
        strokeWidth: 2
      })

      canvas.value.add(rect)
      canvas.value.setActiveObject(rect)
      canvas.value.renderAll()
    }

    // 添加圆形
    const addCircle = () => {
      if (!canvas.value) return

      const circle = new fabric.Circle({
        left: 150,
        top: 150,
        radius: 50,
        fill: shapeColor.value,
        stroke: '#333',
        strokeWidth: 2
      })

      canvas.value.add(circle)
      canvas.value.setActiveObject(circle)
      canvas.value.renderAll()
    }

    // 复制选中对象
    const duplicateSelected = () => {
      if (!canvas.value) return

      const activeObject = canvas.value.getActiveObject()
      if (activeObject) {
        activeObject.clone((cloned) => {
          cloned.set({
            left: activeObject.left + 20,
            top: activeObject.top + 20
          })
          canvas.value.add(cloned)
          canvas.value.setActiveObject(cloned)
          canvas.value.renderAll()
        })
      }
    }

    // 创建示例海报
    const createSamplePoster = () => {
      if (!canvas.value) return

      // 清除画布
      canvas.value.clear()

      // 添加背景色
      canvas.value.setBackgroundColor('#f39c12', canvas.value.renderAll.bind(canvas.value))

      // 添加标题文字
      const title = new fabric.Text('示例海报', {
        left: 200,
        top: 50,
        fontSize: 48,
        fill: '#ffffff',
        fontFamily: 'Arial',
        fontWeight: 'bold',
        shadow: 'rgba(0,0,0,0.3) 2px 2px 4px'
      })

      // 添加副标题
      const subtitle = new fabric.Text('使用 Vue3 + Fabric.js + ag-psd 制作', {
        left: 120,
        top: 120,
        fontSize: 20,
        fill: '#2c3e50',
        fontFamily: 'Arial'
      })

      // 添加装饰矩形
      const rect1 = new fabric.Rect({
        left: 50,
        top: 200,
        width: 200,
        height: 150,
        fill: '#3498db',
        opacity: 0.8,
        rx: 10,
        ry: 10
      })

      // 添加装饰圆形
      const circle = new fabric.Circle({
        left: 500,
        top: 300,
        radius: 80,
        fill: '#e74c3c',
        opacity: 0.7
      })

      // 添加描述文字
      const description = new fabric.Text('支持 PSD 导入\n文字编辑\n形状工具\n图层管理', {
        left: 300,
        top: 400,
        fontSize: 18,
        fill: '#2c3e50',
        fontFamily: 'Arial',
        lineHeight: 1.5
      })

      // 添加所有元素到画布
      canvas.value.add(title)
      canvas.value.add(subtitle)
      canvas.value.add(rect1)
      canvas.value.add(circle)
      canvas.value.add(description)

      canvas.value.renderAll()
    }

    // 键盘事件处理
    const handleKeyboard = (event) => {
      if (!canvas.value) return

      // 删除选中对象
      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelected()
        event.preventDefault()
      }

      // Ctrl+D 复制
      if (event.ctrlKey && event.key === 'd') {
        duplicateSelected()
        event.preventDefault()
      }

      // Ctrl+S 导出
      if (event.ctrlKey && event.key === 's') {
        exportCanvas()
        event.preventDefault()
      }

      // Escape 取消选择
      if (event.key === 'Escape') {
        canvas.value.discardActiveObject()
        canvas.value.renderAll()
      }
    }

    onMounted(() => {
      initCanvas()
      
      // 添加键盘事件监听
      document.addEventListener('keydown', handleKeyboard)
    })

    return {
      canvas,
      fabricCanvas,
      psdFileInput,
      psdLayers,
      psdInfo,
      errorMessage,
      shapeColor,
      textOptions,
      handlePsdUpload,
      addText,
      deleteSelected,
      bringToFront,
      sendToBack,
      exportCanvas,
      clearCanvas,
      addLayerToCanvas,
      addRectangle,
      addCircle,
      duplicateSelected,
      createSamplePoster
    }
  }
}
</script>

<style scoped>
.layer-item {
  margin-bottom: 10px;
  padding: 10px;
  background: #34495e;
  border-radius: 3px;
}

.layer-item label {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
}

select {
  width: 100%;
  padding: 8px;
  border: 1px solid #34495e;
  border-radius: 3px;
  background: #34495e;
  color: white;
}

select:focus {
  outline: none;
  border-color: #3498db;
}

.shortcut-list {
  font-size: 11px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 6px 8px;
  background: #34495e;
  border-radius: 3px;
}

.shortcut-item span:first-child {
  color: #f39c12;
  font-weight: bold;
}

.shortcut-item span:last-child {
  color: #bdc3c7;
}
</style>