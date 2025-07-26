import { readPsd, Psd } from 'ag-psd'

export interface PsdLayerInfo {
  id: string
  name: string
  type: 'image' | 'text' | 'shape' | 'group'
  left: number
  top: number
  width: number
  height: number
  opacity: number
  visible: boolean
  blendMode?: string
}

export interface ConversionOptions {
  includeHiddenLayers: boolean
  preserveLayerEffects: boolean
  convertTextToImage: boolean
  maxImageSize: number
}

export class PsdToFabricConverter {
  private options: ConversionOptions

  constructor(options: Partial<ConversionOptions> = {}) {
    this.options = {
      includeHiddenLayers: false,
      preserveLayerEffects: false,
      convertTextToImage: true,
      maxImageSize: 2048,
      ...options
    }
  }

  async convertFile(file: File): Promise<{
    fabricJson: any
    width: number
    height: number
    layerInfo: PsdLayerInfo[]
  }> {
    const arrayBuffer = await file.arrayBuffer()
    const psd = readPsd(arrayBuffer, { 
      skipLayerImageData: false,
      skipCompositeImageData: false
    })

    const layerInfo = this.extractLayerInfo(psd)
    const fabricJson = await this.convertToFabric(psd)

    return {
      fabricJson,
      width: psd.width,
      height: psd.height,
      layerInfo
    }
  }

  private extractLayerInfo(psd: Psd): PsdLayerInfo[] {
    const layers: PsdLayerInfo[] = []

    const processLayer = (layer: any, index: number) => {
      const info: PsdLayerInfo = {
        id: `layer_${index}`,
        name: layer.name || `Layer ${index}`,
        type: this.determineLayerType(layer),
        left: layer.left || 0,
        top: layer.top || 0,
        width: layer.right ? layer.right - (layer.left || 0) : 0,
        height: layer.bottom ? layer.bottom - (layer.top || 0) : 0,
        opacity: layer.opacity !== undefined ? layer.opacity / 255 : 1,
        visible: !layer.hidden,
        blendMode: layer.blendMode
      }
      layers.push(info)
    }

    const processChildren = (children: any[]) => {
      children?.forEach((child, index) => {
        processLayer(child, index)
        if (child.children) {
          processChildren(child.children)
        }
      })
    }

    processChildren(psd.children || [])
    return layers
  }

  private determineLayerType(layer: any): 'image' | 'text' | 'shape' | 'group' {
    if (layer.children) return 'group'
    if (layer.text) return 'text'
    if (layer.vectorMask || layer.path) return 'shape'
    return 'image'
  }

  private async convertToFabric(psd: Psd): Promise<any> {
    const fabricObjects: any[] = []
    
    const processLayer = async (layer: any, parentX = 0, parentY = 0) => {
      // 跳过隐藏图层（如果设置了不包含隐藏图层）
      if (layer.hidden && !this.options.includeHiddenLayers) {
        return
      }

      const left = (layer.left || 0) + parentX
      const top = (layer.top || 0) + parentY

      if (layer.text && !this.options.convertTextToImage) {
        // 处理文本图层
        const textObject = this.createTextObject(layer, left, top)
        if (textObject) fabricObjects.push(textObject)
      } else if (layer.canvas) {
        // 处理图像图层
        const imageObject = await this.createImageObject(layer, left, top)
        if (imageObject) fabricObjects.push(imageObject)
      }
    }

    const processChildren = async (children: any[], parentX = 0, parentY = 0) => {
      if (!children) return
      
      for (const child of children) {
        await processLayer(child, parentX, parentY)
        
        if (child.children) {
          await processChildren(
            child.children, 
            parentX + (child.left || 0), 
            parentY + (child.top || 0)
          )
        }
      }
    }

    await processChildren(psd.children || [])

    return {
      version: '5.3.0',
      objects: fabricObjects,
      background: '#ffffff',
      width: psd.width,
      height: psd.height
    }
  }

  private createTextObject(layer: any, left: number, top: number): any | null {
    if (!layer.text) return null

    return {
      type: 'text',
      version: '5.3.0',
      originX: 'left',
      originY: 'top',
      left,
      top,
      width: layer.right ? layer.right - layer.left : 100,
      height: layer.bottom ? layer.bottom - layer.top : 20,
      fill: layer.text.color || '#000000',
      stroke: null,
      strokeWidth: 0,
      opacity: (layer.opacity || 255) / 255,
      visible: !layer.hidden,
      text: layer.text.text || '',
      fontSize: layer.text.fontSize || 16,
      fontFamily: layer.text.fontFamily || 'Arial',
      fontWeight: layer.text.fontWeight || 'normal',
      fontStyle: layer.text.fontStyle || 'normal',
      textAlign: 'left',
      angle: 0,
      scaleX: 1,
      scaleY: 1
    }
  }

  private async createImageObject(layer: any, left: number, top: number): Promise<any | null> {
    if (!layer.canvas) return null

    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      // 限制图像大小以避免性能问题
      const maxSize = this.options.maxImageSize
      const originalWidth = layer.canvas.width
      const originalHeight = layer.canvas.height
      
      let { width, height } = layer.canvas
      if (width > maxSize || height > maxSize) {
        const scale = Math.min(maxSize / width, maxSize / height)
        width *= scale
        height *= scale
      }

      canvas.width = width
      canvas.height = height

      // 绘制并缩放图层
      if (width !== originalWidth || height !== originalHeight) {
        ctx.drawImage(layer.canvas, 0, 0, width, height)
      } else {
        ctx.drawImage(layer.canvas, 0, 0)
      }

      const dataURL = canvas.toDataURL('image/png')

      return {
        type: 'image',
        version: '5.3.0',
        originX: 'left',
        originY: 'top',
        left,
        top,
        width,
        height,
        fill: 'rgb(0,0,0)',
        stroke: null,
        strokeWidth: 0,
        opacity: (layer.opacity || 255) / 255,
        visible: !layer.hidden,
        src: dataURL,
        angle: 0,
        scaleX: originalWidth !== width ? width / originalWidth : 1,
        scaleY: originalHeight !== height ? height / originalHeight : 1,
        filters: []
      }
    } catch (error) {
      console.warn('创建图像对象时出错:', error)
      return null
    }
  }
}

// 辅助函数
export const validatePsdFile = (file: File): { valid: boolean; error?: string } => {
  if (!file.name.toLowerCase().endsWith('.psd')) {
    return { valid: false, error: '请选择有效的 PSD 文件' }
  }
  
  if (file.size > 100 * 1024 * 1024) { // 100MB
    return { valid: false, error: 'PSD 文件大小不能超过 100MB' }
  }
  
  return { valid: true }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}