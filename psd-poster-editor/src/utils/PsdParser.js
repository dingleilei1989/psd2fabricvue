import { readPsd } from '@webtoon/psd';

/**
 * PSD解析工具类
 * 负责解析PSD文件并转换为fabric.js兼容的对象格式
 */
export class PsdParser {
  constructor() {
    this.psd = null;
    this.canvasWidth = 800;
    this.canvasHeight = 600;
    this.scaleFactor = 1;
  }

  /**
   * 解析PSD文件
   * @param {File} file - PSD文件对象
   * @returns {Promise<Object>} 解析结果包含图层数据和画布信息
   */
  async parsePsdFile(file) {
    try {
      // 将文件转换为ArrayBuffer
      const arrayBuffer = await this.fileToArrayBuffer(file);
      
      // 使用@webtoon/psd解析PSD文件
      this.psd = readPsd(arrayBuffer);
      
      // 获取PSD文档信息
      const documentInfo = this.getDocumentInfo();
      
      // 计算缩放比例以适应画布
      this.calculateScaleFactor(documentInfo.width, documentInfo.height);
      
      // 解析图层
      const layers = await this.parseLayers(this.psd);
      
      return {
        documentInfo,
        layers,
        scaleFactor: this.scaleFactor,
        canvasWidth: this.canvasWidth,
        canvasHeight: this.canvasHeight
      };
    } catch (error) {
      console.error('PSD解析失败:', error);
      throw new Error(`PSD解析失败: ${error.message}`);
    }
  }

  /**
   * 将File对象转换为ArrayBuffer
   * @param {File} file - 文件对象
   * @returns {Promise<ArrayBuffer>} ArrayBuffer数据
   */
  fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 获取PSD文档信息
   * @returns {Object} 文档信息
   */
  getDocumentInfo() {
    if (!this.psd) {
      throw new Error('PSD文件未加载');
    }

    return {
      width: this.psd.width,
      height: this.psd.height,
      colorMode: this.psd.colorMode || 'RGB',
      bitsPerChannel: this.psd.depth || 8,
      channels: this.psd.channels || 3
    };
  }

  /**
   * 计算缩放比例以适应画布大小
   * @param {number} psdWidth - PSD原始宽度
   * @param {number} psdHeight - PSD原始高度
   */
  calculateScaleFactor(psdWidth, psdHeight) {
    const scaleX = this.canvasWidth / psdWidth;
    const scaleY = this.canvasHeight / psdHeight;
    this.scaleFactor = Math.min(scaleX, scaleY, 1); // 不超过原始大小
  }

  /**
   * 递归解析图层树
   * @param {Object} psd - PSD文档对象
   * @param {Array} layers - 累积的图层数组
   * @returns {Promise<Array>} fabric.js对象数组
   */
  async parseLayers(psd, layers = []) {
    try {
      // 遍历所有图层
      if (psd.children && psd.children.length > 0) {
        for (const layer of psd.children) {
          await this.parseLayer(layer, layers);
        }
      }

      return layers;
    } catch (error) {
      console.warn('图层解析警告:', error);
      return layers;
    }
  }

  /**
   * 解析单个图层
   * @param {Object} layer - 图层对象
   * @param {Array} layers - 累积的图层数组
   */
  async parseLayer(layer, layers) {
    try {
      // 如果是组图层，递归解析子图层
      if (layer.children && layer.children.length > 0) {
        for (const child of layer.children) {
          await this.parseLayer(child, layers);
        }
      }

      // 如果是普通图层且可见，解析为fabric对象
      if (!layer.children && layer.opacity > 0) {
        const fabricObject = await this.convertLayerToFabricObject(layer);
        if (fabricObject) {
          layers.push(fabricObject);
        }
      }
    } catch (error) {
      console.warn(`图层 ${layer.name} 解析失败:`, error);
    }
  }

