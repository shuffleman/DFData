# 三角洲行动舔包模拟器 - UI架构设计文档

## 文档概述

本文档详细说明舔包模拟器的完整UI架构、布局系统、交互逻辑和技术实现细节。

---

## 整体布局架构

### 16:9 响应式布局 (基准尺寸: 1334x750px)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  顶部标题栏 (TitleBar) - 72px高                                                            │
│  显示: 游戏标题 | 计时器 | 总价值统计                                                        │
└──────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┬───────────────────────────┬──────────────────────┐
│  个人物资区域 (左侧)        │  战利品区域 (中间)          │  控制面板区域 (右侧)    │
│  固定宽度: 800px          │  自适应宽度                │  固定宽度: 246px      │
│  高度: 632px              │  高度: 632px               │  高度: 632px          │
│  Y坐标: 72px             │  Y坐标: 72px               │  Y坐标: 72px          │
└──────────────────────────┴───────────────────────────┴──────────────────────┘
```

### 布局参数计算 (config.ts)

```typescript
getResponsiveLayout() {
  // 控制面板固定在最右侧
  controlPanelWidth = 246px
  controlPanelX = screenWidth - 246 - 30 // 右侧留30px边距

  // 个人物资区域固定在左侧
  playerRegionWidth = 800px
  playerRegionX = 30 // 左侧留30px边距

  // 战利品区域自适应填充中间空间
  spoilsRegionX = 30 + 800 + 14 = 844px
  spoilsRegionWidth = controlPanelX - spoilsRegionX - 14 // 与控制面板保持14px间距
}
```

---

## 三大核心区域详解

### 1. 个人物资区域 (Player Region)

**定位**: 左侧固定区域，玩家的背包和装备栏

**技术实现**: `Region` 类 + 单个 `Inventory` (type=1)

**结构组成**:

```
Region: "个人物资"
└─ Inventory #0 (type=1, scrollable=true, countable=true)
   ├─ 主武器槽1 (Subgrid: 128px, 2:1比例) - 接受步枪/狙击/霰弹等
   ├─ 副武器槽 (Subgrid: 128px, 1:1比例) - 接受手枪
   ├─ 主武器槽2 (Subgrid: 128px, 2:1比例) - 第二把主武器
   ├─ 近战武器槽 (Subgrid: 128px, 1:1比例) - 刀具
   ├─ 头盔槽 (Subgrid: 128px, 1:1比例)
   ├─ 护甲槽 (Subgrid: 128px, 1:1比例)
   │
   ├─ [GridTitle] "胸挂"
   ├─ 胸挂装备槽 (Subgrid: 108px) - 接受胸挂类型
   └─ 胸挂容器 (GridContainer) - 动态格子，取决于装备的胸挂
   │
   ├─ [GridTitle] "口袋"
   └─ 口袋容器 (GridContainer: 4x2固定格子)
   │
   ├─ [GridTitle] "背包"
   ├─ 背包装备槽 (Subgrid: 100px) - 接受背包类型
   └─ 背包容器 (GridContainer) - 动态格子，取决于装备的背包
   │
   ├─ [GridTitle] "安全箱"
   └─ 安全箱容器 (GridContainer: 3x3固定格子)
```

**特性**:
- ✅ 支持垂直滚动 (scrollable=true)
- ✅ 计入总价值统计 (countable=true)
- ✅ 装备槽类型过滤 (accept参数控制可放置物品类型)
- ✅ 动态容器 (背包/胸挂大小取决于装备的物品)

**代码位置**: `src/invntory.ts:106-276` (initContent方法)

---

### 2. 战利品区域 (Spoils Region) ⭐核心复杂区域

**定位**: 中间自适应区域，地图上的战利品和玩家尸体

**技术实现**: `Region` 类 + 多个 `Inventory` (Tab切换)

#### 2.1 整体架构

```
Region: "战利品"
├─ TabSwitchUI (标签页切换器，显示在标题栏下方)
│  └─ 标签: [地面容器] [战利品1] [战利品2] [战利品3] [玩家盒子1] [玩家盒子2] [玩家盒子3]
│
├─ Inventory #0: 地面容器 (type=2, scrollable=2) ⭐特殊容器
├─ Inventory #1: 战利品盒子1 (type=0, scrollable=false)
├─ Inventory #2: 战利品盒子2 (type=0, scrollable=false)
├─ Inventory #3: 战利品盒子3 (type=0, scrollable=false)
├─ Inventory #4: 玩家盒子1 (type=1, scrollable=true)
├─ Inventory #5: 玩家盒子2 (type=1, scrollable=true)
└─ Inventory #6: 玩家盒子3 (type=1, scrollable=true)

