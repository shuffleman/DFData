import * as PIXI from 'pixi.js';
import { GridContainer } from './GridContainer';
import { DragDropSystem } from '@core/DragDropSystem';
import type { LootSource, LootSourceType } from '@types/index';
import { Item } from '@entities/Item';

/**
 * 战利品区域组件
 * 管理多个战利品来源的tab界面
 */
export class LootArea extends PIXI.Container {
  private width: number;
  private height: number;
  private cellSize: number;
  private maxTabs: number;
  private dragDropSystem: DragDropSystem;

  private background: PIXI.Graphics;
  private tabContainer: PIXI.Container;
  private contentContainer: PIXI.Container;

  private lootSources: Map<string, LootSource> = new Map();
  private tabButtons: Map<string, PIXI.Container> = new Map();
  private gridContainers: Map<string, GridContainer> = new Map();
  private activeSourceId: string | null = null;

  constructor(width: number, height: number, cellSize: number, maxTabs: number, dragDropSystem: DragDropSystem) {
    super();

    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.maxTabs = maxTabs;
    this.dragDropSystem = dragDropSystem;

    // 创建背景
    this.background = new PIXI.Graphics();
    this.addChild(this.background);

    // 创建tab容器
    this.tabContainer = new PIXI.Container();
    this.addChild(this.tabContainer);

    // 创建内容容器
    this.contentContainer = new PIXI.Container();
    this.contentContainer.y = 50; // 留出tab高度
    this.addChild(this.contentContainer);

    this.draw();

    // 添加固定的地面容器
    this.addLootSource({
      id: 'ground',
      type: 'ground' as LootSourceType,
      name: '地面容器',
      items: [],
      locked: true,
    });
  }

  /**
   * 绘制背景
   */
  private draw(): void {
    this.background.clear();
    this.background.beginFill(0x1a1a1a, 0.9);
    this.background.lineStyle(2, 0x444444);
    this.background.drawRect(0, 0, this.width, this.height);
    this.background.endFill();
  }

  /**
   * 添加战利品来源
   */
  addLootSource(source: LootSource): boolean {
    // 检查是否达到最大tab数量
    if (!source.locked && this.lootSources.size >= this.maxTabs) {
      console.warn('已达到最大Tab数量');
      return false;
    }

    // 添加来源
    this.lootSources.set(source.id, source);

    // 创建tab按钮
    this.createTabButton(source);

    // 创建网格容器
    const gridContainer = new GridContainer(
      `loot_${source.id}`,
      {
        gridWidth: 15,
        gridHeight: 40,
        cellSize: this.cellSize,
        padding: 10,
      }
    );
    gridContainer.setDragDropSystem(this.dragDropSystem);
    gridContainer.visible = false;
    this.contentContainer.addChild(gridContainer);
    this.gridContainers.set(source.id, gridContainer);

    // 添加物品
    source.items.forEach(itemData => {
      const item = new Item(itemData);
      gridContainer.addItem(item);
    });

    // 如果是第一个，设为活动
    if (this.lootSources.size === 1) {
      this.switchTab(source.id);
    }

    return true;
  }

  /**
   * 移除战利品来源
   */
  removeLootSource(sourceId: string): boolean {
    const source = this.lootSources.get(sourceId);
    if (!source || source.locked) {
      return false;
    }

    // 移除tab按钮
    const tabButton = this.tabButtons.get(sourceId);
    if (tabButton) {
      this.tabContainer.removeChild(tabButton);
      tabButton.destroy();
      this.tabButtons.delete(sourceId);
    }

    // 移除网格容器
    const gridContainer = this.gridContainers.get(sourceId);
    if (gridContainer) {
      this.contentContainer.removeChild(gridContainer);
      gridContainer.destroy();
      this.gridContainers.delete(sourceId);
    }

    // 移除来源
    this.lootSources.delete(sourceId);

    // 如果删除的是活动tab，切换到第一个
    if (this.activeSourceId === sourceId) {
      const firstSource = Array.from(this.lootSources.keys())[0];
      if (firstSource) {
        this.switchTab(firstSource);
      }
    }

    // 重新布局tab按钮
    this.layoutTabButtons();

    return true;
  }

  /**
   * 创建tab按钮
   */
  private createTabButton(source: LootSource): void {
    const button = new PIXI.Container();
    button.eventMode = 'static';
    button.cursor = 'pointer';

    // 背景
    const bg = new PIXI.Graphics();
    bg.beginFill(0x333333);
    bg.lineStyle(1, 0x666666);
    bg.drawRoundedRect(0, 0, 120, 40, 5);
    bg.endFill();
    button.addChild(bg);

    // 文本
    const text = new PIXI.Text(source.name, {
      fontSize: 14,
      fill: 0xffffff,
    });
    text.x = 10;
    text.y = 10;
    button.addChild(text);

    // 如果不是锁定的，添加关闭按钮
    if (!source.locked) {
      const closeBtn = new PIXI.Text('✕', {
        fontSize: 18,
        fill: 0xff0000,
      });
      closeBtn.x = 100;
      closeBtn.y = 8;
      closeBtn.eventMode = 'static';
      closeBtn.cursor = 'pointer';
      closeBtn.on('pointerdown', (e) => {
        e.stopPropagation();
        this.removeLootSource(source.id);
      });
      button.addChild(closeBtn);
    }

    // 点击事件
    button.on('pointerdown', () => {
      this.switchTab(source.id);
    });

    this.tabButtons.set(source.id, button);
    this.tabContainer.addChild(button);

    this.layoutTabButtons();
  }

  /**
   * 布局tab按钮
   */
  private layoutTabButtons(): void {
    let x = 10;
    this.tabButtons.forEach(button => {
      button.x = x;
      button.y = 5;
      x += 130; // 120 + 10 spacing
    });
  }

  /**
   * 切换tab
   */
  switchTab(sourceId: string): void {
    if (!this.lootSources.has(sourceId)) return;

    // 隐藏所有容器
    this.gridContainers.forEach(container => {
      container.visible = false;
    });

    // 显示选中的容器
    const gridContainer = this.gridContainers.get(sourceId);
    if (gridContainer) {
      gridContainer.visible = true;
    }

    // 更新tab按钮样式
    this.tabButtons.forEach((button, id) => {
      const bg = button.children[0] as PIXI.Graphics;
      bg.clear();

      if (id === sourceId) {
        bg.beginFill(0x555555);
        bg.lineStyle(2, 0x888888);
      } else {
        bg.beginFill(0x333333);
        bg.lineStyle(1, 0x666666);
      }

      bg.drawRoundedRect(0, 0, 120, 40, 5);
      bg.endFill();
    });

    this.activeSourceId = sourceId;
  }

  /**
   * 自动清理空的非锁定tab
   */
  autoCleanupEmptyTabs(): void {
    const toRemove: string[] = [];

    this.lootSources.forEach((source, id) => {
      if (!source.locked) {
        const gridContainer = this.gridContainers.get(id);
        if (gridContainer && gridContainer.getAllItems().length === 0) {
          toRemove.push(id);
        }
      }
    });

    toRemove.forEach(id => this.removeLootSource(id));
  }

  /**
   * 销毁
   */
  override destroy(options?: boolean | PIXI.IDestroyOptions): void {
    this.gridContainers.forEach(container => container.destroy());
    this.tabButtons.forEach(button => button.destroy());

    this.background.destroy();
    this.tabContainer.destroy();
    this.contentContainer.destroy();

    super.destroy(options);
  }
}
