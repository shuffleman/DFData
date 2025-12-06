import * as PIXI from 'pixi.js';
import { DataManager } from '@core/DataManager';
import { DragDropSystem } from '@core/DragDropSystem';
import { PlayerArea } from '@components/PlayerArea';
import { LootArea } from '@components/LootArea';
import { ControlPanel } from '@components/ControlPanel';
import type { GameConfig } from '@types/index';

/**
 * 游戏主类
 * 管理整个游戏的生命周期和各个组件
 */
export class Game {
  private app: PIXI.Application;
  private config: GameConfig;
  private dataManager: DataManager;
  private dragDropSystem: DragDropSystem;

  // UI组件
  private playerArea: PlayerArea | null = null;
  private lootArea: LootArea | null = null;
  private controlPanel: ControlPanel | null = null;

  private initialized: boolean = false;

  constructor(config: GameConfig) {
    this.config = config;

    // 创建PixiJS应用
    this.app = new PIXI.Application();

    // 创建数据管理器
    this.dataManager = new DataManager();

    // 创建拖拽系统
    this.dragDropSystem = new DragDropSystem(this.app);
  }

  /**
   * 初始化游戏
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('正在初始化游戏...');

    try {
      // 初始化PixiJS
      await this.app.init({
        width: this.config.width,
        height: this.config.height,
        backgroundColor: this.config.backgroundColor,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      // 添加canvas到DOM
      const appDiv = document.getElementById('app');
      if (appDiv) {
        // 移除加载界面
        const loading = document.getElementById('loading');
        if (loading) {
          loading.remove();
        }

        appDiv.appendChild(this.app.canvas);
      }

      // 加载游戏数据
      console.log('正在加载游戏数据...');
      await this.dataManager.loadAllData();

      // 创建UI
      this.createUI();

      // 初始化测试数据
      this.initializeTestData();

      this.initialized = true;
      console.log('游戏初始化完成!');
    } catch (error) {
      console.error('游戏初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建UI
   */
  private createUI(): void {
    const { width, height } = this.config;

    // 计算各区域宽度
    const playerAreaWidth = (width * this.config.playerAreaWidth) / 100;
    const lootAreaWidth = (width * this.config.lootAreaWidth) / 100;
    const controlPanelWidth = (width * this.config.controlPanelWidth) / 100;

    // 创建玩家区域
    this.playerArea = new PlayerArea(
      playerAreaWidth,
      height,
      this.config.cellSize,
      this.dragDropSystem
    );
    this.playerArea.x = 0;
    this.playerArea.y = 0;
    this.app.stage.addChild(this.playerArea);

    // 创建战利品区域
    this.lootArea = new LootArea(
      lootAreaWidth,
      height,
      this.config.cellSize,
      this.config.maxTabs,
      this.dragDropSystem
    );
    this.lootArea.x = playerAreaWidth;
    this.lootArea.y = 0;
    this.app.stage.addChild(this.lootArea);

    // 创建控制面板
    this.controlPanel = new ControlPanel(controlPanelWidth, height);
    this.controlPanel.x = playerAreaWidth + lootAreaWidth;
    this.controlPanel.y = 0;
    this.app.stage.addChild(this.controlPanel);
  }

  /**
   * 初始化测试数据
   */
  private initializeTestData(): void {
    // 在玩家背包中添加一些随机物品用于测试
    if (this.playerArea) {
      const backpack = this.playerArea.getBackpackContainer();
      const testItems = this.dataManager.getRandomItems(5);

      testItems.forEach(item => {
        backpack.addItem(item);
      });

      console.log(`已添加 ${testItems.length} 个测试物品到背包`);
    }

    // 在地面容器中添加一些随机物品
    if (this.lootArea) {
      const groundItems = this.dataManager.getRandomItems(10);

      this.lootArea.addLootSource({
        id: 'ground',
        type: 'ground' as any,
        name: '地面容器',
        items: groundItems.map(item => item.data),
        locked: true,
      });

      console.log(`已添加 ${groundItems.length} 个测试物品到地面容器`);
    }
  }

  /**
   * 启动游戏循环
   */
  start(): void {
    if (!this.initialized) {
      console.error('游戏尚未初始化，无法启动');
      return;
    }

    console.log('游戏已启动');

    // PixiJS的渲染循环会自动运行
    // 如果需要游戏逻辑更新，可以添加ticker
    // this.app.ticker.add((delta) => {
    //   this.update(delta);
    // });
  }

  /**
   * 更新游戏逻辑（每帧调用）
   */
  private update(delta: number): void {
    // 这里可以添加每帧需要更新的逻辑
  }

  /**
   * 获取数据管理器
   */
  getDataManager(): DataManager {
    return this.dataManager;
  }

  /**
   * 获取拖拽系统
   */
  getDragDropSystem(): DragDropSystem {
    return this.dragDropSystem;
  }

  /**
   * 销毁游戏
   */
  destroy(): void {
    if (this.playerArea) {
      this.playerArea.destroy();
    }

    if (this.lootArea) {
      this.lootArea.destroy();
    }

    if (this.controlPanel) {
      this.controlPanel.destroy();
    }

    this.app.destroy(true);
    this.initialized = false;
  }
}
