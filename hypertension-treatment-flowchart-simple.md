# 高血压患者单药或联合治疗方案（简化版）

```mermaid
flowchart TB
    A[药物治疗选择] --> B{"血压<160/100 mmHg ᵃ<br/>或高于目标血压<20/10 mmHg<br/>或低/中危患者"}
    A --> C{"SBP≥160 mmHg 和/或<br/>DBP≥100 mmHg ᵃ<br/>或SBP高于目标血压20 mmHg<br/>和/或DBP高于目标血压10 mmHg<br/>或高危/很高危患者"}
    
    B --> D[单药起始治疗 ᵇ]
    C --> E[联合起始治疗 ᵇ]
    
    D --> F["第一步: C | A | D | B"]
    F --> G["第二步: C+A | A+D | C+D | C+B | F"]
    G --> H["第三步: C+A+D | C+A+B"]
    
    E --> I["第一步: C+A | A+D | C+D | C+B | F"]
    I --> J["第二步: C+A+D | C+A+B"]
    J --> K["第三步: 可再加其他降压药"]
```

---

## 详细版本（带独立药物框）

```mermaid
flowchart TB
    Start["<b>药物治疗选择</b>"]
    
    Start --> CondLeft
    Start --> CondRight
    
    CondLeft["血压<160/100 mmHg ᵃ<br/>或高于目标血压<20/10 mmHg<br/>或低/中危患者"]
    CondRight["SBP≥160 mmHg 和/或 DBP≥100 mmHg ᵃ<br/>或SBP高于目标血压20 mmHg<br/>和/或DBP高于目标血压10 mmHg<br/>或高危/很高危患者"]
    
    CondLeft --> MonoStart["<b>单药起始治疗 ᵇ</b>"]
    CondRight --> ComboStart["<b>联合起始治疗 ᵇ</b>"]
    
    %% 单药治疗路径
    MonoStart --> M_Step1_Label["<b>第一步</b>"]
    M_Step1_Label --> M1C["C"]
    M_Step1_Label --> M1A["A"]
    M_Step1_Label --> M1D["D"]
    M_Step1_Label --> M1B["B"]
    
    M1C --> M_Step2_Label["<b>第二步</b>"]
    M1A --> M_Step2_Label
    M1D --> M_Step2_Label
    M1B --> M_Step2_Label
    
    M_Step2_Label --> M2CA["C+A"]
    M_Step2_Label --> M2AD["A+D"]
    M_Step2_Label --> M2CD["C+D"]
    M_Step2_Label --> M2CB["C+B"]
    M_Step2_Label --> M2F["F"]
    
    M2CA --> M_Step3_Label["<b>第三步</b>"]
    M2AD --> M_Step3_Label
    M2CD --> M_Step3_Label
    M2CB --> M_Step3_Label
    M2F --> M_Step3_Label
    
    M_Step3_Label --> M3CAD["C+A+D"]
    M_Step3_Label --> M3CAB["C+A+B"]
    
    %% 联合治疗路径
    ComboStart --> C_Step1_Label["<b>第一步</b>"]
    C_Step1_Label --> C1CA["C+A"]
    C_Step1_Label --> C1AD["A+D"]
    C_Step1_Label --> C1CD["C+D"]
    C_Step1_Label --> C1CB["C+B"]
    C_Step1_Label --> C1F["F"]
    
    C1CA --> C_Step2_Label["<b>第二步</b>"]
    C1AD --> C_Step2_Label
    C1CD --> C_Step2_Label
    C1CB --> C_Step2_Label
    C1F --> C_Step2_Label
    
    C_Step2_Label --> C2CAD["C+A+D"]
    C_Step2_Label --> C2CAB["C+A+B"]
    
    C2CAD --> C_Step3_Label["<b>第三步</b>"]
    C2CAB --> C_Step3_Label
    
    C_Step3_Label --> C3["可再加其他降压药"]
```

---

## 注释说明

| 缩写 | 全称 |
|------|------|
| **SBP** | 收缩压 |
| **DBP** | 舒张压 |
| **C** | 钙通道阻滞剂（二氢吡啶类） |
| **A** | 血管紧张素转换酶抑制剂或血管紧张素Ⅱ受体拮抗剂 |
| **D** | 噻嗪类利尿剂 |
| **B** | β受体阻滞剂 |
| **F** | 固定复方制剂 |

### 备注
- ᵃ 对血压≥140/90 mmHg的高血压患者，也可起始联合治疗
- ᵇ 包括剂量递增到足剂量
- 1 mmHg = 0.133 kPa

---
**图2 高血压患者单药或联合治疗方案**
