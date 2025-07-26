<template>
  <div id="app">
    <el-container>
      <el-header style="height: 60px; background-color: #545c64; color: white;">
        <div style="display: flex; align-items: center; height: 100%;">
          <h1 style="margin: 0; font-size: 24px;">PSD转Fabric.js工具</h1>
        </div>
      </el-header>
      
      <el-container>
        <el-aside width="300px" style="background-color: #f5f5f5; padding: 20px;">
          <PsdUploader @psd-parsed="handlePsdParsed" />
          <LayerTree 
            v-if="psdData" 
            :layers="psdData.layers" 
            @layer-toggle="handleLayerToggle"
            @layer-select="handleLayerSelect"
          />
        </el-aside>
        
        <el-main style="padding: 20px;">
          <FabricCanvas 
            ref="fabricCanvas"
            :canvas-data="canvasData"
            @canvas-ready="handleCanvasReady"
          />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import PsdUploader from './components/PsdUploader.vue'
import LayerTree from './components/LayerTree.vue'
import FabricCanvas from './components/FabricCanvas.vue'

export default {
  name: 'App',
  components: {
    PsdUploader,
    LayerTree,
    FabricCanvas
  },
  data() {
    return {
      psdData: null,
      canvasData: null,
      fabricInstance: null
    }
  },
  methods: {
    handlePsdParsed(data) {
      this.psdData = data
      this.canvasData = data.fabricJson
    },
    
    handleLayerToggle(layerId, visible) {
      if (this.fabricInstance) {
        this.fabricInstance.toggleLayer(layerId, visible)
      }
    },
    
    handleLayerSelect(layerId) {
      if (this.fabricInstance) {
        this.fabricInstance.selectLayer(layerId)
      }
    },
    
    handleCanvasReady(fabricInstance) {
      this.fabricInstance = fabricInstance
    }
  }
}
</script>

<style>
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  height: 100vh;
}

.el-container {
  height: 100%;
}

.el-aside {
  border-right: 1px solid #dcdfe6;
}

.el-main {
  background-color: #f8f9fa;
}
</style>