⚠️ 同一时间只显示一个Inventory，其他Inventory.enabled=false
```

#### 2.2 三种Inventory类型详解

##### Type 0: 战利品盒子 (Spoils Box)

**用途**: 模拟地图上的箱子、保险柜、鸟窝等容器

**特性**:
- `scrollable = false` (不支持滚动，内容固定)
- `countable = false` (不计入玩家总价值)
- 默认格子: 7x8 或 8x6 (可配置)
- 格子大小: 72px
- 需要搜索才能看到物品 (放大镜转圈动画)

**结构**:
```
Inventory: "战利品1"
└─ Subgrid: "spoilsContainer" (7x8格子, cellSize=72px)
   └─ 物品列表 (Item[])
```

**代码位置**: `src/invntory.ts:297-324`

---

##### Type 1: 玩家盒子 (Player Container)

**用途**: 模拟被击杀玩家的舔包

**特性**:
- `scrollable = true` (支持垂直滚动)
- `countable = false` (不计入玩家总价值)
- 完整的装备栏系统 (同个人物资区域)
- 可以拾取敌人的武器、装备、背包内物品

**结构**: 与个人物资区域完全相同 (参见上方)

**代码位置**: `src/invntory.ts:106-276`

---

##### Type 2: 地面容器 (Ground Container) ⭐特殊设计

**用途**: 放置丢弃/整理的物品，类似"地面拾取区"

**特性**:
- `scrollable = 2` (特殊标识)
- `countable = false`
- 超大格子: 15x8 (72px/格)
- 永久可见，不需要搜索
- 通常作为战利品区域的第一个Tab

**结构**:
```
Inventory: "地面容器"
└─ Subgrid: "groundContainer" (15x8格子, cellSize=72px)
   └─ 物品列表 (Item[])
