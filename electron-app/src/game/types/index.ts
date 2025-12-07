/**
 * 战利品收集整理游戏 - 类型定义系统
 * 基于 delta-force-loot-simulator 架构
 */

import type * as PIXI from 'pixi.js';

// ============================================================================
// 前置类型声明（避免循环依赖）
// ============================================================================

// Item 和 Subgrid 现在作为类导出，不再需要接口声明
// 请从 @entities/Item 和 @core/Subgrid 导入

// ============================================================================
// 物品数据相关类型
// ============================================================================

/**
 * 物品完整信息接口（从JSON加载的原始数据）
 */
export interface ItemData {
  // 基础属性
  objectID: number | string;
  objectName: string;
  primaryClass: string;      // 主类别：gun, equipment, consumable等
  secondClass: string;        // 子类别：rifle, pistol, helmet等
  grade: number;              // 品质等级：0-4
  length: number;             // 长度（格子数）
  width: number;              // 宽度（格子数）
  baseValue: number;          // 基础价值
  searchTime?: number;        // 搜索时间（秒）

  // 图片资源
  pic?: string;               // 图片文件名
  imageUrl?: string;          // 完整图片URL

  // 武器专属属性
  gunDetail?: {
    caliber: string;          // 口径/弹药类型
    capacity: number;         // 弹匣容量
    accessory?: AccessoryInfo[];     // 配件信息（旧格式）
    allAccessory?: AccessoryInfo[];  // 所有配件信息（新格式）
  };

  // 容器专属属性（背包、胸挂等）
  subgridLayout?: [number, number, number, number][]; // [宽, 高, x偏移, y偏移]

  // 弹药专属
  stack?: number;             // 堆叠数量

  // 其他动态属性
  [key: string]: any;
}

/**
 * 配件信息
 */
export interface AccessoryInfo {
  slotID: string;             // 槽位ID
  slotName?: string;          // 槽位名称（中文）
  slotType?: string;          // 槽位类型
  unlock?: number;            // 解锁等级
}

/**
 * 物品类型枚举（用于 Subgrid 的类型过滤）
 */
export type ItemType =
  // 武器类型
  | 'gunRifle'
  | 'gunSMG'
  | 'gunShotgun'
  | 'gunLMG'
  | 'gunMP'
  | 'gunSniper'
  | 'gunPistol'
  // 装备类型
  | 'armor'
  | 'helmet'
  | 'bag'
  | 'chest'
  | 'knife'
  // 配件类型
  | 'accForeGrip'
  | 'accSight'
  | 'accMuzzle'
  | 'accStock'
  | 'accMagazine'
  | 'accBarrel'
  | 'accHandguard'
  | 'accRail'
  | 'accGrip'
  | 'accScope'
  | 'accLight'
  | 'accLaser'
  | 'accPatch'
  // 消耗品类型
  | 'consumable'
  | 'medicine'
  // 收集品类型
  | 'collection'
  | 'valuable'
  // 弹药类型
  | 'ammo';

/**
 * 品质颜色映射
 */
export const RARITY_COLORS: { [key: number]: number } = {
  0: 0x808080,  // 灰色 - 普通
  1: 0x4A90E2,  // 蓝色 - 罕见
  2: 0x9B59B6,  // 紫色 - 稀有
  3: 0xF39C12,  // 橙色 - 史诗
  4: 0xE74C3C   // 红色 - 传说
};

// ============================================================================
// 网格系统相关类型
// ============================================================================

/**
 * 网格位置
 */
export interface GridPosition {
  col: number;  // 列（x坐标）
  row: number;  // 行（y坐标）
  x: number;    // 列的别名（与col相同）
  y: number;    // 行的别名（与row相同）
}

/**
 * 网格尺寸
 */
export interface GridSize {
  width: number;   // 宽度（格子数）
  height: number;  // 高度（格子数）
}

/**
 * 已放置物品信息（用于GridSystem）
 */
export interface PlacedItem {
  item: any;      // Item from @entities/Item
  gridX: number;  // 网格X坐标
  gridY: number;  // 网格Y坐标
  width: number;  // 物品宽度（格子数）
  height: number; // 物品高度（格子数）
}

/**
 * 网格容器配置（用于GridSystem）
 */
export interface GridContainerConfig {
  gridWidth: number;   // 网格宽度（格子数）
  gridHeight: number;  // 网格高度（格子数）
  cellSize: number;    // 格子大小（像素）
}

/**
 * 网格接口 - 所有网格类型必须实现的接口
 */
export interface Grid {
  // 基础属性
  cellSize: number;               // 格子大小（像素）
  aspect: number;                 // 宽高比（通常为1，某些槽位为2）
  width: number;                  // 网格宽度（格子数）
  height: number;                 // 网格高度（格子数）
  container: PIXI.Container;      // PIXI容器

  // 类型验证
  acceptedTypes: string[];        // 接受的物品类型（白名单）
  rejectedTypes: string[];        // 拒绝的物品类型（黑名单）
  acceptedObjectIDs: number[];    // 接受的物品ID（用于配件槽）

  // 功能标志
  fullfill: boolean;              // 是否填充模式（配件槽为true）
  countable: boolean;             // 是否计入总价值
  enabled: boolean;               // 是否启用

