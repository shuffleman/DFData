/**
 * 物品类别
 */
export type ItemCategory =
  | 'weapon'
  | 'accessory'
  | 'ammunition'
  | 'helmet'
  | 'armor'
  | 'chest'
  | 'backpack'
  | 'collectible'
  | 'consumable';

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
 * 装备槽位类型
 */
export enum EquipmentSlotType {
  HELMET = 'helmet',
  ARMOR = 'armor',
  CHEST = 'chest',
  BACKPACK = 'backpack',
  PRIMARY_WEAPON_1 = 'primary_weapon_1',
  PRIMARY_WEAPON_2 = 'primary_weapon_2',
  SECONDARY_WEAPON = 'secondary_weapon'
}

/**
 * 物品数据接口（从JSON加载）
 */
export interface ItemData {
  objectID: number;
  id: number;
  objectName: string;
  category: ItemCategory;
  type?: string;
  grade?: number;
  weight?: number;
  width?: number;
  height?: number;
  picture?: string;
  imageData?: string;
  avgPrice?: number;

  // 武器专属
  caliber?: string;
  meatHarm?: number;
  capacity?: number;

  // 容器专属（背包、胸挂等）
  grid?: GridCellData[];

  // 其他属性
  [key: string]: any;
}

/**
 * 格子数据接口
 */
export interface GridCellData {
  x: number;
  y: number;
  width: number;
  height: number;
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

/**
 * 网格位置
 */
export interface GridPosition {
  x: number;
  y: number;
}

/**
 * 网格容器配置
 */
export interface GridContainerConfig {
  gridWidth: number;    // 网格列数
  gridHeight: number;   // 网格行数
  cellSize: number;     // 单元格像素大小
  padding: number;      // 内边距
}

/**
 * 物品放置数据
 */
export interface PlacedItem {
  item: ItemData;
  gridX: number;
  gridY: number;
  width: number;
  height: number;
}

/**
 * 游戏配置
 */
export interface GameConfig {
  width: number;
  height: number;
  backgroundColor: number;
  playerAreaWidth: number;     // 玩家区域宽度百分比 (35)
  lootAreaWidth: number;       // 战利品区域宽度百分比 (50)
  controlPanelWidth: number;   // 控制面板宽度百分比 (15)
  cellSize: number;            // 网格单元格大小 (60px)
  maxTabs: number;             // 最大Tab数量 (6)
}