```

**代码位置**: `src/invntory.ts:279-296`

**关键代码**:
```typescript
if (this.scrollable === 2) {
    // 地面容器，创建15x8网格
    const groundContainer = new Subgrid({
        size: {width: 15, height: 8},
        cellSize: 72,
        aspect: 1,
        fullfill: false,
        countable: false,
        accept: [],
        title: "groundContainer"
    });
    this.contents["groundContainer"] = groundContainer;
}
```

#### 2.3 默认配置

**配置来源**: `localStorage.getItem('defaultSpoilsRegionConfig')` 或默认值

**默认配置** (`game.ts:118-127`):
```typescript
defaultSpoilsRegionConfig = [
    {type: "groundContainer", title: "地面容器", width: 15, height: 8},
    {type: "spoilsBox", title: "战利品1", width: 7, height: 8},
    {type: "spoilsBox", title: "战利品2", width: 7, height: 8},
    {type: "spoilsBox", title: "战利品3", width: 7, height: 8},
    {type: "playerContainer", title: "玩家盒子1"},
    {type: "playerContainer", title: "玩家盒子2"},
    {type: "playerContainer", title: "玩家盒子3"}
];
```

**初始化流程** (`game.ts:518-537`):
```typescript
private loadDefaultConfig(region: Region) {
    this.defaultSpoilsRegionConfig.forEach((val, index) => {
        if (val.type === "groundContainer") {
            region.addInventory(2, false, val.title);        // type=2
        } else if (val.type === "spoilsBox") {
            region.addInventory(0, true, val.title);         // type=0
        } else if (val.type === "playerContainer") {
            region.addInventory(1, true, val.title);         // type=1
        }
    });
}
```

#### 2.4 Tab切换系统

**UI组件**: `TabSwitchUI` (src/components/TabSwitchUI.ts)

**显示位置**: 标题栏下方，水平排列

**交互逻辑**:
1. 点击Tab标签 → 调用 `region.switchTo(index)`
2. 当前Inventory设置为 `enabled=false` (隐藏)
3. 目标Inventory设置为 `enabled=true` (显示)
4. 更新Tab高亮状态
5. 刷新UI显示

**代码位置**: `src/region.ts:219-235` 和 `src/region.ts:237-260`

---

### 3. 控制面板区域 (Control Panel Region)

**定位**: 右侧固定区域，游戏控制和设置

**技术实现**: `Region` 类 + 多个组件

**结构组成**:

```
Region: "控制面板"
├─ TotalValueDisplay (总价值显示器)
├─ Timer (计时器)
├─ GroundButton (回到地面容器按钮)
├─ ResetButton (重置游戏按钮)
├─ ScreenshotButton (截图按钮)
├─ SearchAllButton (全部搜索按钮)
└─ AutoOptimizeButton (智能优化按钮)
```

**特性**:
- 固定宽度 246px
- 组件垂直排列，间距12px
- 不包含Inventory
- 不计入价值统计

**代码位置**: `game.ts:300-322`

---

## 核心类和数据结构

### 1. Region (区域容器类)

**文件**: `src/region.ts`

**职责**: 管理一个UI区域，包含标题栏、背景、组件和Inventory列表

**核心属性**:
```typescript
class Region {
    container: PIXI.Container;              // PixiJS容器
    inventories: Inventory[] = [];          // 包含的Inventory列表
    currentInventoryId: number = 0;         // 当前显示的Inventory索引
    components: { [key: string]: any };     // 组件字典
    switcherUI: RegionSwitchUI | null;      // 箭头切换器(旧版)
    tabSwitchUI: TabSwitchUI | null;        // Tab标签切换器(新版)

    options: {
        title: string;                      // 区域标题
        width: number;                      // 区域宽度
        height: number;                     // 区域高度
        titleHeight: number;                // 标题栏高度
        componentWidth: number;             // 左侧组件区域宽度
        backgroundColor: number;            // 背景颜色
        backgroundAlpha: number;            // 背景透明度
        countable: boolean;                 // 是否计入价值统计
    }
}
```

**核心方法**:
- `addInventory(type, needToInit, title)` - 添加Inventory
- `addComponent(name, component)` - 添加组件
- `switchTo(id)` - 切换到指定Inventory
- `addTabSwitcherUI()` - 添加Tab切换器
- `updateLayout(pos, size)` - 更新响应式布局

---

### 2. Inventory (物品栏类)

**文件**: `src/invntory.ts`

**职责**: 管理一个物品栏，包含装备槽、容器格子和物品列表

**核心属性**:
```typescript
class Inventory {
    title: string;                          // 物品栏标题
    container: PIXI.Container;              // PixiJS容器
    contents: {                             // 包含的子网格字典
        [key: string]: GridTitle | Subgrid | GridContainer
    };

    scrollable: boolean | number;           // 滚动模式
                                            // true=玩家盒子(支持滚动)
                                            // false=战利品盒(不滚动)
                                            // 2=地面容器(15x8大格子)

    countable: boolean;                     // 是否计入价值统计
    parentRegion: Region | Item | null;     // 所属区域
    enabled: boolean;                       // 是否启用(可见)

