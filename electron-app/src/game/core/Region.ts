/**
 * Region - 区域类
 * 代表一个完整的游戏区域（玩家盒子区域、战利品区域等）
 * 包含标题栏和多个可切换的 Inventory
 */

import * as PIXI from 'pixi.js';
import { Inventory } from './Inventory';
import { Item } from '@entities/Item';

/**
 * Region 配置选项
 */
interface RegionOptions {
  title: string;
  width?: number;
  height?: number;
  titleColor?: number;
  titleAlpha?: number;
  titleHeight?: number;
  backgroundColor?: number;
  backgroundAlpha?: number;
  componentWidth?: number;
  countable: boolean;
}

/**
 * Region 类
 */
export class Region {
  // ========== 基础属性 ==========
  container: PIXI.Container;
  private options: RegionOptions;

  // ========== UI 元素 ==========
  private titleBarBG: PIXI.Graphics | null = null;
  private titleText: PIXI.Text | null = null;
  private contentBG: PIXI.Graphics | null = null;

  // ========== Inventory 管理 ==========
  public readonly inventories: Inventory[] = [];
  public currentInventoryId: number = 0;

  // ========== 组件管理 ==========
  public readonly components: { [key: string]: any } = {};
  private currentComponentPosition: { x: number; y: number } = { x: 12, y: 62 };

  constructor(pos: { x: number; y: number }, options: RegionOptions) {
    this.options = {
      width: 508,
      height: 632,
      titleColor: 0x999999,
      titleAlpha: 0.3,
      titleHeight: 50,
      backgroundColor: 0xffffff,
      backgroundAlpha: 0.1,
      componentWidth: 246,
      ...options
    };

    // 创建容器
    this.container = new PIXI.Container();
    this.container.position.set(pos.x, pos.y);

    // 初始化 UI
    this.initUI();
  }

  // ========== 初始化方法 ==========

  /**
   * 初始化 UI
   */
  private initUI(): void {
    // 标题栏背景
    this.titleBarBG = new PIXI.Graphics();
    this.titleBarBG.beginFill(this.options.titleColor!, this.options.titleAlpha!);
    this.titleBarBG.drawRect(0, 0, this.options.width!, this.options.titleHeight!);
    this.titleBarBG.endFill();
    this.container.addChild(this.titleBarBG);

    // 标题文本
    this.titleText = new PIXI.Text(this.options.title!, {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff,
      fontWeight: 'bold',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowAngle: 0,
      dropShadowDistance: 2
    });
    this.titleText.anchor.set(0.5);
    this.titleText.position.set(56, this.options.titleHeight! / 2);
    this.container.addChild(this.titleText);

    // 内容区背景
    this.contentBG = new PIXI.Graphics();
    this.contentBG.beginFill(this.options.backgroundColor!, this.options.backgroundAlpha!);
    this.contentBG.drawRect(
      0,
      this.options.titleHeight!,
      this.options.width!,
      this.options.height! - this.options.titleHeight!
    );
    this.contentBG.endFill();
    this.container.addChild(this.contentBG);
  }

  // ========== Inventory 管理方法 ==========

  /**
   * 添加一个 Inventory
   * @param type 0=战利品箱, 1=玩家盒, 2=地面容器
   * @param needToInit 是否需要初始化内容
   * @param title Inventory 标题
   */
  addInventory(type: 0 | 1 | 2, needToInit: boolean = true, title: string = ''): Inventory {
    const inventoryTitle = title || `${this.options.title} ${this.inventories.length + 1}`;

    // 根据 type 设置 scrollable 值
    const scrollableValue = type === 1 ? true : type === 2 ? 2 : false;

    const inventory = new Inventory({
      title: inventoryTitle,
      type: type,
      scrollable: scrollableValue,
      countable: this.options.countable
    });

    // 设置位置
    inventory.container.position.set(
      this.options.componentWidth || 0,
      this.options.titleHeight || 0
    );

    this.inventories.push(inventory);
    this.container.addChild(inventory.container);

    // 初始化 Inventory 内容（如果需要）
    if (needToInit) {
      // TODO: 调用 initInventory 工具函数
      // initInventory(inventory, type);
    }

    // 默认禁用（只有当前选中的才启用）
    inventory.setEnabled(false);

    return inventory;
  }

