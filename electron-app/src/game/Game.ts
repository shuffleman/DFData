/**
 * Game - 游戏主类
 * 游戏的核心控制器，管理 PIXI 应用、数据加载、区域管理和游戏流程
 */

import * as PIXI from 'pixi.js';
import { DataManager } from '@managers/DataManager';
import { Region } from '@core/Region';
import { Subgrid } from '@core/Subgrid';
import { Item } from '@entities/Item';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GAME_DEFAULT_CONFIG,
  GAME_RESOURCE_CDN,
  REALTIME_VALUE,
  getResponsiveLayout
} from './config';

// 声明全局 window.game
declare global {
  interface Window {
    game: Game;
  }
}

/**
 * Game 类
 */
export class Game {
  // ========== PIXI 应用 ==========
  app: PIXI.Application;

  // ========== 数据管理器 ==========
  dataManager: DataManager;

  // ========== 区域管理 ==========
  playerRegion: Region | null = null;
  spoilsRegion: Region | null = null;
  controlPanelRegion: Region | null = null;

  // ========== 游戏状态 ==========
  isGameStarted: boolean = false;
  initialized: boolean = false;

  // ========== 配置 ==========
  config: typeof GAME_DEFAULT_CONFIG = { ...GAME_DEFAULT_CONFIG };

  // ========== 网格引用 ==========
  grids: Subgrid[] = [];  // 用于拖拽时查找目标网格

  // ========== 默认战利品区域配置 ==========
  defaultSpoilsRegionConfig: any[] = [];

