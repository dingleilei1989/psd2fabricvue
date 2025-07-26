<template>
  <div class="psd-viewer">
    <div v-if="psdInfo" class="psd-info">
      <h4>PSD 信息</h4>
      <p><strong>尺寸:</strong> {{ psdInfo.width }} × {{ psdInfo.height }}</p>
      <p><strong>颜色模式:</strong> {{ psdInfo.colorMode }}</p>
      <p><strong>图层数量:</strong> {{ layerCount }}</p>
    </div>
    
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PsdViewer',
  props: {
    psdInfo: {
      type: Object,
      default: null
    },
    layerCount: {
      type: Number,
      default: 0
    },
    error: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.psd-viewer {
  margin-bottom: 20px;
}

.psd-info {
  background: #34495e;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 10px;
}

.psd-info h4 {
  margin-bottom: 10px;
  color: #ecf0f1;
}

.psd-info p {
  margin: 5px 0;
  font-size: 12px;
  color: #bdc3c7;
}

.error-message {
  background: #e74c3c;
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-size: 12px;
}
</style>