import * as PIXI from 'pixi.js';
import type { Item } from '@entities/Item';
import type { GridSystem } from './GridSystem';

/**
 * 拖拽目标接口
 */
export interface DragTarget {
  gridSystem: GridSystem;
  container: PIXI.Container;
  onItemDropped?: (item: Item) => void;
  onItemRemoved?: (item: Item) => void;
}

/**
 * 拖拽系统
 * 管理物品的拖拽操作
 */
export class DragDropSystem {
  private app: PIXI.Application;
  private isDragging: boolean = false;
  private draggedItem: Item | null = null;
  private draggedSprite: PIXI.Container | null = null;
  private sourceTarget: DragTarget | null = null;
  private dragTargets: Map<string, DragTarget> = new Map();

  // 拖拽预览
  private ghostSprite: PIXI.Graphics | null = null;
  private validPlacement: boolean = false;

  constructor(app: PIXI.Application) {
    this.app = app;
  }

  /**
   * 注册拖拽目标
   */
  registerDragTarget(id: string, target: DragTarget): void {
    this.dragTargets.set(id, target);
  }

  /**
   * 取消注册拖拽目标
   */
  unregisterDragTarget(id: string): void {
    this.dragTargets.delete(id);
  }

  /**
   * 开始拖拽物品
   */
  startDrag(
    item: Item,
    sprite: PIXI.Container,
    sourceTargetId: string,
    event: PIXI.FederatedPointerEvent
  ): void {
    const source = this.dragTargets.get(sourceTargetId);
    if (!source) return;

    this.isDragging = true;
    this.draggedItem = item;
    this.draggedSprite = sprite;
    this.sourceTarget = source;

    // 从源网格移除
    source.gridSystem.removeItem(item);

    // 创建拖拽预览
    this.createGhostSprite(item);

    // 移除原sprite的父容器
    if (sprite.parent) {
      sprite.parent.removeChild(sprite);
    }

    // 添加到应用根容器
    this.app.stage.addChild(sprite);

    // 更新sprite位置
    const global = event.global;
    sprite.position.set(global.x, global.y);
    sprite.alpha = 0.7;
    sprite.zIndex = 9999;

    // 监听指针移动和释放
    this.app.stage.on('pointermove', this.onPointerMove, this);
    this.app.stage.on('pointerup', this.onPointerUp, this);
    this.app.stage.on('pointerupoutside', this.onPointerUp, this);
  }

  /**
   * 指针移动处理
   */
  private onPointerMove(event: PIXI.FederatedPointerEvent): void {
    if (!this.isDragging || !this.draggedSprite || !this.draggedItem) return;

    // 更新sprite位置
    const global = event.global;
    this.draggedSprite.position.set(global.x, global.y);

    // 更新ghost预览
    this.updateGhostSprite(event);
  }

  /**
   * 指针释放处理
   */
  private onPointerUp(event: PIXI.FederatedPointerEvent): void {
    if (!this.isDragging || !this.draggedItem || !this.sourceTarget) return;

    // 查找目标容器
    const targetInfo = this.findDropTarget(event);

    if (targetInfo && this.validPlacement) {
      // 放置到目标容器
      const { target, gridPos } = targetInfo;
      const success = target.gridSystem.placeItem(
        this.draggedItem,
        gridPos.x,
        gridPos.y
      );

      if (success) {
        // 移动sprite到目标容器
        if (this.draggedSprite && this.draggedSprite.parent) {
          this.draggedSprite.parent.removeChild(this.draggedSprite);
        }
        target.container.addChild(this.draggedSprite);

        // 更新sprite位置
        const pixelPos = target.gridSystem.gridToPixel(gridPos.x, gridPos.y);
        this.draggedSprite.position.set(pixelPos.x, pixelPos.y);
        this.draggedSprite.alpha = 1;

        // 触发回调
        if (this.sourceTarget !== target) {
          this.sourceTarget.onItemRemoved?.(this.draggedItem);
          target.onItemDropped?.(this.draggedItem);
        }
      } else {
        // 放置失败，返回源容器
        this.returnToSource();
      }
    } else {
      // 没有找到有效目标，返回源容器
      this.returnToSource();
    }

    // 清理
    this.endDrag();
  }

