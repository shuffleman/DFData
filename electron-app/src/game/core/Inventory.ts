/**
 * Inventory - 物品栏类
 * 代表一个完整的物品栏（玩家盒子、战利品箱、地面容器等）
 */

import * as PIXI from 'pixi.js';
import { Subgrid } from './Subgrid';
import { GridContainer } from './GridContainer';
import type { InventoryType } from '@types';
import type { Item } from '@entities/Item';

// GridTitle 类型（简单的标题显示）
class GridTitle {
  container: PIXI.Container;
  text: PIXI.Text;
  title: string;

  constructor(title: string) {
    this.title = title;
    this.container = new PIXI.Container();

    this.text = new PIXI.Text(title, {
      fontSize: 16,
      fill: 0xffffff,
      fontWeight: 'bold'
    });

    this.text.y = 8;
    this.container.addChild(this.text);
  }

  setEnabled(enabled: boolean): void {
    this.container.visible = enabled;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}

/**
 * Inventory配置选项
 */
interface InventoryOptions {
  title: string;
  type: InventoryType;  // 1=玩家盒, 0=战利品箱, 2=地面容器
  scrollable?: boolean | number;  // true=玩家盒, false=战利品箱, 2=地面容器
  countable?: boolean;
  cellSize?: number;
}

export class Inventory {
  // ========== 基础属性 ==========
  title: string;
  container: PIXI.Container;
  type: InventoryType;

  // ========== 组件容器 ==========
  contents: { [key: string]: GridTitle | Subgrid | GridContainer } = {};

  // ========== 功能标志 ==========
  countable: boolean;
  scrollable: boolean | number;  // true=玩家盒, false=战利品箱, 2=地面容器
  enabled: boolean = true;

  // ========== 滚动相关 ==========
  baseY: number = 0;         // 滚动偏移
  maxHeight: number = 128;   // 最大高度（用于滚动）

  // ========== 父级引用 ==========
  parentRegion: any | null = null;

  // ========== 搜索相关 ==========
  private currentSearchItem: Item | null = null;
  private searchTimer: number = 0;

  // ========== 默认配置 ==========
  private readonly DEFAULT_CELL_SIZE = 60;

  constructor(options: InventoryOptions) {
    this.title = options.title;
    this.type = options.type;
    this.scrollable = options.scrollable ?? (options.type === 1);
    this.countable = options.countable ?? true;

    this.container = new PIXI.Container();

    // 根据类型初始化内容
    this.initContent(options.cellSize || this.DEFAULT_CELL_SIZE);
  }

  // ========== 初始化方法 ==========

  /**
   * 初始化内容（根据Inventory类型创建不同布局）
   */
  private initContent(cellSize: number): void {
    if (this.type === 1) {
      // 玩家盒子布局
      this.initPlayerInventory(cellSize);
    } else if (this.type === 0) {
      // 战利品箱布局
      this.initLootInventory(cellSize);
    } else if (this.type === 2) {
      // 地面容器布局
      this.initGroundInventory(cellSize);
    }

    this.refreshUI();
  }