  /**
   * 将PSD图层转换为fabric.js对象
   * @param {Object} layer - PSD图层对象
   * @returns {Promise<Object|null>} fabric.js对象
   */
  async convertLayerToFabricObject(layer) {
    try {
      const name = layer.name || '未命名图层';
      
      // 获取图层位置和尺寸
      const bounds = this.getLayerBounds(layer);
      
      // 判断图层类型
      if (this.isTextLayer(layer)) {
        return this.createTextObject(layer, bounds, name);
      } else if (this.hasImageData(layer)) {
        return await this.createImageObject(layer, bounds, name);
      }
      
      return null;
    } catch (error) {
      console.warn(`图层 ${layer.name} 转换失败:`, error);
      return null;
    }
  }

  /**
   * 获取图层边界框信息
   * @param {Object} layer - PSD图层
   * @returns {Object} 边界框信息
   */
  getLayerBounds(layer) {
    return {
      left: (layer.left || 0) * this.scaleFactor,
      top: (layer.top || 0) * this.scaleFactor,
      width: ((layer.right || 0) - (layer.left || 0)) * this.scaleFactor,
      height: ((layer.bottom || 0) - (layer.top || 0)) * this.scaleFactor,
      right: (layer.right || 0) * this.scaleFactor,
      bottom: (layer.bottom || 0) * this.scaleFactor
    };
  }

  /**
   * 判断是否为文本图层
   * @param {Object} layer - 图层信息
   * @returns {boolean} 是否为文本图层
   */
  isTextLayer(layer) {
    return layer.type === 'text' || layer.text || (layer.additionalLayerInfo && layer.additionalLayerInfo.text);
  }

  /**
   * 判断图层是否包含图像数据
   * @param {Object} layer - PSD图层
   * @returns {boolean} 是否包含图像数据
   */
  hasImageData(layer) {
    try {
      return layer.canvas || layer.imageData || (layer.width > 0 && layer.height > 0);
    } catch (error) {
      return false;
    }
  }

  /**
   * 创建文本fabric对象
   * @param {Object} layer - 图层信息
   * @param {Object} bounds - 边界框信息
   * @param {string} name - 图层名称
   * @returns {Object} fabric文本对象
   */
  createTextObject(layer, bounds, name) {
    // 提取文本信息
    const textInfo = this.extractTextInfo(layer);
    
    return {
      type: 'text',
      name: name,
      text: textInfo.content,
      left: bounds.left,
      top: bounds.top,
      fontSize: textInfo.fontSize * this.scaleFactor,
      fontFamily: textInfo.fontFamily,
      fill: textInfo.color,
      fontWeight: textInfo.fontWeight,
      fontStyle: textInfo.fontStyle,
      textAlign: textInfo.textAlign,
      opacity: (layer.opacity || 255) / 255,
      angle: 0,
      scaleX: 1,
      scaleY: 1,
      // fabric.js特有属性
      originX: 'left',
      originY: 'top',
      // 自定义属性
      layerType: 'text',
      originalBounds: bounds
    };
  }

  /**
   * 提取文本信息
   * @param {Object} layer - 图层信息
   * @returns {Object} 文本信息
   */
  extractTextInfo(layer) {
    const defaultTextInfo = {
      content: '文本内容',
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left'
    };

    try {
      // 尝试从text属性获取
      if (layer.text) {
        return {
          ...defaultTextInfo,
          content: layer.text
        };
      }
      
      // 尝试从additionalLayerInfo获取
      if (layer.additionalLayerInfo && layer.additionalLayerInfo.text) {
        const textData = layer.additionalLayerInfo.text;
        return {
          content: textData.textValue || textData.text || defaultTextInfo.content,
          fontSize: textData.fontSize || defaultTextInfo.fontSize,
          fontFamily: textData.fontName || defaultTextInfo.fontFamily,
          color: this.parseColor(textData.color) || defaultTextInfo.color,
          fontWeight: textData.fontWeight || defaultTextInfo.fontWeight,
          fontStyle: textData.fontStyle || defaultTextInfo.fontStyle,
          textAlign: textData.textAlign || defaultTextInfo.textAlign
        };
      }

      return defaultTextInfo;
    } catch (error) {
      console.warn('文本信息提取失败，使用默认值:', error);
      return defaultTextInfo;
    }
  }

