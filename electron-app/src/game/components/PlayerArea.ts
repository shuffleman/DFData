import * as PIXI from 'pixi.js';
import { Subgrid } from '@core/Subgrid';
import { DragDropSystem } from '@core/DragDropSystem';

/**
 * 玩家区域组件
 * 管理玩家的装备槽位和容器
 */
export class PlayerArea extends PIXI.Container {
  private areaWidth: number;
  private areaHeight: number;
  private cellSize: number;
  private dragDropSystem: DragDropSystem;

  private background: PIXI.Graphics;

  // 容器
  private backpackContainer: Subgrid;
  private chestContainer: Subgrid;
  private pocketsContainer: Subgrid;
  private safeBoxContainer: Subgrid;

  constructor(width: number, height: number, cellSize: number, dragDropSystem: DragDropSystem) {
    super();

    this.areaWidth = width;
    this.areaHeight = height;
    this.cellSize = cellSize;
    this.dragDropSystem = dragDropSystem;

    // 创建背景
    this.background = new PIXI.Graphics();
    this.addChild(this.background);
    this.draw();

    // 创建标题
    const title = new PIXI.Text('玩家装备', {
      fontSize: 20,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    title.x = 10;
    title.y = 10;
    this.addChild(title);

    let yOffset = 50;

    // 创建胸挂容器
    this.chestContainer = this.createContainer('chest', '胸挂', 5, 3, yOffset);
    yOffset += this.chestContainer.height * this.cellSize + 30;

    // 创建背包容器
    this.backpackContainer = this.createContainer('backpack', '背包', 6, 8, yOffset);
    yOffset += this.backpackContainer.height * this.cellSize + 30;

    // 创建口袋容器（5个1×1格子）
    this.pocketsContainer = this.createContainer('pockets', '口袋', 5, 1, yOffset);
    yOffset += this.pocketsContainer.height * this.cellSize + 30;

    // 创建安全箱容器（3×3）
    this.safeBoxContainer = this.createContainer('safebox', '安全箱', 3, 3, yOffset);
  }

  /**
   * 创建容器
   */
  private createContainer(
    id: string,
    name: string,
    gridWidth: number,
    gridHeight: number,
    yPos: number
  ): Subgrid {
    // 创建标签
    const label = new PIXI.Text(name, {
      fontSize: 14,
      fill: 0xaaaaaa,
    });
    label.x = 10;
    label.y = yPos;
    this.addChild(label);

    // 创建Subgrid
    const subgrid = new Subgrid({
      size: { width: gridWidth, height: gridHeight },
      cellSize: this.cellSize,
      title: `player_${id}`,
    });
    subgrid.container.x = 10;
    subgrid.container.y = yPos + 25;
    this.addChild(subgrid.container);

    return subgrid;
  }

  /**
   * 绘制背景
   */
  private draw(): void {
    this.background.clear();
    this.background.beginFill(0x1a1a1a, 0.9);
    this.background.lineStyle(2, 0x444444);
    this.background.drawRect(0, 0, this.areaWidth, this.areaHeight);
    this.background.endFill();
  }

  /**
   * 获取背包容器
   */
  getBackpackContainer(): Subgrid {
    return this.backpackContainer;
  }

  /**
   * 获取胸挂容器
   */
  getChestContainer(): Subgrid {
    return this.chestContainer;
  }

  /**
   * 获取口袋容器
   */
  getPocketsContainer(): Subgrid {
    return this.pocketsContainer;
  }

  /**
   * 获取安全箱容器
   */
  getSafeBoxContainer(): Subgrid {
    return this.safeBoxContainer;
  }

  /**
   * 销毁
   */
  override destroy(options?: boolean | PIXI.IDestroyOptions): void {
    this.background.destroy();
    this.backpackContainer.destroy();
    this.chestContainer.destroy();
    this.pocketsContainer.destroy();
    this.safeBoxContainer.destroy();

    super.destroy(options);
  }
}