  /**
   * 初始化玩家盒子
   */
  private initPlayerInventory(cellSize: number): void {
    let yOffset = 0;
    const spacing = 10;

    const gridConfigs = [
      // 武器槽
      { type: 'GridTitle', name: 'weaponTitle', title: '武器' },
      {
        type: 'Grid',
        name: 'PrimaryWeapon1',
        accept: ['gunRifle', 'gunSMG', 'gunShotgun', 'gunLMG', 'gunSniper'],
        size: { width: 5, height: 2 },
        cellSize: cellSize,
        aspect: 2.0,
        fullfill: true
      },
      {
        type: 'Grid',
        name: 'PrimaryWeapon2',
        accept: ['gunRifle', 'gunSMG', 'gunShotgun', 'gunLMG', 'gunSniper'],
        size: { width: 5, height: 2 },
        cellSize: cellSize,
        aspect: 2.0,
        fullfill: true
      },
      {
        type: 'Grid',
        name: 'Secondary',
        accept: ['gunPistol'],
        size: { width: 3, height: 2 },
        cellSize: cellSize,
        aspect: 2.0,
        fullfill: true
      },
      {
        type: 'Grid',
        name: 'Melee',
        accept: ['knife'],
        size: { width: 2, height: 2 },
        cellSize: cellSize,
        aspect: 2.0,
        fullfill: true
      },

      // 装备槽
      { type: 'GridTitle', name: 'equipmentTitle', title: '装备' },
      {
        type: 'Grid',
        name: 'Helmet',
        accept: ['helmet'],
        size: { width: 2, height: 2 },
        cellSize: cellSize,
        fullfill: true
      },
      {
        type: 'Grid',
        name: 'Armor',
        accept: ['armor'],
        size: { width: 3, height: 3 },
        cellSize: cellSize,
        fullfill: true
      },

      // 胸挂
      { type: 'GridTitle', name: 'chestRigTitle', title: '胸挂' },
      {
        type: 'Grid',
        name: 'ChestRig',
        accept: ['chest'],
        size: { width: 4, height: 2 },
        cellSize: cellSize,
        fullfill: true
      },
      {
        type: 'GridContainer',
        name: 'ContainerChestRigs',
        layout: [],
        cellSize: cellSize
      },

      // 口袋
      { type: 'GridTitle', name: 'pocketTitle', title: '口袋' },
      {
        type: 'GridContainer',
        name: 'pocket',
        layout: [[4, 1, 0, 0]],
        cellSize: cellSize
      },

      // 背包
      { type: 'GridTitle', name: 'backpackTitle', title: '背包' },
      {
        type: 'Grid',
        name: 'Backpack',
        accept: ['bag'],
        size: { width: 5, height: 5 },
        cellSize: cellSize,
        fullfill: true
      },
      {
        type: 'GridContainer',
        name: 'ContainerBackpack',
        layout: [],
        cellSize: cellSize
      },

      // 安全箱
      { type: 'GridTitle', name: 'secureTitle', title: '安全箱' },
      {
        type: 'GridContainer',
        name: 'ContainerSecure',
        layout: [[3, 3, 0, 0]],
        cellSize: cellSize,
        rejectTypes: [
          // 武器类型
          'gunRifle',
          'gunSMG',
          'gunShotgun',
          'gunLMG',
          'gunMP',
          'gunSniper',
          'gunPistol',
          // 装备类型
          'armor',
          'helmet',
          'bag',
          'chest',
          'knife',
          // 配件类型
          'accForeGrip',
          'accSight',
          'accMuzzle',
          'accStock',
          'accMagazine',
          'accBarrel'
        ]
      }
    ];

    // 创建所有组件
    for (const config of gridConfigs) {
      let component: GridTitle | Subgrid | GridContainer;

      if (config.type === 'GridTitle') {
        component = new GridTitle(config.title!);
      } else if (config.type === 'Grid') {
        const subgrid = new Subgrid({
          size: config.size!,
          cellSize: config.cellSize!,
          aspect: config.aspect || 1,
          fullfill: config.fullfill || false,
          acceptTypes: config.accept || [],
          title: config.name
        });
        subgrid.parentRegion = this;

        // 设置背包/胸挂的回调
        if (config.name === 'ChestRig') {
          this.setupChestRigCallbacks(subgrid);
        } else if (config.name === 'Backpack') {
          this.setupBackpackCallbacks(subgrid);
        }

        component = subgrid;
      } else {
        // GridContainer
        const gridContainer = new GridContainer({
          title: config.name,
          layout: config.layout! as [number, number, number, number][],
          cellSize: config.cellSize!,
          rejectTypes: config.rejectTypes || []
        });
        gridContainer.parentRegion = this;
        component = gridContainer;
      }

      component.container.y = yOffset;
      this.contents[config.name] = component;
      this.container.addChild(component.container);

      // 计算下一个组件的Y偏移
      if (config.type === 'GridTitle') {
        yOffset += 30;
      } else if (config.type === 'Grid') {
        const pixelHeight = config.size!.height * config.cellSize!;
        yOffset += pixelHeight + spacing;
      } else {
        // GridContainer - 动态计算高度
        const gridContainer = component as GridContainer;
        const { height } = gridContainer.getPixelSize();
        yOffset += height + spacing;
      }
    }
  }

  /**
   * 初始化战利品箱
   */
  private initLootInventory(cellSize: number): void {
    // 简单的6x8网格
    const subgrid = new Subgrid({
      size: { width: 6, height: 8 },
      cellSize: cellSize,
      title: 'LootGrid'
    });
    subgrid.parentRegion = this;

    this.contents['LootGrid'] = subgrid;
    this.container.addChild(subgrid.container);
  }

  /**
   * 初始化地面容器
   */
  private initGroundInventory(cellSize: number): void {
    // 大型网格用于地面物品
    const subgrid = new Subgrid({
      size: { width: 12, height: 12 },
      cellSize: cellSize,
      title: 'GroundGrid'
    });
    subgrid.parentRegion = this;

    this.contents['GroundGrid'] = subgrid;
    this.container.addChild(subgrid.container);
  }

