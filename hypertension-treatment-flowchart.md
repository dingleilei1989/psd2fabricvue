# 高血压患者单药或联合治疗方案

```mermaid
flowchart TB
    Start[药物治疗选择]
    
    Start --> Cond1{{"血压&lt;160/100 mmHg<sup>a</sup>,<br/>或高于目标血压&lt;20/10 mmHg,<br/>或低/中危患者"}}
    Start --> Cond2{{"SBP≥160 mmHg 和/或<br/>DBP≥100 mmHg<sup>a</sup>, 或<br/>SBP高于目标血压20 mmHg<br/>和/或DBP高于目标血压10 mmHg,<br/>或高危/很高危患者"}}
    
    Cond1 --> Mono[单药起始治疗<sup>b</sup>]
    Cond2 --> Combo[联合起始治疗<sup>b</sup>]
    
    subgraph MonoPath[" "]
        direction TB
        Mono --> Step1_Mono
        subgraph Step1_Mono[第一步]
            direction LR
            M1C[C] ~~~ M1A[A] ~~~ M1D[D] ~~~ M1B[B]
        end
        Step1_Mono --> Step2_Mono
        subgraph Step2_Mono[第二步]
            direction LR
            M2CA[C+A] ~~~ M2AD[A+D] ~~~ M2CD[C+D] ~~~ M2CB[C+B] ~~~ M2F[F]
        end
        Step2_Mono --> Step3_Mono
        subgraph Step3_Mono[第三步]
            direction LR
            M3CAD[C+A+D] ~~~ M3CAB[C+A+B]
        end
    end
    
    subgraph ComboPath[" "]
        direction TB
        Combo --> Step1_Combo
        subgraph Step1_Combo[第一步]
            direction LR
            C1CA[C+A] ~~~ C1AD[A+D] ~~~ C1CD[C+D] ~~~ C1CB[C+B] ~~~ C1F[F]
        end
        Step1_Combo --> Step2_Combo
        subgraph Step2_Combo[第二步]
            direction LR
            C2CAD[C+A+D] ~~~ C2CAB[C+A+B]
        end
        Step2_Combo --> Step3_Combo[第三步<br/>可再加其他降压药]
    end
```

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
- <sup>a</sup> 对血压≥140/90 mmHg的高血压患者，也可起始联合治疗
- <sup>b</sup> 包括剂量递增到足剂量
- 1 mmHg = 0.133 kPa

---
**图2 高血压患者单药或联合治疗方案**