    // 搜索相关
    currentSearchItem: Item | null;         // 当前搜索的物品
    magnify: Magnify | null;                // 放大镜动画
    searchTimer: number;                    // 搜索计时器
}
```

**核心方法**:
- `initContent()` - 初始化内容(根据scrollable类型)
- `addItem(item)` - 添加物品
- `setEnabled(enabled)` - 设置启用状态
- `onScroll(event)` - 处理滚动事件
- `startSearch(item)` - 开始搜索物品
- `updateSize(width, height)` - 更新尺寸

**三种类型的初始化逻辑**:

```typescript
initContent() {
    if (this.scrollable === true) {
        // Type 1: 玩家盒子 - 创建完整装备栏
        // 硬编码的gridConfigs: 主武器、副武器、头盔、护甲、背包、胸挂等
    }
    else if (this.scrollable === 2) {
        // Type 2: 地面容器 - 创建15x8大格子
        const groundContainer = new Subgrid({
            size: {width: 15, height: 8},
            cellSize: 72,
            ...
        });
    }
    else {
        // Type 0: 战利品盒子 - 创建7x8或8x6格子
        const spoilsContainer = new Subgrid({
            size: {width: 7, height: 8},
            cellSize: 72,
            ...
        });
    }
}
```

---

### 3. Subgrid (子网格类)

**文件**: `src/subgrid.ts`

**职责**: 管理一个格子系统，处理物品放置、碰撞检测和拖拽

**核心属性**:
```typescript
class Subgrid {
    width: number;                          // 格子宽度(列数)
    height: number;                         // 格子高度(行数)
    cellSize: number;                       // 单个格子像素大小
    aspect: number;                         // 宽高比(1.0=正方形, 2.0=横向)
    acceptedTypes: string[];                // 接受的物品类型(白名单)
    rejectedTypes: string[];                // 拒绝的物品类型(黑名单)
    blocks: Item[];                         // 包含的物品列表
    container: PIXI.Container;              // PixiJS容器
    parentRegion: Region | Item | null;     // 所属区域
    enabled: boolean;                       // 是否启用
}
```

**核心方法**:
- `addItem(item, col?, row?)` - 添加物品到格子
- `removeItem(item)` - 移除物品
- `checkCollision(item, col, row)` - 检查碰撞
- `findEmptySpace(item)` - 查找空位
- `canAcceptItem(item)` - 检查是否接受物品类型

**格子系统渲染**:
```typescript
initUI() {
    // 绘制背景
    graphics.rect(0, 0, width * cellSize * aspect, height * cellSize);
    graphics.fill({ color: 0x1f2121, alpha: 0.3 });

    // 绘制网格线
    for (let row = 0; row <= height; row++) {
        graphics.moveTo(0, row * cellSize);
        graphics.lineTo(width * cellSize * aspect, row * cellSize);
        graphics.stroke({ width: 2, color: 0x333333 });
    }

    for (let col = 0; col <= width; col++) {
        graphics.moveTo(col * cellSize * aspect, 0);
        graphics.lineTo(col * cellSize * aspect, height * cellSize);
        graphics.stroke({ width: 2, color: 0x333333 });
    }
}
```

---

### 4. GridContainer (动态容器类)

**文件**: `src/gridContainer.ts`

**职责**: 管理背包/胸挂的动态格子容器

**特性**:
- 格子布局取决于装备的背包/胸挂物品
- 支持多区域格子(subgridLayout)
- 支持物品过滤(filter)
- 支持最大数量限制(maxCount)
- 支持最大重量限制(maxWeight)

**数据结构** (来自物品配置):
```typescript
subgridLayout: [
    {
        cellsH: 4,              // 水平格子数
        cellsV: 2,              // 垂直格子数
        filter: ["ammo"],       // 只接受弹药
        maxCount: 4,            // 最多4个物品
        maxWeight: null         // 无重量限制
    },
    {
        cellsH: 6,
        cellsV: 4,
        filter: [],             // 接受所有类型
        maxCount: null,
        maxWeight: 20           // 最多20kg
    }
]
```

---

### 5. Item (物品类)

**文件**: `src/item.ts`

**职责**: 管理单个物品的显示、交互和属性

**核心属性**:
```typescript
class Item {
    info: ItemInfo;                         // 物品信息(配置)
    container: PIXI.Container;              // PixiJS容器
    sprite: PIXI.Sprite;                    // 物品图片
    parentGrid: Subgrid | null;             // 所在格子
    col: number;                            // 格子列位置
    row: number;                            // 格子行位置
    rotated: boolean;                       // 是否旋转