  // ========== 回调设置方法 ==========

  /**
   * 设置胸挂的回调
   */
  private setupChestRigCallbacks(subgrid: Subgrid): void {
    const containerChestRigs = this.contents['ContainerChestRigs'] as GridContainer;
    if (!containerChestRigs) return;

    // 胸挂装备时
    subgrid.onItemDraggedIn = (item, _col, _row) => {
      containerChestRigs.setAssociatedItem(item);
      containerChestRigs.applyItemLayout(item);
      this.refreshUI();
    };

    // 胸挂卸下时
    subgrid.onItemDraggedOut = (item) => {
      containerChestRigs.saveSubgridsToItem(item);
      containerChestRigs.setAssociatedItem(null);
      containerChestRigs.layout = [];
      containerChestRigs.initSubgrids();
      this.refreshUI();
    };
  }

  /**
   * 设置背包的回调
   */
  private setupBackpackCallbacks(subgrid: Subgrid): void {
    const containerBackpack = this.contents['ContainerBackpack'] as GridContainer;
    if (!containerBackpack) return;

    // 背包装备时
    subgrid.onItemDraggedIn = (item, _col, _row) => {
      containerBackpack.setAssociatedItem(item);
      containerBackpack.applyItemLayout(item);
      this.refreshUI();
    };

    // 背包卸下时
    subgrid.onItemDraggedOut = (item) => {
      containerBackpack.saveSubgridsToItem(item);
      containerBackpack.setAssociatedItem(null);
      containerBackpack.layout = [];
      containerBackpack.initSubgrids();
      this.refreshUI();
    };
  }

  // ========== UI更新方法 ==========

  /**
   * 刷新UI布局
   */
  refreshUI(): void {
    let yOffset = 0;
    const spacing = 10;

    for (const key of Object.keys(this.contents)) {
      const component = this.contents[key];
      component.container.y = yOffset;

      // 计算下一个组件的Y偏移
      if (component instanceof GridTitle) {
        yOffset += 30;
      } else if (component instanceof Subgrid) {
        const pixelHeight = component.height * component.cellSize;
        yOffset += pixelHeight + spacing;
      } else if (component instanceof GridContainer) {
        const { height } = component.getPixelSize();
        yOffset += height + spacing;
      }
    }
  }

  // ========== 物品管理方法 ==========

  /**
   * 获取所有物品
   */
  getAllItems(): Item[] {
    const allItems: Item[] = [];

    for (const component of Object.values(this.contents)) {
      if (component instanceof Subgrid) {
        allItems.push(...component.getAllItems());
      } else if (component instanceof GridContainer) {
        allItems.push(...component.getAllItems());
      }
    }

    return allItems;
  }

  /**
   * 添加物品（自动寻找合适的网格）
   */
  addItem(item: Item): boolean {
    for (const component of Object.values(this.contents)) {
      if (component instanceof Subgrid) {
        if (component.addItem(item)) {
          return true;
        }
      } else if (component instanceof GridContainer) {
        if (component.addItem(item)) {
          return true;
        }
      }
    }
    return false;
  }

  // ========== 搜索系统方法 ==========

  /**
   * 更新（每帧调用，用于搜索动画）
   */
  update(): void {
    if (!this.enabled) {
      this.currentSearchItem = null;
      return;
    }

    // TODO: 实现搜索系统
    // if (需要搜索) {
    //   寻找下一个未搜索的物品
    //   更新搜索计时器
    //   显示放大镜动画
    // }
  }

  // ========== 状态控制方法 ==========

  /**
   * 设置启用状态
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    for (const component of Object.values(this.contents)) {
      component.setEnabled(enabled);
    }

    this.container.visible = enabled;
  }

  /**
   * 获取启用状态
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  // ========== 销毁方法 ==========

  /**
   * 获取所有Subgrid（包括GridContainer中的）
   */
  getAllSubgrids(): Subgrid[] {
    const subgrids: Subgrid[] = [];

    for (const component of Object.values(this.contents)) {
      if (component instanceof Subgrid) {
        subgrids.push(component);
      } else if (component instanceof GridContainer) {
        // GridContainer包含多个subgrid
        subgrids.push(...component.getAllSubgrids());
      }
    }

    return subgrids;
  }

  /**
   * 销毁
   */
  destroy(): void {
    for (const component of Object.values(this.contents)) {
      component.destroy();
    }

    this.contents = {};
    this.container.destroy({ children: true });
  }
}
