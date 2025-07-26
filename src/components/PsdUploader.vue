<template>
  <div class="psd-uploader">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>上传PSD文件</span>
        </div>
      </template>
      
      <el-upload
        class="upload-demo"
        drag
        :before-upload="handleBeforeUpload"
        :show-file-list="false"
        accept=".psd"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将PSD文件拖拽到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传.psd文件，文件大小不超过100MB
          </div>
        </template>
      </el-upload>
      
      <el-progress 
        v-if="loading" 
        :percentage="progress" 
        :status="progressStatus"
        style="margin-top: 20px;"
      />
      
      <div v-if="psdInfo" class="psd-info" style="margin-top: 20px;">
        <el-descriptions title="PSD信息" :column="1" border>
          <el-descriptions-item label="文件名">{{ psdInfo.name }}</el-descriptions-item>
          <el-descriptions-item label="尺寸">{{ psdInfo.width }} × {{ psdInfo.height }}px</el-descriptions-item>
          <el-descriptions-item label="图层数量">{{ psdInfo.layerCount }}</el-descriptions-item>
          <el-descriptions-item label="文字图层">{{ psdInfo.textLayerCount }}</el-descriptions-item>
        </el-descriptions>
        
        <el-button 
          type="primary" 
          @click="convertToFabric" 
          :loading="converting"
          style="width: 100%; margin-top: 15px;"
        >
          转换为Fabric.js
        </el-button>
      </div>
      
      <div class="demo-section" style="margin-top: 20px;">
        <el-divider content-position="center">或者使用演示数据</el-divider>
        <el-button 
          @click="loadDemoData"
          style="width: 100%; margin-bottom: 10px;"
        >
          加载简单演示
        </el-button>
        <el-button 
          @click="loadComplexDemoData"
          style="width: 100%;"
        >
          加载复杂演示
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { readPsd } from 'ag-psd'
import { PsdToFabricConverter } from '../utils/psdToFabricConverter'
import { createDemoData, createComplexDemoData } from '../utils/demoData'

export default {
  name: 'PsdUploader',
  emits: ['psd-parsed'],
  data() {
    return {
      loading: false,
      converting: false,
      progress: 0,
      progressStatus: '',
      psdFile: null,
      psdData: null,
      psdInfo: null
    }
  },
  methods: {
    async handleBeforeUpload(file) {
      const isPsd = file.type === 'application/octet-stream' && file.name.endsWith('.psd')
      const isLt100M = file.size / 1024 / 1024 < 100
      
      if (!isPsd) {
        this.$message.error('只能上传PSD文件!')
        return false
      }
      if (!isLt100M) {
        this.$message.error('文件大小不能超过100MB!')
        return false
      }
      
      this.psdFile = file
      await this.parsePsd(file)
      return false // 阻止自动上传
    },
    
    async parsePsd(file) {
      this.loading = true
      this.progress = 0
      this.progressStatus = ''
      
      try {
        this.progress = 20
        
        // 读取文件
        const arrayBuffer = await this.readFileAsArrayBuffer(file)
        this.progress = 40
        
        // 解析PSD
        const psd = readPsd(arrayBuffer)
        this.progress = 70
        
        this.psdData = psd
        this.psdInfo = {
          name: file.name,
          width: psd.width,
          height: psd.height,
          layerCount: this.countLayers(psd),
          textLayerCount: this.countTextLayers(psd)
        }
        
        this.progress = 100
        this.progressStatus = 'success'
        
        this.$message.success('PSD文件解析成功!')
        
      } catch (error) {
        console.error('PSD解析失败:', error)
        this.progressStatus = 'exception'
        this.$message.error('PSD文件解析失败: ' + error.message)
      } finally {
        this.loading = false
      }
    },
    
    async convertToFabric() {
      if (!this.psdData) return
      
      this.converting = true
      
      try {
        const converter = new PsdToFabricConverter()
        const result = await converter.convert(this.psdData)
        
        this.$emit('psd-parsed', {
          psdData: this.psdData,
          fabricJson: result.fabricJson,
          layers: result.layers,
          canvasSize: {
            width: this.psdInfo.width,
            height: this.psdInfo.height
          }
        })
        
        this.$message.success('转换为Fabric.js成功!')
        
      } catch (error) {
        console.error('转换失败:', error)
        this.$message.error('转换失败: ' + error.message)
      } finally {
        this.converting = false
      }
    },
    
    readFileAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target.result)
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
      })
    },
    
    loadDemoData() {
      const demoData = createDemoData()
      this.$emit('psd-parsed', demoData)
      this.$message.success('演示数据加载成功!')
    },
    
    loadComplexDemoData() {
      const demoData = createComplexDemoData()
      this.$emit('psd-parsed', demoData)
      this.$message.success('复杂演示数据加载成功!')
    },
    
    countLayers(psd) {
      let count = 0
      if (psd.children) {
        for (const child of psd.children) {
          count += 1 + this.countLayersRecursive(child)
        }
      }
      return count
    },
    
    countLayersRecursive(layer) {
      let count = 0
      if (layer.children) {
        for (const child of layer.children) {
          count += 1 + this.countLayersRecursive(child)
        }
      }
      return count
    },
    
    countTextLayers(psd) {
      let count = 0
      if (psd.children) {
        for (const child of psd.children) {
          count += this.countTextLayersRecursive(child)
        }
      }
      return count
    },
    
    countTextLayersRecursive(layer) {
      let count = 0
      if (layer.text) {
        count = 1
      }
      if (layer.children) {
        for (const child of layer.children) {
          count += this.countTextLayersRecursive(child)
        }
      }
      return count
    }
  }
}
</script>

<style scoped>
.psd-uploader {
  margin-bottom: 20px;
}

.upload-demo {
  width: 100%;
}

.psd-info {
  text-align: center;
}

.el-upload__tip {
  font-size: 12px;
  color: #606266;
}
</style>