  constructor() {
    // 初始化 PIXI 应用（PixiJS v7构造函数传参）
    this.app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      antialias: true,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1
    });

    // 初始化数据管理器
    this.dataManager = new DataManager();

    // 初始化默认战利品区域配置
    this.initDefaultSpoilsRegionConfig();

    // 设置全局引用
    window.game = this;

    console.log('[Game] 游戏实例已创建');
  }

  /**
   * 初始化默认战利品区域配置
   */
  private initDefaultSpoilsRegionConfig(): void {
    this.defaultSpoilsRegionConfig = [
      { type: 'groundContainer', title: '地面容器', width: 15, height: 8 },
      { type: 'spoilsBox', title: '战利品1', width: 7, height: 8 },
      { type: 'spoilsBox', title: '战利品2', width: 7, height: 8 },
      { type: 'spoilsBox', title: '战利品3', width: 7, height: 8 }
    ];
  }

  /**
   * 初始化游戏
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('[Game] 正在初始化游戏...');

    try {
      // 创建 PIXI 应用
      await this.createPixiApp();

      // 加载数据管理器资源
      await this.loadGameData();

      // 初始化 UI
      this.initGameUI();

      // 初始化游戏组件（区域）
      this.initGameComponents();

      this.initialized = true;
      console.log('[Game] 游戏初始化完成!');
    } catch (error) {
      console.error('[Game] 游戏初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建 PIXI 应用
   */
  async createPixiApp(): Promise<void> {
    const appDiv = document.getElementById('app');
    if (appDiv) {
      // 移除加载界面
      const loading = document.getElementById('loading');
      if (loading) {
        loading.remove();
      }

      // PixiJS v7 使用 app.view
      appDiv.appendChild(this.app.view as HTMLCanvasElement);

      // 设置app元素样式
      appDiv.style.cssText = `
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #000;
        overflow: hidden;
      `;

      // 自动调整canvas大小保持16:9
      const resizeCanvas = () => {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const aspectRatio = 16 / 9;

        let width = windowWidth;
        let height = width / aspectRatio;

        if (height > windowHeight) {
          height = windowHeight;
          width = height * aspectRatio;
        }

        this.app.renderer.resize(width, height);
        (this.app.view as HTMLCanvasElement).style.width = `${width}px`;
        (this.app.view as HTMLCanvasElement).style.height = `${height}px`;

        // 更新所有区域的布局
        this.updateAllRegionsLayout();
      };

      // 初始调整和监听窗口大小变化
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
    }

    // 添加更新循环
    this.app.ticker.add(() => {
      if (!this.spoilsRegion) return;
      for (const inventory of this.spoilsRegion.inventories) {
        if (inventory.update) {
          inventory.update();
        }
      }
    });

    console.log('[Game] PIXI 应用创建完成');
  }

  /**
   * 加载游戏数据
   */
  async loadGameData(): Promise<void> {
    console.log('[Game] 正在加载游戏数据...');

    // 根据配置选择数据源
    const cdnType = this.config.resource_cdn;
    const resourceConfig = GAME_RESOURCE_CDN[cdnType];
    const valuesURL = REALTIME_VALUE[this.config.realtime_value];

    const success = await this.dataManager.loadResources({
      resourceCDN: cdnType,
      realtimeValue: this.config.realtime_value,
      itemInfoURLs: resourceConfig.item_info,
      gunSlotMapURL: resourceConfig.gunSlotMap,
      dataJsonURL: resourceConfig.dataJson,
      valuesURL: valuesURL
    });

    if (!success) {
      throw new Error('数据加载失败');
    }

    console.log('[Game] 游戏数据加载完成');
  }

  /**
   * 初始化游戏 UI
   */
  initGameUI(): void {
    // 暂时不需要背景
    console.log('[Game] 游戏 UI 初始化完成');
  }

  /**
   * 初始化游戏组件（区域）
   */
  initGameComponents(): void {
    const layout = getResponsiveLayout();

    // 个人物资区域
    this.playerRegion = new Region(
      { x: layout.playerRegion.x, y: layout.playerRegion.y },
      {
        title: '个人物资',
        width: layout.playerRegion.width,
        height: layout.playerRegion.height,
        titleColor: 0xffffff,
        titleAlpha: 0.3,
        componentWidth: layout.playerRegion.componentWidth,
        titleHeight: layout.playerRegion.titleHeight,
        backgroundColor: 0xffffff,
        backgroundAlpha: 0.1,
        countable: true
      }
    );
    this.playerRegion.addInventory(1, false, '个人背包');
    this.playerRegion.switchTo(0);
    this.app.stage.addChild(this.playerRegion.container);

    // 控制面板区域（暂时只有标题，后续添加组件）
    this.controlPanelRegion = new Region(
      { x: layout.controlPanel.x, y: layout.controlPanel.y },
      {
        title: '控制面板',
        width: layout.controlPanel.width,
        height: layout.controlPanel.height,
        titleColor: 0x4a9eff,
        titleAlpha: 0.3,
        componentWidth: layout.controlPanel.componentWidth,
        titleHeight: layout.controlPanel.titleHeight,
        backgroundColor: 0xffffff,
        backgroundAlpha: 0.1,
        countable: false
      }
    );
    this.app.stage.addChild(this.controlPanelRegion.container);

    // 注册所有Subgrid到grids数组
    this.registerAllGrids();

    this.updateAllRegionsLayout();
    console.log('[Game] 游戏组件初始化完成');
  }

  /**
   * 启动游戏（创建战利品区域）
   */
  async startGame(): Promise<void> {
    if (this.isGameStarted) {
      console.warn('[Game] 游戏已经启动');
      return;
    }

    console.log('[Game] 开始游戏...');

    // 如果已有战利品区域，先销毁
    if (this.spoilsRegion) {
      this.spoilsRegion.destroy();
    }

    const layout = getResponsiveLayout();

    // 创建战利品区域
    const region = new Region(
      { x: layout.spoilsRegion.x, y: layout.spoilsRegion.y },
      {
        title: '战利品',
        width: layout.spoilsRegion.width,
        height: layout.spoilsRegion.height,
        titleColor: 0x999999,
        titleAlpha: 0.3,
        componentWidth: layout.spoilsRegion.componentWidth,
        titleHeight: layout.spoilsRegion.titleHeight,
        backgroundColor: 0xffffff,
        backgroundAlpha: 0.1,
        countable: false
      }
    );

    // 使用默认配置加载战利品区域
    this.loadDefaultSpoilsConfig(region);

    region.switchTo(0);
    this.spoilsRegion = region;
    this.app.stage.addChild(region.container);

    this.updateAllRegionsLayout();

    // 重新注册所有网格（包括新创建的spoilsRegion）
    this.registerAllGrids();

    this.isGameStarted = true;

    console.log('[Game] 游戏启动完成');
  }

  /**
   * 使用默认配置加载战利品区域（三角洲行动）
   */
  private loadDefaultSpoilsConfig(region: Region): void {
    console.log('[Game] 使用默认配置初始化战利品区域');

    // 1. 地面容器 (15x8)
    console.log('[Game] 添加地面容器');
    const groundInventory = region.addInventory(2, false, '地面容器');
    this.addTestItemsToInventory(groundInventory, 15);

    // 2. 战利品箱1 (7x8)
    console.log('[Game] 添加战利品箱1');
    const loot1 = region.addInventory(0, false, '战利品箱1');
    this.addTestItemsToInventory(loot1, 10);

    // 3. 战利品箱2 (7x8)
    console.log('[Game] 添加战利品箱2');
    const loot2 = region.addInventory(0, false, '战利品箱2');
    this.addTestItemsToInventory(loot2, 8);

    // 4. 战利品箱3 (7x8)
    console.log('[Game] 添加战利品箱3');
    const loot3 = region.addInventory(0, false, '战利品箱3');
    this.addTestItemsToInventory(loot3, 12);

    // 5. 玩家战利品 (type=3, 没有安全箱)
    console.log('[Game] 添加玩家战利品');
    const playerLoot = region.addInventory(3, false, '敌人战利品');
    // 玩家战利品不添加测试物品，保持空状态

    console.log('[Game] 战利品区域初始化完成，共 ' + region.inventories.length + ' 个标签页');
  }

  /**
   * 添加测试物品到 Inventory
   */
  private addTestItemsToInventory(inventory: any, count: number): void {
    for (let i = 0; i < count; i++) {
      const randomItemData = this.dataManager.getRandomItemWithPreset('default');
      if (randomItemData) {
        const item = new Item(randomItemData);
        inventory.addItem(item);
      }
    }
  }

  /**
   * 注册所有Region中的Subgrid到grids数组（用于拖拽时查找目标网格）
   */
  private registerAllGrids(): void {
    this.grids = [];

    const regions = [this.playerRegion, this.spoilsRegion, this.controlPanelRegion].filter(Boolean);

    for (const region of regions) {
      for (const inventory of region!.inventories) {
        const subgrids = inventory.getAllSubgrids();
        this.grids.push(...subgrids);
      }
    }

    console.log(`[Game] 已注册 ${this.grids.length} 个网格到拖拽系统`);
  }

  /**
   * 工具函数，根据全局坐标查找对应的 Subgrid
   */
  findGrid(x: number, y: number): Subgrid | null {
    for (const subgrid of this.grids.filter((grid) => grid.enabled)) {
      const bounds = subgrid.container.getBounds();
      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      ) {
        return subgrid;
      }
    }
    return null;
  }

  /**
   * 更新所有区域的布局以适应新的屏幕尺寸
   */
  updateAllRegionsLayout(): void {
    const layout = getResponsiveLayout();

    // 更新个人物资区域
    if (this.playerRegion) {
      this.playerRegion.updateLayout(
        { x: layout.playerRegion.x, y: layout.playerRegion.y },
        {
          width: layout.playerRegion.width,
          height: layout.playerRegion.height,
          componentWidth: layout.playerRegion.componentWidth,
          titleHeight: layout.playerRegion.titleHeight
        }
      );
    }

    // 更新战利品区域
    if (this.spoilsRegion) {
      this.spoilsRegion.updateLayout(
        { x: layout.spoilsRegion.x, y: layout.spoilsRegion.y },
        {
          width: layout.spoilsRegion.width,
          height: layout.spoilsRegion.height,
          componentWidth: layout.spoilsRegion.componentWidth,
          titleHeight: layout.spoilsRegion.titleHeight
        }
      );
    }

    // 更新控制面板区域
    if (this.controlPanelRegion) {
      this.controlPanelRegion.updateLayout(
        { x: layout.controlPanel.x, y: layout.controlPanel.y },
        {
          width: layout.controlPanel.width,
          height: layout.controlPanel.height,
          componentWidth: layout.controlPanel.componentWidth,
          titleHeight: layout.controlPanel.titleHeight
        }
      );
    }
  }

  /**
   * 刷新 UI
   */
  refreshUI(): void {
    // 子类可以覆盖此方法添加自定义刷新逻辑
  }

  /**
   * 递归刷新 UI（包括所有子组件）
   */
  refreshUIRecursive(): void {
    this.refreshUI();

    if (this.playerRegion) {
      this.playerRegion.refreshUIRecursive();
    }

    if (this.spoilsRegion) {
      this.spoilsRegion.refreshUIRecursive();
    }

    if (this.controlPanelRegion) {
      this.controlPanelRegion.refreshUIRecursive();
    }
  }

  /**
   * 获取数据管理器
   */
  getDataManager(): DataManager {
    return this.dataManager;
  }

  /**
   * 重置游戏
   */
  resetGame(): void {
    console.log('[Game] 重置游戏...');

    // 销毁战利品区域
    if (this.spoilsRegion) {
      this.spoilsRegion.destroy();
      this.spoilsRegion = null;
    }

    this.isGameStarted = false;
    console.log('[Game] 游戏已重置');
  }

  /**
   * 销毁游戏
   */
  destroy(): void {
    if (this.playerRegion) {
      this.playerRegion.destroy();
    }

    if (this.spoilsRegion) {
      this.spoilsRegion.destroy();
    }

    if (this.controlPanelRegion) {
      this.controlPanelRegion.destroy();
    }

    this.app.destroy(true);
    this.initialized = false;
  }
}
