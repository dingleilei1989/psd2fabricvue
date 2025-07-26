// 演示数据，用于测试界面（当没有真实PSD文件时）
export function createDemoData() {
  return {
    psdData: null,
    fabricJson: {
      version: "5.3.0",
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
      objects: [
        {
          type: "rect",
          left: 50,
          top: 50,
          width: 200,
          height: 100,
          fill: "#ff6b6b",
          opacity: 0.8,
          layerId: "demo_rect_1",
          name: "背景矩形"
        },
        {
          type: "text",
          left: 60,
          top: 80,
          fontSize: 24,
          fontFamily: "Arial",
          fill: "#ffffff",
          text: "示例文字图层",
          fontWeight: "bold",
          layerId: "demo_text_1",
          name: "标题文字"
        },
        {
          type: "circle",
          left: 300,
          top: 200,
          radius: 50,
          fill: "#4ecdc4",
          opacity: 0.7,
          layerId: "demo_circle_1",
          name: "圆形图层"
        },
        {
          type: "text",
          left: 350,
          top: 250,
          fontSize: 18,
          fontFamily: "Arial",
          fill: "#2c3e50",
          text: "这是可编辑的文字",
          layerId: "demo_text_2",
          name: "描述文字"
        }
      ]
    },
    layers: [
      {
        id: "demo_rect_1",
        name: "背景矩形",
        type: "image",
        visible: true,
        opacity: 0.8,
        children: []
      },
      {
        id: "demo_text_1", 
        name: "标题文字",
        type: "text",
        visible: true,
        opacity: 1,
        children: []
      },
      {
        id: "demo_circle_1",
        name: "圆形图层", 
        type: "image",
        visible: true,
        opacity: 0.7,
        children: []
      },
      {
        id: "demo_text_2",
        name: "描述文字",
        type: "text", 
        visible: true,
        opacity: 1,
        children: []
      }
    ],
    canvasSize: {
      width: 800,
      height: 600
    }
  }
}

// 创建复杂的演示数据，包含分组图层
export function createComplexDemoData() {
  return {
    psdData: null,
    fabricJson: {
      version: "5.3.0",
      width: 1200,
      height: 800,
      backgroundColor: "#f8f9fa",
      objects: [
        // 背景层
        {
          type: "rect",
          left: 0,
          top: 0,
          width: 1200,
          height: 800,
          fill: "#f8f9fa",
          selectable: false,
          layerId: "bg_layer",
          name: "背景"
        },
        // 头部区域
        {
          type: "rect",
          left: 50,
          top: 50,
          width: 1100,
          height: 120,
          fill: "#3498db",
          rx: 10,
          ry: 10,
          layerId: "header_bg",
          name: "头部背景"
        },
        {
          type: "text",
          left: 80,
          top: 90,
          fontSize: 32,
          fontFamily: "Arial",
          fill: "#ffffff",
          text: "PSD转Fabric.js演示",
          fontWeight: "bold",
          layerId: "header_title",
          name: "头部标题"
        },
        // 内容区域
        {
          type: "rect",
          left: 100,
          top: 220,
          width: 300,
          height: 200,
          fill: "#e74c3c",
          rx: 5,
          ry: 5,
          layerId: "card1_bg",
          name: "卡片1背景"
        },
        {
          type: "text",
          left: 120,
          top: 250,
          fontSize: 20,
          fontFamily: "Arial",
          fill: "#ffffff",
          text: "文字图层1",
          fontWeight: "bold",
          layerId: "card1_title",
          name: "卡片1标题"
        },
        {
          type: "text",
          left: 120,
          top: 290,
          fontSize: 14,
          fontFamily: "Arial",
          fill: "#ffffff",
          text: "这是一个可编辑的\n文字图层，保留了\n原始的文字属性。",
          layerId: "card1_content",
          name: "卡片1内容"
        },
        // 第二个卡片
        {
          type: "rect",
          left: 450,
          top: 220,
          width: 300,
          height: 200,
          fill: "#2ecc71",
          rx: 5,
          ry: 5,
          layerId: "card2_bg",
          name: "卡片2背景"
        },
        {
          type: "text",
          left: 470,
          top: 250,
          fontSize: 20,
          fontFamily: "Arial",
          fill: "#ffffff",
          text: "文字图层2",
          fontWeight: "bold",
          layerId: "card2_title",
          name: "卡片2标题"
        },
        {
          type: "text",
          left: 470,
          top: 290,
          fontSize: 14,
          fontFamily: "Arial",
          fill: "#ffffff",
          text: "支持中文字体\n以及各种文字样式\n包括大小、颜色等。",
          layerId: "card2_content",
          name: "卡片2内容"
        },
        // 装饰元素
        {
          type: "circle",
          left: 850,
          top: 250,
          radius: 60,
          fill: "#f39c12",
          layerId: "decoration1",
          name: "装饰圆形"
        },
        {
          type: "text",
          left: 820,
          top: 280,
          fontSize: 16,
          fontFamily: "Arial",
          fill: "#ffffff",
          text: "装饰文字",
          fontWeight: "bold",
          layerId: "decoration_text",
          name: "装饰文字"
        }
      ]
    },
    layers: [
      {
        id: "bg_layer",
        name: "背景",
        type: "image",
        visible: true,
        opacity: 1,
        children: []
      },
      {
        id: "header_group",
        name: "头部组",
        type: "group",
        visible: true,
        opacity: 1,
        children: [
          {
            id: "header_bg",
            name: "头部背景",
            type: "image",
            visible: true,
            opacity: 1,
            children: []
          },
          {
            id: "header_title",
            name: "头部标题",
            type: "text",
            visible: true,
            opacity: 1,
            children: []
          }
        ]
      },
      {
        id: "content_group",
        name: "内容组",
        type: "group",
        visible: true,
        opacity: 1,
        children: [
          {
            id: "card1_group",
            name: "卡片1组",
            type: "group",
            visible: true,
            opacity: 1,
            children: [
              {
                id: "card1_bg",
                name: "卡片1背景",
                type: "image",
                visible: true,
                opacity: 1,
                children: []
              },
              {
                id: "card1_title",
                name: "卡片1标题",
                type: "text",
                visible: true,
                opacity: 1,
                children: []
              },
              {
                id: "card1_content",
                name: "卡片1内容",
                type: "text",
                visible: true,
                opacity: 1,
                children: []
              }
            ]
          },
          {
            id: "card2_group",
            name: "卡片2组",
            type: "group",
            visible: true,
            opacity: 1,
            children: [
              {
                id: "card2_bg",
                name: "卡片2背景",
                type: "image",
                visible: true,
                opacity: 1,
                children: []
              },
              {
                id: "card2_title",
                name: "卡片2标题",
                type: "text",
                visible: true,
                opacity: 1,
                children: []
              },
              {
                id: "card2_content",
                name: "卡片2内容",
                type: "text",
                visible: true,
                opacity: 1,
                children: []
              }
            ]
          }
        ]
      },
      {
        id: "decoration_group",
        name: "装饰组",
        type: "group",
        visible: true,
        opacity: 1,
        children: [
          {
            id: "decoration1",
            name: "装饰圆形",
            type: "image",
            visible: true,
            opacity: 1,
            children: []
          },
          {
            id: "decoration_text",
            name: "装饰文字",
            type: "text",
            visible: true,
            opacity: 1,
            children: []
          }
        ]
      }
    ],
    canvasSize: {
      width: 1200,
      height: 800
    }
  }
}