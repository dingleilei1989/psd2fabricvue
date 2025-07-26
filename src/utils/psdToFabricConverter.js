import { fabric } from 'fabric'

export class PsdToFabricConverter {
  constructor() {
    this.canvas = null
    this.layers = []
    this.fabricObjects = []
    this.layerIdCounter = 0
  }

  async convert(psdData) {
    try {
      // 初始化画布信息
      const canvasInfo = {
        width: psdData.width,
        height: psdData.height,
        backgroundColor: '#ffffff'
      }

      // 解析图层
      this.layers = []
      this.fabricObjects = []
      this.layerIdCounter = 0

      // 处理所有子图层
      if (psdData.children) {
        for (const child of psdData.children) {
          await this.parseLayer(child, null)
        }
      }

      // 生成Fabric.js JSON
      const fabricJson = {
        version: fabric.version,
        ...canvasInfo,
        objects: this.fabricObjects
      }

      return {
        fabricJson,
        layers: this.layers,
        canvasInfo
      }

    } catch (error) {
      console.error('PSD转换失败:', error)
      throw new Error('PSD转换失败: ' + error.message)
    }
  }

  async parseLayer(layer, parentId = null) {
    const layerId = this.generateLayerId()
    
    // 获取图层基本信息
    const layerInfo = {
      id: layerId,
      name: layer.name || `图层${layerId}`,
      type: this.getLayerType(layer),
      visible: layer.visible !== false,
      opacity: (layer.opacity || 255) / 255,
      blendMode: layer.blendMode || 'normal',
      parentId: parentId,
      children: []
    }

    // 获取图层位置和尺寸
    const bounds = this.getLayerBounds(layer)
    layerInfo.bounds = bounds

    // 根据图层类型创建Fabric对象
    try {
      const fabricObject = await this.createFabricObject(layer, layerId, bounds)
      if (fabricObject) {
        this.fabricObjects.push(fabricObject)
        layerInfo.fabricObject = fabricObject
      }
    } catch (error) {
      console.warn(`创建图层 ${layerInfo.name} 的Fabric对象失败:`, error)
    }

    this.layers.push(layerInfo)

    // 递归处理子图层
    if (layer.children) {
      for (const child of layer.children) {
        const childLayer = await this.parseLayer(child, layerId)
        if (childLayer) {
          layerInfo.children.push(childLayer)
        }
      }
    }

    return layerInfo
  }

  async createFabricObject(layer, layerId, bounds) {
    const type = this.getLayerType(layer)
    
    switch (type) {
      case 'text':
        return await this.createTextObject(layer, layerId, bounds)
      
      case 'image':
      case 'layer':
        return await this.createImageObject(layer, layerId, bounds)
      
      case 'group':
        // 组图层不创建对象，由子图层处理
        return null
      
      default:
        return await this.createImageObject(layer, layerId, bounds)
    }
  }

  async createTextObject(layer, layerId, bounds) {
    try {
      // 获取文字信息
      const textInfo = this.extractTextInfo(layer)
      
      if (!textInfo.text) {
        console.warn('文字图层没有文本内容')
        return null
      }

      // 创建Fabric Text对象
      const textObject = {
        type: 'text',
        left: bounds.left,
        top: bounds.top,
        fontSize: textInfo.fontSize,
        fontFamily: textInfo.fontFamily,
        fill: textInfo.color,
        opacity: (layer.opacity || 255) / 255,
        visible: layer.visible !== false,
        layerId: layerId,
        name: layer.name || '文字图层',
        text: textInfo.text,
        // 保留原始文字属性以便编辑
        fontWeight: textInfo.fontWeight,
        fontStyle: textInfo.fontStyle,
        textAlign: textInfo.textAlign,
        lineHeight: textInfo.lineHeight
      }

      return textObject

    } catch (error) {
      console.error('创建文字对象失败:', error)
      // 如果文字解析失败，回退到图片模式
      return await this.createImageObject(layer, layerId, bounds)
    }
  }

  async createImageObject(layer, layerId, bounds) {
    try {
      // 对于ag-psd，我们需要使用不同的方法来导出图层
      // 这里暂时创建一个占位符矩形
      const imageObject = {
        type: 'rect',
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
        fill: this.getLayerColor(layer),
        opacity: (layer.opacity || 255) / 255,
        visible: layer.visible !== false,
        layerId: layerId,
        name: layer.name || '图片图层'
      }

      return imageObject

    } catch (error) {
      console.error('创建图片对象失败:', error)
      return null
    }
  }