    // 配件系统(如果是枪械)
    accessories: {                          // 装配的配件
        [slotName: string]: Item
    };
}
```

**物品配置结构** (ItemInfo):
```typescript
interface ItemInfo {
    objectId: number;                       // 物品ID
    objectName: string;                     // 物品名称
    primaryClass: string;                   // 主分类(gun/acc/ammo/protect等)
    secondClass: string;                    // 次分类(gunRifle/accMuzzle等)
    cellWidth: number;                      // 宽度(格子数)
    cellHeight: number;                     // 高度(格子数)
    grade: number;                          // 稀有度(1-5)
    pic: string;                            // 图片URL
    avgPrice: number;                       // 平均价格
    search: number;                         // 搜索时间(秒)

    // 枪械专属
    accessories?: {                         // 配件槽位定义
        [slotName: string]: string[]        // 可装配件ID列表
    };

    // 容器专属
    subgridLayout?: SubgridLayoutItem[];    // 背包/胸挂格子布局
}
```

**核心方法**:
- `onDragStart()` - 开始拖拽
- `onDragMove()` - 拖拽移动
- `onDragEnd()` - 结束拖拽
- `rotate()` - 旋转物品
- `destroy()` - 销毁物品
- `attachAccessory(slotName, accessory)` - 装配配件

---

## 交互流程详解

### 1. 游戏启动流程

```
用户打开页面
  ↓
Game.init()
  ├─ loadResources() - 加载图标资源
  ├─ createPixiApp() - 创建PixiJS应用
  │   ├─ 设置16:9响应式Canvas
  │   └─ 添加resize监听
  ├─ initGameUI() - 初始化背景
  ├─ initGameComponents() - 初始化三大区域
  │   ├─ 创建playerRegion (个人物资)
  │   ├─ 创建controlPanelRegion (控制面板)
  │   └─ controlPanelRegion不创建spoilsRegion(等待用户点击开始)
  └─ 创建TitleBar (标题栏)

用户点击"开始游戏"按钮
  ↓
Game.startGameWithPreset(0)
  ├─ 销毁旧的spoilsRegion (如果存在)
  ├─ 创建新的Region: "战利品"
  ├─ 从API获取随机战利品数据
  │   └─ GET /api/public/gameitem/generate-loot?spoilsCount=3&playerCount=3
  ├─ 解析响应数据，创建多个Inventory
  │   ├─ playerContainer → addInventory(1, false)
  │   ├─ spoilsBox → addInventory(0, false)
  │   └─ 始终添加地面容器 → addInventory(2, false, "地面容器")
  ├─ 调用initInventory()初始化每个Inventory的内容
  ├─ region.switchTo(0) - 默认显示第一个Tab
  ├─ region.addTabSwitcherUI() - 添加Tab切换器
  └─ this.spoilsRegion = region
```

### 2. 物品拖拽流程

```
用户点击物品
  ↓
Item.onDragStart()
  ├─ 保存原始位置信息
  ├─ 从原格子移除 (视觉上)
  ├─ 设置为拖拽状态
  └─ 改变透明度/样式提示

用户移动鼠标
  ↓
Item.onDragMove()
  ├─ 更新物品位置跟随鼠标
  ├─ 计算目标格子坐标
  ├─ 检查碰撞 checkCollision()
  │   ├─ 遍历目标格子中的所有物品
  │   └─ 判断是否重叠
  └─ 改变边框颜色提示(绿色=可放置, 红色=冲突)

用户释放鼠标
  ↓
Item.onDragEnd()
  ├─ 计算释放位置的目标Subgrid
  ├─ 检查类型过滤 (acceptedTypes/rejectedTypes)
  ├─ 检查碰撞
  ├─ 如果可以放置:
  │   ├─ 从原格子完全移除
  │   ├─ 添加到目标格子
  │   ├─ 更新parentGrid引用
  │   └─ 更新总价值统计
  └─ 如果不能放置:
      ├─ 回到原始位置
      └─ 播放错误提示
```

### 3. 搜索流程

```
用户点击"全部搜索"按钮
  ↓