  /**
   * 添加物品到当前激活的 Inventory
   */
  addItem(item: Item): boolean {
    if (this.inventories.length === 0) {
      console.warn('[Region] 没有可用的 Inventory');
      return false;
    }
    return this.inventories[this.currentInventoryId].addItem(item);
  }

  /**
   * 切换到指定的 Inventory
   */
  switchTo(id: number): void {
    if (this.inventories.length === 0 || id >= this.inventories.length || id < 0) {
      return;
    }

    // 禁用当前 Inventory
    this.inventories[this.currentInventoryId].setEnabled(false);

    // 切换到新 Inventory
    this.currentInventoryId = id;
    this.inventories[this.currentInventoryId].setEnabled(true);

    // TODO: 更新切换器 UI
    // this.switcherUI?.updateText(`区域 ${this.currentInventoryId + 1}/${this.inventories.length}`);

    console.log(`[Region] 切换到 Inventory ${id + 1}/${this.inventories.length}`);
  }

  // ========== 组件管理方法 ==========

  /**
   * 添加组件到内容区
   */
  addComponent(name: string, component: any): void {
    const componentInstance = new component();
    this.components[name] = componentInstance;

    componentInstance.container.position.set(
      this.currentComponentPosition.x,
      this.currentComponentPosition.y
    );

    this.currentComponentPosition.y += componentInstance.additiveSize.y + 12;
    this.container.addChild(componentInstance.container);
  }

  // ========== 布局更新方法 ==========

  /**
   * 更新区域的位置和尺寸
   */
  updateLayout(
    pos: { x: number; y: number },
    size?: {
      width?: number;
      height?: number;
      componentWidth?: number;
      titleHeight?: number;
    }
  ): void {
    // 更新容器位置
    this.container.position.set(pos.x, pos.y);

    // 如果提供了尺寸参数，更新尺寸
    if (size) {
      if (size.width !== undefined) this.options.width = size.width;
      if (size.height !== undefined) this.options.height = size.height;
      if (size.componentWidth !== undefined) this.options.componentWidth = size.componentWidth;
      if (size.titleHeight !== undefined) this.options.titleHeight = size.titleHeight;

      // 重新绘制 UI 元素
      if (this.titleBarBG) {
        this.titleBarBG.clear();
        this.titleBarBG.beginFill(this.options.titleColor!, this.options.titleAlpha!);
        this.titleBarBG.drawRect(0, 0, this.options.width!, this.options.titleHeight!);
        this.titleBarBG.endFill();
      }

      if (this.titleText) {
        this.titleText.position.set(56, this.options.titleHeight! / 2);
      }

      if (this.contentBG) {
        this.contentBG.clear();
        this.contentBG.beginFill(this.options.backgroundColor!, this.options.backgroundAlpha!);
        this.contentBG.drawRect(
          0,
          this.options.titleHeight!,
          this.options.width!,
          this.options.height! - this.options.titleHeight!
        );
        this.contentBG.endFill();
      }

      // TODO: 更新所有 Inventory 的尺寸
      // const inventoryWidth = this.options.width! - (this.options.componentWidth || 0);
      // const inventoryHeight = this.options.height! - (this.options.titleHeight || 0);
      // for (const inventory of this.inventories) {
      //   inventory.updateSize(inventoryWidth, inventoryHeight);
      // }

      // 刷新 UI
      this.refreshUIRecursive();
    }
  }

  // ========== UI 刷新方法 ==========

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

    // 只刷新当前激活的 Inventory
    if (this.inventories[this.currentInventoryId]) {
      // TODO: 实现 Inventory.refreshUIRecursive()
      // this.inventories[this.currentInventoryId].refreshUIRecursive();
    }
  }

  // ========== 辅助方法 ==========

  /**
   * 获取区域的全局位置
   */
  getGlobalPosition(): PIXI.Point {
    return this.container.getGlobalPosition();
  }

  /**
   * 销毁区域
   */
  destroy(): void {
    for (const inventory of this.inventories) {
      inventory.destroy();
    }

    for (const component of Object.values(this.components)) {
      if (component.destroy) {
        component.destroy();
      }
    }

    this.container.destroy({ children: true });
  }
}