  /**
   * 查找放置目标
   */
  private findDropTarget(event: PIXI.FederatedPointerEvent): {
    target: DragTarget;
    gridPos: { x: number; y: number };
  } | null {
    if (!this.draggedItem) return null;

    const global = event.global;

    for (const [id, target] of this.dragTargets) {
      const bounds = target.container.getBounds();

      // 检查是否在容器范围内
      if (bounds.contains(global.x, global.y)) {
        // 转换为容器本地坐标
        const local = target.container.toLocal(global);

        // 转换为网格坐标
        const gridPos = target.gridSystem.pixelToGrid(local.x, local.y);

        // 检查是否可以放置
        if (target.gridSystem.canPlaceItem(this.draggedItem, gridPos.x, gridPos.y)) {
          return { target, gridPos };
        }
      }
    }

    return null;
  }

  /**
   * 返回到源容器
   */
  private returnToSource(): void {
    if (!this.draggedItem || !this.sourceTarget || !this.draggedSprite) return;

    // 尝试放回原位置
    const position = this.sourceTarget.gridSystem.findPlacementPosition(this.draggedItem);

    if (position) {
      this.sourceTarget.gridSystem.placeItem(this.draggedItem, position.x, position.y);

      // 移动sprite回源容器
      if (this.draggedSprite.parent) {
        this.draggedSprite.parent.removeChild(this.draggedSprite);
      }
      this.sourceTarget.container.addChild(this.draggedSprite);

      const pixelPos = this.sourceTarget.gridSystem.gridToPixel(position.x, position.y);
      this.draggedSprite.position.set(pixelPos.x, pixelPos.y);
      this.draggedSprite.alpha = 1;
    }
  }

  /**
   * 创建ghost预览sprite
   */
  private createGhostSprite(item: Item): void {
    this.ghostSprite = new PIXI.Graphics();
    this.app.stage.addChild(this.ghostSprite);
  }

  /**
   * 更新ghost预览
   */
  private updateGhostSprite(event: PIXI.FederatedPointerEvent): void {
    if (!this.ghostSprite || !this.draggedItem) return;

    this.ghostSprite.clear();

    const targetInfo = this.findDropTarget(event);

    if (targetInfo) {
      const { target, gridPos } = targetInfo;
      const canPlace = target.gridSystem.canPlaceItem(this.draggedItem, gridPos.x, gridPos.y);

      this.validPlacement = canPlace;

      // 转换为全局坐标
      const pixelPos = target.gridSystem.gridToPixel(gridPos.x, gridPos.y);
      const local = new PIXI.Point(pixelPos.x, pixelPos.y);
      const global = target.container.toGlobal(local);

      const cellSize = target.gridSystem.getCellSize();
      const width = this.draggedItem.width * cellSize;
      const height = this.draggedItem.height * cellSize;

      // 绘制ghost矩形
      this.ghostSprite.beginFill(canPlace ? 0x00ff00 : 0xff0000, 0.3);
      this.ghostSprite.lineStyle(2, canPlace ? 0x00ff00 : 0xff0000, 0.8);
      this.ghostSprite.drawRect(global.x, global.y, width, height);
      this.ghostSprite.endFill();
    } else {
      this.validPlacement = false;
    }
  }

  /**
   * 结束拖拽
   */
  private endDrag(): void {
    // 移除事件监听
    this.app.stage.off('pointermove', this.onPointerMove, this);
    this.app.stage.off('pointerup', this.onPointerUp, this);
    this.app.stage.off('pointerupoutside', this.onPointerUp, this);

    // 移除ghost sprite
    if (this.ghostSprite) {
      this.ghostSprite.destroy();
      this.ghostSprite = null;
    }

    // 重置状态
    this.isDragging = false;
    this.draggedItem = null;
    this.draggedSprite = null;
    this.sourceTarget = null;
    this.validPlacement = false;
  }

  /**
   * 检查是否正在拖拽
   */
  isDraggingItem(): boolean {
    return this.isDragging;
  }

  /**
   * 获取当前拖拽的物品
   */
  getDraggedItem(): Item | null {
    return this.draggedItem;
  }
}