SearchAllButton.onClick()
  ├─ 遍历spoilsRegion.inventories
  └─ 对每个Inventory调用 startSearchAll()

或者

用户切换到战利品盒子Tab
  ↓
Inventory自动触发搜索
  ├─ 遍历该Inventory的所有物品
  └─ 对每个物品调用 startSearch(item)

Inventory.startSearch(item)
  ├─ 创建Magnify放大镜动画
  ├─ 显示转圈动画
  ├─ 启动定时器 (搜索时间 = item.info.search秒)
  ├─ 等待定时器完成
  └─ 定时器结束:
      ├─ 物品变为可见
      ├─ 移除放大镜动画
      └─ searchTimer = 0
```

### 4. Tab切换流程

```
用户点击Tab标签
  ↓
TabSwitchUI.onTabClick(index)
  ↓
Region.switchTo(index)
  ├─ 检查索引有效性
  ├─ inventories[currentInventoryId].setEnabled(false)
  │   └─ Inventory.container.visible = false
  ├─ currentInventoryId = index
  ├─ inventories[index].setEnabled(true)
  │   └─ Inventory.container.visible = true
  ├─ 更新TabSwitchUI高亮状态
  └─ 刷新UI显示
```

### 5. 智能优化流程

```
用户点击"智能优化"按钮
  ↓
AutoOptimizeButton.onClick()
  ├─ 收集战利品区域所有物品
  │   └─ 遍历spoilsRegion.inventories获取所有Item
  ├─ 按价值排序 (avgPrice降序)
  ├─ 尝试将高价值物品放入玩家背包
  │   ├─ 遍历playerRegion.inventories
  │   ├─ 对每个容器调用 findEmptySpace()
  │   ├─ 如果找到空位:
  │   │   ├─ 从战利品区移除
  │   │   ├─ 添加到玩家背包
  │   │   └─ 更新总价值
  │   └─ 如果背包满了，停止
  └─ 显示优化结果提示
```

---

## 关键常量和配置

### 格子尺寸

```typescript
DEFAULT_CELL_SIZE = 72;              // 默认格子大小

// 不同用途的格子大小:
装备槽 (主武器/副武器):    128px
装备槽 (头盔/护甲):        128px
胸挂槽:                    108px
背包槽:                    100px
战利品盒子格子:            72px
地面容器格子:              72px
```

### 稀有度颜色

```typescript
RARITY_COLORS = [
    0x808080,  // Grade 0 (灰色)
    0x808080,  // Grade 1 (灰色)
    0x367e68,  // Grade 2 (绿色)
    0x4b6b87,  // Grade 3 (蓝色)
    0x695687,  // Grade 4 (紫色)
    0xa16e50,  // Grade 5 (橙色)
    0xa14a4c,  // Grade 6 (红色)
    0xa14a4c,  // Grade 7 (红色)
];
```

### 物品类型

```typescript
// 主分类 (primaryClass)
"gun"           // 枪械
"acc"           // 配件
"ammo"          // 弹药
"protect"       // 防护装备(头盔/护甲)
"container"     // 容器(背包/胸挂)
"consumable"    // 消耗品
"collectible"   // 收集品

// 枪械次分类 (secondClass)
"gunRifle"      // 步枪
"gunSniper"     // 狙击枪
"gunShotgun"    // 霰弹枪
"gunSMG"        // 冲锋枪
"gunLMG"        // 轻机枪
"gunPistol"     // 手枪

// 配件次分类
"accMuzzle"     // 枪口
"accBarrel"     // 枪管
"accScope"      // 瞄具
"accStock"      // 枪托
"accHandguard"  // 护木
"accForeGrip"   // 前握把
"accBackGrip"   // 后握把
"accMagazine"   // 弹匣
"accFunctional" // 功能性配件
```

---

## 性能优化策略

### 1. Inventory启用/禁用机制

**问题**: 战利品区域包含7个Inventory，但同时渲染会消耗大量性能

**解决方案**:
```typescript
// 只有enabled=true的Inventory会显示
Inventory.setEnabled(enabled) {
    this.enabled = enabled;
    this.container.visible = enabled;

    // 禁用时暂停更新
    if (!enabled) {
        this.stopSearch();
        this.stopAnimations();
    }
}

