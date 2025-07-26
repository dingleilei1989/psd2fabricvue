<template>
  <div class="layer-tree">
    <el-card v-if="layers && layers.length">
      <template #header>
        <div class="card-header">
          <span>图层列表</span>
          <el-button size="small" @click="toggleAllLayers">
            {{ allVisible ? '隐藏全部' : '显示全部' }}
          </el-button>
        </div>
      </template>
      
      <el-tree
        :data="treeData"
        :props="treeProps"
        :expand-on-click-node="false"
        :check-on-click-node="true"
        show-checkbox
        node-key="id"
        ref="layerTree"
        @check="handleCheck"
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <span class="layer-node">
            <el-icon v-if="data.type === 'text'" class="layer-icon text-layer">
              <document />
            </el-icon>
            <el-icon v-else-if="data.type === 'image'" class="layer-icon image-layer">
              <picture />
            </el-icon>
            <el-icon v-else-if="data.type === 'group'" class="layer-icon group-layer">
              <folder />
            </el-icon>
            <el-icon v-else class="layer-icon">
              <document />
            </el-icon>
            
            <span class="layer-name">{{ data.name }}</span>
            
            <el-tag v-if="data.type === 'text'" size="small" type="success">
              文字
            </el-tag>
            <el-tag v-else-if="data.type === 'image'" size="small" type="info">
              图片
            </el-tag>
            <el-tag v-else-if="data.type === 'group'" size="small" type="warning">
              组
            </el-tag>
          </span>
        </template>
      </el-tree>
      
      <div class="layer-controls" style="margin-top: 15px;">
        <el-button 
          size="small" 
          type="primary" 
          @click="exportSelectedLayers"
          :disabled="selectedLayers.length === 0"
        >
          导出选中图层 ({{ selectedLayers.length }})
        </el-button>
        
        <el-button 
          size="small" 
          @click="exportFabricJson"
        >
          导出Fabric JSON
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'LayerTree',
  props: {
    layers: {
      type: Array,
      required: true
    }
  },
  emits: ['layer-toggle', 'layer-select'],
  data() {
    return {
      treeData: [],
      treeProps: {
        children: 'children',
        label: 'name'
      },
      selectedLayers: [],
      allVisible: true
    }
  },
  watch: {
    layers: {
      handler() {
        this.buildTreeData()
      },
      immediate: true
    }
  },
  methods: {
    buildTreeData() {
      this.treeData = this.convertLayersToTree(this.layers)
    },
    
    convertLayersToTree(layers) {
      return layers.map(layer => ({
        id: layer.id,
        name: layer.name,
        type: layer.type,
        visible: layer.visible !== false,
        children: layer.children ? this.convertLayersToTree(layer.children) : [],
        rawLayer: layer
      }))
    },
    
    handleCheck(data, checkInfo) {
      const checkedKeys = checkInfo.checkedKeys
      this.selectedLayers = checkedKeys
      
      // 切换图层可见性
      this.toggleLayerVisibility(data.id, checkInfo.checkedKeys.includes(data.id))
    },
    
    handleNodeClick(data) {
      this.$emit('layer-select', data.id)
    },
    
    toggleLayerVisibility(layerId, visible) {
      this.$emit('layer-toggle', layerId, visible)
    },
    
    toggleAllLayers() {
      this.allVisible = !this.allVisible
      
      if (this.allVisible) {
        // 选中所有节点
        const allKeys = this.getAllNodeKeys(this.treeData)
        this.$refs.layerTree.setCheckedKeys(allKeys)
        this.selectedLayers = allKeys
      } else {
        // 取消选中所有节点
        this.$refs.layerTree.setCheckedKeys([])
        this.selectedLayers = []
      }
      
      // 通知父组件切换所有图层
      const allKeys = this.getAllNodeKeys(this.treeData)
      allKeys.forEach(key => {
        this.$emit('layer-toggle', key, this.allVisible)
      })
    },
    
    getAllNodeKeys(nodes) {
      let keys = []
      nodes.forEach(node => {
        keys.push(node.id)
        if (node.children && node.children.length) {
          keys = keys.concat(this.getAllNodeKeys(node.children))
        }
      })
      return keys
    },
    
    exportSelectedLayers() {
      if (this.selectedLayers.length === 0) {
        this.$message.warning('请选择要导出的图层')
        return
      }
      
      const selectedLayersData = this.getSelectedLayersData()
      const dataStr = JSON.stringify(selectedLayersData, null, 2)
      this.downloadJson(dataStr, 'selected-layers.json')
      
      this.$message.success(`已导出 ${this.selectedLayers.length} 个图层`)
    },
    
    exportFabricJson() {
      // 这里应该从父组件获取当前的Fabric JSON
      this.$message.info('请在画布组件中导出Fabric JSON')
    },
    
    getSelectedLayersData() {
      const result = []
      
      const collectLayers = (nodes) => {
        nodes.forEach(node => {
          if (this.selectedLayers.includes(node.id)) {
            result.push(node.rawLayer)
          }
          if (node.children && node.children.length) {
            collectLayers(node.children)
          }
        })
      }
      
      collectLayers(this.treeData)
      return result
    },
    
    downloadJson(content, filename) {
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }
}
</script>

<style scoped>
.layer-tree {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.layer-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.layer-icon {
  font-size: 16px;
}

.text-layer {
  color: #67c23a;
}

.image-layer {
  color: #409eff;
}

.group-layer {
  color: #e6a23c;
}

.layer-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-controls {
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
}

.layer-controls .el-button {
  width: 100%;
  margin-bottom: 8px;
}

:deep(.el-tree-node__content) {
  height: 32px;
}

:deep(.el-tree-node__label) {
  flex: 1;
}
</style>