  // 核心方法 (Item 类型来自 @entities/Item)
  checkBoundary(item: any, col: number, row: number, rotated?: boolean): boolean;
  checkAccept(item: any): boolean;
  checkForOverlap(item: any, col: number, row: number, rotated?: boolean): boolean;
  removeBlock(item: any): void;
  addBlock(item: any, col: number, row: number): void;
  addItem(item: any, col?: number, row?: number, removeFromOriginalGrid?: boolean): boolean;
  getItemsInArea(col: number, row: number, width: number, height: number): any[];
  getAllItems(): any[];
  getGridPositionFromGlobal(globalX: number, globalY: number, item: any | null): {
    clampedCol: number;
    clampedRow: number;
    snapX: number;
    snapY: number;
  };
  getGlobalPosition(): PIXI.Point;
  getGridGlobalPosition(pos: GridPosition): PIXI.Point;
}

/**
 * Subgrid 配置选项
 */
export interface SubgridOptions {
  size: GridSize;
  cellSize: number;
  aspect?: number;
  fullfill?: boolean;
  countable?: boolean;
  acceptTypes?: string[];
  rejectTypes?: string[];
  acceptObjectIDs?: number[];
  title?: string;
}

/**
 * GridContainer 配置选项
 */
export interface GridContainerOptions {
  title: string;
  layout: [number, number, number, number][];  // [宽, 高, x偏移, y偏移]
  cellSize: number;
  aspect?: number;
  fullfill?: boolean;
  countable?: boolean;
  acceptTypes?: string[];
  rejectTypes?: string[];
}

/**
 * Inventory 类型
 */
export enum InventoryType {
  PLAYER = 1,           // 玩家盒子（带安全箱）
  LOOT = 0,             // 战利品箱
  GROUND = 2,           // 地面容器
  PLAYER_LOOT = 3       // 玩家战利品（没有安全箱）
}

// ============================================================================
// 武器配件系统相关类型
// ============================================================================

/**
 * 武器槽位信息
 */
export interface WeaponSlot {
  slotID: string;
  slotName: string;
  slotType: string;
  unlock: number;
}

/**
 * 槽位配件信息
 */
export interface SlotAccessoryData {
  slotName: string;
  accessories: {
    objectID: number | string;
    objectName: string;
  }[];
}

/**
 * 槽位完整信息（包含可接受的配件ID列表）
 */
export interface SlotInfo {
  slotName: string;
  acceptedObjectIDs: number[];
}

/**
 * data.json 原始数据结构
 */
export interface RawDataStructure {
  weaponSlots: {
    [weaponID: string]: {
      objectID: string;
      objectName: string;
      slots: WeaponSlot[];
    };
  };
  slotAccessories: {
    [key: string]: SlotAccessoryData;  // key: "weaponID_slotID"
  };
}

/**
 * 完整的 data.json 结构
 */
export interface DataJson {
  rawData: RawDataStructure;
  [key: string]: any;
}

// ============================================================================
// 区域和组件相关类型
// ============================================================================

/**
 * Region 配置选项
 */
export interface RegionOptions {
  title: string;
  width?: number;
  height?: number;
  titleColor?: number;
  titleAlpha?: number;
  titleHeight?: number;
  backgroundColor?: number;
  componentWidth?: number;
}

/**
 * 战利品来源类型
 */
export enum LootSourceType {
  GROUND = 'ground',           // 地面容器（固定）
  ENEMY = 'enemy',             // 敌人尸体
  CONTAINER = 'container',     // 容器（箱子等）
  PLAYER_STASH = 'player_stash' // 玩家藏匿点
}

/**
 * 战利品来源接口
 */
export interface LootSource {
  id: string;
  type: LootSourceType;
  name: string;
  items: ItemData[];
  capacity?: number;
  locked: boolean;  // 是否锁定（不可关闭）
}

// ============================================================================
// 游戏配置相关类型
// ============================================================================

/**
 * 游戏配置接口
 */
export interface GameConfig {
  // 画布尺寸
  width: number;
  height: number;
  backgroundColor: number;

  // 区域布局（响应式）
  playerAreaWidth: number;     // 玩家区域宽度（像素）
  lootAreaWidth: number;       // 战利品区域宽度（像素）
  controlPanelWidth: number;   // 控制面板宽度（像素）

  // 网格配置
  cellSize: number;            // 默认格子大小（60px）

  // 功能开关
  needSearch: boolean;         // 是否需要搜索

  // 资源CDN
  resource_cdn: 'cdn' | 'api' | 'local';

  // 其他配置
  maxTabs: number;             // 最大Tab数量
}

/**
 * 响应式布局配置
 */
export interface ResponsiveLayout {
  playerRegion: {
    x: number;
    y: number;
    width: number;
    height: number;
    componentWidth: number;
    titleHeight: number;
  };
  spoilsRegion: {
    x: number;
    y: number;
    width: number;
    height: number;
    componentWidth: number;
    titleHeight: number;
  };
  controlPanel: {
    x: number;
    y: number;
    width: number;
    height: number;
    componentWidth: number;
    titleHeight: number;
  };
  scaleY: number;
}

// ============================================================================
// 事件回调类型
// ============================================================================

/**
 * 物品拖入回调
 */
export type OnItemDraggedIn = (
  item: any,  // Item from @entities/Item
  col: number,
  row: number,
  originalGrid: any | null  // Subgrid from @core/Subgrid
) => void;

/**
 * 物品拖出回调
 */
export type OnItemDraggedOut = (
  item: any,  // Item from @entities/Item
  originalGrid: any | null  // Subgrid from @core/Subgrid
) => void;

// ============================================================================
// 工具类型
// ============================================================================

/**
 * CDN类型
 */
export type CDNType = 'cdn' | 'api' | 'local';

/**
 * 物品概率配置
 */
export interface ItemProbability {
  prob: number;
  grades: number[];  // 每个等级的概率
}

/**
 * 物品生成概率配置
 */
export interface ItemProbabilities {
  [itemType: string]: ItemProbability;
}