// Region切换时只启用目标Inventory
Region.switchTo(index) {
    inventories[currentInventoryId].setEnabled(false);
    inventories[index].setEnabled(true);
}
```

### 2. 响应式布局更新

**问题**: 窗口resize时需要重新计算所有区域布局

**解决方案**:
```typescript
// 统一更新所有区域
Game.updateAllRegionsLayout() {
    const layout = getResponsiveLayout();

    playerRegion.updateLayout(
        {x: layout.playerRegion.x, y: layout.playerRegion.y},
        {width, height, ...}
    );

    spoilsRegion.updateLayout(...);
    controlPanelRegion.updateLayout(...);
}

// 防抖优化
window.addEventListener('resize', debounce(updateAllRegionsLayout, 100));
```

### 3. 物品懒加载

**问题**: 战利品盒子可能包含大量物品

**解决方案**:
- 初始化时物品不可见 (`item.container.visible = false`)
- 搜索完成后才显示 (`item.container.visible = true`)
- 切换到其他Tab时保持已搜索状态

### 4. 碰撞检测优化

**问题**: 拖拽时频繁检查碰撞

**解决方案**:
```typescript
// 只检查目标格子及其周围的物品
checkCollision(item, col, row) {
    const itemRect = {
        x: col,
        y: row,
        width: item.info.cellWidth,
        height: item.info.cellHeight
    };

    // 只遍历可能重叠的物品
    for (const block of this.blocks) {
        if (block === item) continue;

        const blockRect = {...};

        // 使用AABB碰撞检测
        if (rectsOverlap(itemRect, blockRect)) {
            return true;
        }
    }

    return false;
}
```

---

## 扩展和自定义

### 1. 自定义战利品区域配置

用户可以通过设置对话框自定义战利品区域的布局:

```typescript
// 保存到localStorage
localStorage.setItem('defaultSpoilsRegionConfig', JSON.stringify([
    {type: "groundContainer", title: "地面", width: 15, height: 8},
    {type: "spoilsBox", title: "箱子1", width: 10, height: 10},
    {type: "spoilsBox", title: "箱子2", width: 8, height: 8},
    {type: "playerContainer", title: "敌人1"},
    {type: "playerContainer", title: "敌人2"},
]));

// 游戏启动时读取
const storedConfig = localStorage.getItem('defaultSpoilsRegionConfig');
if (storedConfig) {
    this.defaultSpoilsRegionConfig = JSON.parse(storedConfig);
}
```

### 2. 添加新的Inventory类型

如果需要添加新类型的容器:

```typescript
// 1. 定义新类型标识
const TYPE_CUSTOM_CONTAINER = 3;

// 2. 在Inventory.initContent()中处理
if (this.scrollable === 3) {
    // 创建自定义容器逻辑
    const customContainer = new Subgrid({...});
    this.contents["customContainer"] = customContainer;
}