  /**
   * 解析颜色值
   * @param {Object} colorObj - 颜色对象
   * @returns {string} 十六进制颜色值
   */
  parseColor(colorObj) {
    try {
      if (!colorObj) return '#000000';
      
      // 如果已经是字符串格式
      if (typeof colorObj === 'string') {
        return colorObj.startsWith('#') ? colorObj : `#${colorObj}`;
      }
      
      // 如果是RGB对象
      if (colorObj.r !== undefined && colorObj.g !== undefined && colorObj.b !== undefined) {
        const r = Math.round(colorObj.r);
        const g = Math.round(colorObj.g);
        const b = Math.round(colorObj.b);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      }
      
      return '#000000';
    } catch (error) {
      console.warn('颜色解析失败:', error);
      return '#000000';
    }
  }

  /**
   * 创建图像fabric对象
   * @param {Object} layer - PSD图层
   * @param {Object} bounds - 边界框信息
   * @param {string} name - 图层名称
   * @returns {Promise<Object>} fabric图像对象
   */
  async createImageObject(layer, bounds, name) {
    try {
      // 尝试获取图层的canvas数据
      let imageData = null;
      
      if (layer.canvas) {
        // 使用canvas获取图像数据
        imageData = layer.canvas.toDataURL('image/png');
      } else if (layer.imageData) {
        // 从imageData创建canvas
        const canvas = document.createElement('canvas');
        canvas.width = layer.width || bounds.width;
        canvas.height = layer.height || bounds.height;
        const ctx = canvas.getContext('2d');
        
        if (layer.imageData) {
          const imageDataObj = new ImageData(
            new Uint8ClampedArray(layer.imageData), 
            canvas.width, 
            canvas.height
          );
          ctx.putImageData(imageDataObj, 0, 0);
          imageData = canvas.toDataURL('image/png');
        }
      }
      
      if (!imageData) {
        console.warn(`图层 ${name} 无法获取图像数据`);
        return null;
      }
      
      return {
        type: 'image',
        name: name,
        src: imageData,
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
        opacity: (layer.opacity || 255) / 255,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        // fabric.js特有属性
        originX: 'left',
        originY: 'top',
        crossOrigin: 'anonymous',
        // 自定义属性
        layerType: 'image',
        originalBounds: bounds
      };
    } catch (error) {
      console.warn(`图像图层 ${name} 创建失败:`, error);
      return null;
    }
  }

  /**
   * 将Buffer转换为base64字符串
   * @param {Buffer} buffer - Buffer数据
   * @returns {string} base64字符串
   */
  bufferToBase64(buffer) {
    if (buffer instanceof ArrayBuffer) {
      const uint8Array = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      return btoa(binary);
    }
    
    if (buffer && buffer.toString) {
      return buffer.toString('base64');
    }
    
    return '';
  }

  /**
   * 设置目标画布尺寸
   * @param {number} width - 画布宽度
   * @param {number} height - 画布高度
   */
  setCanvasSize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
}

/**
 * 工厂函数：创建PSD解析器实例
 * @returns {PsdParser} 解析器实例
 */
export function createPsdParser() {
  return new PsdParser();
}

/**
 * 验证PSD文件格式
 * @param {File} file - 文件对象
 * @returns {boolean} 是否为有效的PSD文件
 */
export function validatePsdFile(file) {
  if (!file) return false;
  
  // 检查文件扩展名
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.psd')) {
    return false;
  }
  
  // 检查MIME类型（可能不准确，但作为额外验证）
  const validMimeTypes = [
    'image/vnd.adobe.photoshop',
    'application/octet-stream',
    'image/x-photoshop'
  ];
  
  return validMimeTypes.includes(file.type) || file.type === '';
}