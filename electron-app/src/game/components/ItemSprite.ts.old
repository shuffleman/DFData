import * as PIXI from 'pixi.js';
import { Item } from '@entities/Item';
import type { DragDropSystem } from '@core/DragDropSystem';

/**
 * 物品精灵组件
 * 负责物品的可视化展示和交互
 */
export class ItemSprite extends PIXI.Container {
  public readonly item: Item;
  private background: PIXI.Graphics;
  private imageSprite: PIXI.Sprite | null = null;
  private nameText: PIXI.Text | null = null;
  private cellSize: number;
  private dragDropSystem: DragDropSystem | null = null;
  private sourceTargetId: string = '';

  constructor(item: Item, cellSize: number) {
    super();

    this.item = item;
    this.cellSize = cellSize;

    // 设置交互
    this.eventMode = 'static';
    this.cursor = 'pointer';

    // 创建背景
    this.background = new PIXI.Graphics();
    this.addChild(this.background);

    // 绘制背景
    this.drawBackground();

    // 加载物品图片
    this.loadImage();

    // 设置大小
    this.width = item.width * cellSize;
    this.height = item.height * cellSize;
  }

  /**
   * 绘制背景
   */
  private drawBackground(): void {
    const width = this.item.width * this.cellSize;
    const height = this.item.height * this.cellSize;

    // 根据品质设置颜色
    const grade = this.item.data.grade || 0;
    const colors = [
      0x666666, // 0级 - 灰色
      0x808080, // 1级 - 浅灰
      0x00ff00, // 2级 - 绿色
      0x0000ff, // 3级 - 蓝色
      0x9b00ff, // 4级 - 紫色
      0xffa500, // 5级 - 橙色
      0xffd700, // 6级 - 金色
    ];

    const color = colors[Math.min(grade, colors.length - 1)];

    this.background.clear();
    this.background.beginFill(color, 0.3);
    this.background.lineStyle(2, color, 0.8);
    this.background.drawRect(0, 0, width, height);
    this.background.endFill();

    // 绘制边角装饰
    this.background.lineStyle(2, color, 1);
    this.background.moveTo(5, 0);
    this.background.lineTo(0, 0);
    this.background.lineTo(0, 5);

    this.background.moveTo(width - 5, 0);
    this.background.lineTo(width, 0);
    this.background.lineTo(width, 5);

    this.background.moveTo(0, height - 5);
    this.background.lineTo(0, height);
    this.background.lineTo(5, height);

    this.background.moveTo(width - 5, height);
    this.background.lineTo(width, height);
    this.background.lineTo(width, height - 5);
  }

  /**
   * 加载物品图片
   */
  private async loadImage(): Promise<void> {
    const pictureUrl = this.item.picture;

    if (!pictureUrl) {
      // 如果没有图片，显示文字
      this.createNameText();
      return;
    }

    try {
      const texture = await PIXI.Assets.load(pictureUrl);
      this.imageSprite = new PIXI.Sprite(texture);

      // 计算缩放以适应单元格
      const width = this.item.width * this.cellSize;
      const height = this.item.height * this.cellSize;
      const padding = 10;

      const scaleX = (width - padding * 2) / texture.width;
      const scaleY = (height - padding * 2) / texture.height;
      const scale = Math.min(scaleX, scaleY, 1); // 不放大，只缩小

      this.imageSprite.scale.set(scale);

      // 居中
      this.imageSprite.x = (width - this.imageSprite.width) / 2;
      this.imageSprite.y = (height - this.imageSprite.height) / 2;

      this.addChild(this.imageSprite);
    } catch (error) {
      console.warn(`无法加载物品图片: ${pictureUrl}`, error);
      this.createNameText();
    }
  }

  /**
   * 创建名称文本（fallback）
   */
  private createNameText(): void {
    const width = this.item.width * this.cellSize;
    const height = this.item.height * this.cellSize;

    this.nameText = new PIXI.Text(this.item.name, {
      fontSize: 12,
      fill: 0xffffff,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: width - 10,
    });

    this.nameText.x = (width - this.nameText.width) / 2;
    this.nameText.y = (height - this.nameText.height) / 2;

    this.addChild(this.nameText);
  }

  /**
   * 设置拖拽系统
   */
  setDragDropSystem(system: DragDropSystem, targetId: string): void {
    this.dragDropSystem = system;
    this.sourceTargetId = targetId;

    // 添加拖拽事件
    this.on('pointerdown', this.onPointerDown, this);
  }

  /**
   * 指针按下事件
   */
  private onPointerDown(event: PIXI.FederatedPointerEvent): void {
    if (!this.dragDropSystem || !this.sourceTargetId) return;

    // 停止事件传播
    event.stopPropagation();

    // 开始拖拽
    this.dragDropSystem.startDrag(
      this.item,
      this,
      this.sourceTargetId,
      event
    );
  }

  /**
   * 高亮显示
   */
  highlight(enable: boolean): void {
    if (enable) {
      this.background.tint = 0xffff00;
      this.alpha = 1;
    } else {
      this.background.tint = 0xffffff;
      this.alpha = 1;
    }
  }

  /**
   * 销毁
   */
  override destroy(options?: boolean | PIXI.IDestroyOptions): void {
    this.off('pointerdown', this.onPointerDown, this);

    if (this.imageSprite) {
      this.imageSprite.destroy();
    }

    if (this.nameText) {
      this.nameText.destroy();
    }

    this.background.destroy();

    super.destroy(options);
  }
}