  extractTextInfo(layer) {
    const defaultTextInfo = {
      text: '',
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      lineHeight: 1.2
    }

    try {
      // ag-psd库的文字图层结构
      if (layer.text) {
        // 获取文本内容
        if (layer.text.text) {
          defaultTextInfo.text = layer.text.text
        }
        
        // 获取字体样式
        if (layer.text.style) {
          const style = layer.text.style
          
          if (style.fontSize) {
            defaultTextInfo.fontSize = style.fontSize
          }
          
          if (style.font) {
            defaultTextInfo.fontFamily = style.font
          }
          
          if (style.fillColor) {
            defaultTextInfo.color = this.rgbaToHex(style.fillColor)
          }
          
          if (style.fontWeight) {
            defaultTextInfo.fontWeight = style.fontWeight
          }
          
          if (style.fontStyle) {
            defaultTextInfo.fontStyle = style.fontStyle
          }
        }
      }

      // 如果没有文字内容，使用图层名称作为替代
      if (!defaultTextInfo.text && layer.name) {
        defaultTextInfo.text = layer.name
      }

      return defaultTextInfo

    } catch (error) {
      console.error('提取文字信息失败:', error)
      return defaultTextInfo
    }
  }

  getLayerType(layer) {
    if (layer.text) {
      return 'text'
    }

    if (layer.children && layer.children.length > 0) {
      return 'group'
    }

    return 'layer'
  }

  getLayerBounds(layer) {
    const defaultBounds = { left: 0, top: 0, width: 100, height: 100 }

    try {
      if (layer.left !== undefined && layer.top !== undefined &&
          layer.right !== undefined && layer.bottom !== undefined) {
        return {
          left: layer.left,
          top: layer.top,
          width: layer.right - layer.left,
          height: layer.bottom - layer.top
        }
      }

      return defaultBounds

    } catch (error) {
      console.warn('获取图层边界失败:', error)
      return defaultBounds
    }
  }

  generateLayerId() {
    return `layer_${++this.layerIdCounter}_${Date.now()}`
  }

  arrayBufferToBase64(buffer) {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  rgbaToHex(rgba) {
    if (!rgba || typeof rgba !== 'object') return '#000000'
    
    const r = Math.round((rgba.r || 0) * 255)
    const g = Math.round((rgba.g || 0) * 255)
    const b = Math.round((rgba.b || 0) * 255)
    
    return this.rgbToHex(r, g, b)
  }

  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
  }

  getLayerColor(layer) {
    // 为不同类型的图层返回不同的颜色
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8']
    const hash = this.hashCode(layer.name || 'layer')
    return colors[Math.abs(hash) % colors.length]
  }

  hashCode(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return hash
  }

  // 辅助方法：获取文字图层的实际文本内容
  getTextContent(node) {
    try {
      // 方法1: 直接从text属性获取
      if (node.text && node.text.value) {
        return node.text.value
      }

      // 方法2: 从textKey获取
      if (node.text && node.text.textKey) {
        return node.text.textKey
      }

      // 方法3: 从engineData获取
      if (node.engineData) {
        // 这里需要解析PSD的引擎数据，比较复杂
        // 简化处理，返回图层名称作为文本
        return node.name || 'Text Layer'
      }

      return ''

    } catch (error) {
      console.error('获取文字内容失败:', error)
      return ''
    }
  }

  // 辅助方法：获取字体样式信息
  getFontStyles(node) {
    const defaultStyles = {
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000',
      bold: false,
      italic: false
    }

    try {
      if (node.text && node.text.font) {
        const font = node.text.font
        
        // 获取字体大小
        if (font.sizes && font.sizes[0]) {
          defaultStyles.fontSize = font.sizes[0]
        }

        // 获取字体名称
        if (font.names && font.names[0]) {
          defaultStyles.fontFamily = font.names[0]
        }

        // 获取颜色
        if (font.colors && font.colors[0]) {
          defaultStyles.color = this.rgbaToHex(font.colors[0])
        }
      }

      return defaultStyles

    } catch (error) {
      console.error('获取字体样式失败:', error)
      return defaultStyles
    }
  }
}