// 3. 在Region.addInventory()中支持
public addInventory(type: number, ...) {
    const scrollableValue =
        type === 1 ? true :
        type === 2 ? 2 :
        type === 3 ? 3 :     // 新增
        false;
    ...
}
```

### 3. 自定义格子系统

创建特殊形状的格子布局:

```typescript
// 在GridContainer中支持自定义布局
subgridLayout: [
    {
        cellsH: 3,
        cellsV: 3,
        offsetX: 0,     // 新增偏移量
        offsetY: 0,
        shape: "L",     // 新增形状定义
        ...
    }
]
```

---

## 常见问题和解决方案

### Q1: 为什么战利品区域的第一个必须是地面容器?

**A**: 这不是强制要求，但按照默认配置和代码逻辑:
- 地面容器作为"丢弃物品"的目标位置
- 代码中通过 `spoilsRegion.inventories[0]` 快速访问
- 始终可见，不需要搜索
- 建议保持第一个位置，避免修改丢弃逻辑

### Q2: 如何区分战利品盒子和玩家盒子?

**A**: 通过 `scrollable` 属性:
```typescript
if (inventory.scrollable === true) {
    // 这是玩家盒子 (type=1)
} else if (inventory.scrollable === false) {
    // 这是战利品盒子 (type=0)
} else if (inventory.scrollable === 2) {
    // 这是地面容器 (type=2)
}
```

### Q3: Tab切换时为什么不销毁Inventory?

**A**:
- 性能考虑: 避免频繁创建/销毁PixiJS对象
- 状态保持: 已搜索的物品不需要重新搜索
- 用户体验: 切换回来时保持原样

解决方案是使用 `enabled` 标志控制可见性和交互。

### Q4: 格子大小为什么不统一?

**A**: 不同场景需要不同视觉效果:
- 装备槽 (128px): 大图标，清晰显示武器/装备
- 战利品盒子 (72px): 适中，平衡视野和细节
- 地面容器 (72px): 与战利品盒子保持一致

### Q5: 如何添加新的装备槽?

**A**: 修改 `Inventory.initContent()` 中的 `gridConfigs` 数组:
```typescript
const gridConfigs = [
    ...existing configs,
    {
        type: 'Grid',
        name: 'NewSlot',
        accept: ['newItemType'],
        cellsize: 128,
        aspect: 1.0,
        fullfill: true
    }
];
```

---

## 技术栈总结

### 核心技术

- **渲染引擎**: PixiJS 8.9.1
- **编程语言**: TypeScript 5.7.2
- **构建工具**: Vite 6.2.0
- **模块系统**: ES Modules

### 关键依赖

- `@pixi/text`: 文本渲染
- `pixi.js`: 2D图形引擎

### 架构模式

- **组件化**: Region → Inventory → Subgrid/GridContainer → Item
- **事件驱动**: PixiJS交互事件系统
- **状态管理**: 通过 `window.game` 全局访问
- **响应式布局**: 16:9自适应 + 固定/流式混合布局

---

## 文件结构索引

```
src/
├── game.ts                    # 游戏主类，管理全局状态
├── region.ts                  # 区域容器类
├── invntory.ts                # 物品栏类 (注意拼写:invntory)
├── subgrid.ts                 # 子网格类
├── gridContainer.ts           # 动态容器类
├── gridTitle.ts               # 标题组件
├── item.ts                    # 物品类
├── config.ts                  # 配置和常量
├── utils.ts                   # 工具函数
├── itemManager.ts             # 物品管理器
├── itemInfoPanel.ts           # 物品信息面板
├── titleBar.ts                # 标题栏
├── magnify.ts                 # 放大镜动画
│
└── components/                # UI组件
    ├── regionSwitchUI.ts      # 箭头切换器(旧版)
    ├── TabSwitchUI.ts         # Tab标签切换器(新版)
    ├── timer.ts               # 计时器
    ├── totalValueDisplay.ts   # 总价值显示
    ├── GroundButton.ts        # 回到地面按钮
    ├── ResetButton.ts         # 重置按钮
    ├── ScreenshotButton.ts    # 截图按钮
    ├── SearchAllButton.ts     # 全部搜索按钮
    ├── AutoOptimizeButton.ts  # 智能优化按钮
    ├── SettingsDialog.ts      # 设置对话框
    └── PresetManager.ts       # 预设管理器
```

---

## 结语

本文档详细描述了三角洲行动舔包模拟器的完整UI架构设计。核心要点:

1. **三栏式布局**: 个人物资(左) + 战利品(中) + 控制面板(右)
2. **战利品区域**: 多个Inventory通过Tab切换，支持地面容器、战利品盒子、玩家盒子三种类型
3. **格子系统**: Subgrid处理物品放置和碰撞检测
4. **响应式设计**: 16:9自适应布局，支持窗口缩放
5. **性能优化**: enabled机制、懒加载、碰撞检测优化

理解这个架构后，可以轻松扩展新功能、修改布局或添加新的容器类型。

---

**文档版本**: 1.0
**最后更新**: 2025-01-11
**维护者**: Claude Code
