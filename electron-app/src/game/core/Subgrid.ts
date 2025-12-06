/**
 * Subgrid - 核心网格类
 * 负责管理单个网格区域的物品存储、放置验证和渲染
 */

import * as PIXI from 'pixi.js';
import type {
  Grid,
  GridPosition,
  SubgridOptions,
  OnItemDraggedIn,
  OnItemDraggedOut
} from '@types';
import { Item } from '@entities/Item';

export class Subgrid implements Grid {
  // ========== 基础属性 ==========
  width: number;
  height: number;
  cellSize: number;
  aspect: number;
  container: PIXI.Container;
  title: string;

  // ========== 类型验证 ==========
  acceptedTypes: string[];
  rejectedTypes: string[];
  acceptedObjectIDs: number[];

  // ========== 功能标志 ==========
  fullfill: boolean;        // 填充模式（配件槽）
  countable: boolean;       // 计入总价值
  enabled: boolean;         // 是否启用

  // ========== 渲染元素 ==========
  private gridGraphics: PIXI.Graphics;
  private backgroundGraphics: PIXI.Graphics;

  // ========== 物品存储 ==========
  blocks: Item[] = [];

  // ========== 父级引用 ==========
  parentRegion: any | null = null;  // Region | Item

  // ========== 事件回调 ==========
  onItemDraggedIn?: OnItemDraggedIn;
  onItemDraggedOut?: OnItemDraggedOut;

  constructor(options: SubgridOptions) {
    this.width = options.size.width;
    this.height = options.size.height;
    this.cellSize = options.cellSize;
    this.aspect = options.aspect ?? 1;
    this.fullfill = options.fullfill ?? false;
    this.countable = options.countable ?? true;
    this.acceptedTypes = options.acceptTypes ?? [];
    this.rejectedTypes = options.rejectTypes ?? [];
    this.acceptedObjectIDs = options.acceptObjectIDs ?? [];
    this.title = options.title ?? '';
    this.enabled = true;

    // 创建容器
    this.container = new PIXI.Container();

    // 创建渲染元素
    this.backgroundGraphics = new PIXI.Graphics();
    this.gridGraphics = new PIXI.Graphics();

    this.container.addChild(this.backgroundGraphics);
    this.container.addChild(this.gridGraphics);

    // 初始化渲染
    this.render();
  }

  // ========== 渲染方法 ==========

  /**
   * 渲染网格
   */
  private render(): void {
    this.backgroundGraphics.clear();
    this.gridGraphics.clear();

    const pixelWidth = this.width * this.cellSize * this.aspect;
    const pixelHeight = this.height * this.cellSize;

    // 绘制背景（PixiJS v7 API）
    if (!this.fullfill) {
      this.backgroundGraphics.beginFill(0x1a1a1a, 0.5);
      this.backgroundGraphics.drawRect(0, 0, pixelWidth, pixelHeight);
      this.backgroundGraphics.endFill();
    }

    // 绘制网格线（PixiJS v7 API）
    if (!this.fullfill) {
      this.gridGraphics.lineStyle(1, 0x444444, 0.3);

      // 垂直线
      for (let col = 0; col <= this.width; col++) {
        const x = col * this.cellSize * this.aspect;
        this.gridGraphics.moveTo(x, 0);
        this.gridGraphics.lineTo(x, pixelHeight);
      }

      // 水平线
      for (let row = 0; row <= this.height; row++) {
        const y = row * this.cellSize;
        this.gridGraphics.moveTo(0, y);
        this.gridGraphics.lineTo(pixelWidth, y);
      }
    }
  }

  // ========== 验证方法 ==========

  /**
   * 检查边界（物品是否在网格范围内）
   */
  checkBoundary(item: Item, col: number, row: number, rotated: boolean = false): boolean {
    const itemWidth = rotated ? item.cellHeight : item.cellWidth;
    const itemHeight = rotated ? item.cellWidth : item.cellHeight;

    if (this.fullfill) {
      // 填充模式：物品必须完全占据整个网格
      return itemWidth === this.width && itemHeight === this.height;
    }

    // 普通模式：物品必须完全在网格范围内
    return (
      col >= 0 &&
      row >= 0 &&
      col + itemWidth <= this.width &&
      row + itemHeight <= this.height
    );
  }

  /**
   * 检查类型接受（物品类型是否被接受）
   */
  checkAccept(item: Item): boolean {
    // 1. 首先检查黑名单（rejectedTypes）
    if (this.rejectedTypes.length > 0) {
      for (const type of this.rejectedTypes) {
        if (item.type === type) {
          return false;
        }
      }
    }

    // 2. 如果指定了 acceptedObjectIDs，则优先按 objectID 验证（配件槽）
    if (this.acceptedObjectIDs.length > 0) {
      const itemObjectID = Number(item.info.objectID);
      return this.acceptedObjectIDs.includes(itemObjectID);
    }

    // 3. 然后检查白名单（acceptedTypes）
    if (this.acceptedTypes.length === 0) {
      return true;  // 没有白名单限制，接受所有类型
    }

    return this.acceptedTypes.includes(item.type);
  }

  /**
   * 检查重叠（物品是否与其他物品重叠）
   */
  checkForOverlap(item: Item, col: number, row: number, rotated: boolean = false): boolean {
    const overlappingItems = this.getOverlappingItems(item, col, row, rotated);
    return overlappingItems.length > 0;
  }

  /**
   * 获取重叠的物品列表
   */
  getOverlappingItems(item: Item, col: number, row: number, rotated: boolean = false): Item[] {
    const overlappingItems: Item[] = [];

    const itemWidth = rotated ? item.cellHeight : item.cellWidth;
    const itemHeight = rotated ? item.cellWidth : item.cellHeight;

    for (const block of this.blocks) {
      if (block === item) continue;  // 跳过自己

      // 计算物品边界
      const itemRight = col + itemWidth;
      const itemBottom = row + itemHeight;
      const blockRight = block.col + block.cellWidth;
      const blockBottom = block.row + block.cellHeight;

      // 检查矩形重叠（AABB碰撞检测）
      if (
        col < blockRight &&
        itemRight > block.col &&
        row < blockBottom &&
        itemBottom > block.row
      ) {
        overlappingItems.push(block);
      }
    }

    return overlappingItems;
  }

  // ========== 物品管理方法 ==========

  /**
   * 添加物品到网格（核心方法）
   */
  addItem(obj: Item, col: number = -1, row: number = -1, removeFromOriginalGrid: boolean = true): boolean {
    // A. 安全检查
    if (!this.checkSafety(obj)) {
      return false;
    }

    // B. 类型检查
    if (!this.checkAccept(obj)) {
      console.log(`物品 ${obj.name} 类型不被接受`);
      return false;
    }

    // C. 位置查找
    let bFound = false;

    // 如果指定了坐标，先检查该位置
    if (col >= 0 && row >= 0) {
      if (!this.checkForOverlap(obj, col, row) && this.checkBoundary(obj, col, row)) {
        bFound = true;
      } else {
        // 位置不合法，重置为自动寻找
        col = -1;
        row = -1;
      }
    }

    // 自动寻找位置
    if (!bFound) {
      const foundPos = this.findEmptyPosition(obj);
      if (foundPos) {
        col = foundPos.col;
        row = foundPos.row;
        bFound = true;
      }
    }

    if (!bFound) {
      console.log(`无法为物品 ${obj.name} 找到合适的位置`);
      return false;
    }

    // D. 记录原始网格（用于回调）
    const objOriginalParentGrid = obj.parentGrid;

    // E. 从原网格移除
    if (removeFromOriginalGrid && obj.parentGrid && obj.parentGrid !== this) {
      obj.parentGrid.removeItem(obj);
    }

    // F. 添加到当前网格
    this.blocks.push(obj);
    this.container.addChild(obj.container);
    obj.parentGrid = this;

    // G. 调整物品大小和位置
    if (this.fullfill) {
      // 填充模式：物品填满整个网格
      obj.resize(
        this.cellSize * this.aspect * this.width,
        this.cellSize * this.height
      );
      obj.setGridPosition(0, 0);
    } else {
      // 普通模式：按物品实际尺寸
      obj.resize(
        this.cellSize * this.aspect * obj.cellWidth,
        this.cellSize * obj.cellHeight
      );
      obj.setGridPosition(col, row);
    }

    obj.parentRegion = this.parentRegion;

    // H. 触发回调
    if (this.onItemDraggedIn) {
      this.onItemDraggedIn(obj, col, row, objOriginalParentGrid);
    }

    obj.refreshUI();
    return true;
  }

  /**
   * 移除物品
   */
  removeItem(obj: Item): void {
    const index = this.blocks.indexOf(obj);
    if (index !== -1) {
      this.blocks.splice(index, 1);
    }

    if (obj.container.parent === this.container) {
      this.container.removeChild(obj.container);
    }

    // 触发回调
    if (this.onItemDraggedOut) {
      this.onItemDraggedOut(obj, this);
    }

    obj.parentGrid = null;
  }

  /**
   * 清空所有物品
   */
  clearItem(): void {
    const itemsCopy = [...this.blocks];
    for (const item of itemsCopy) {
      this.removeItem(item);
    }
  }

  /**
   * 添加占位（仅记录，不实际添加容器）
   */
  addBlock(item: Item, col: number, row: number): void {
    if (!this.blocks.includes(item)) {
      this.blocks.push(item);
    }
    item.col = col;
    item.row = row;
    item.parentGrid = this;
  }

  /**
   * 移除占位
   */
  removeBlock(item: Item): void {
    const index = this.blocks.indexOf(item);
    if (index !== -1) {
      this.blocks.splice(index, 1);
    }
    item.parentGrid = null;
  }

  // ========== 查询方法 ==========

  /**
   * 获取指定区域内的所有物品
   */
  getItemsInArea(col: number, row: number, width: number, height: number): Item[] {
    const items: Item[] = [];

    const areaRight = col + width;
    const areaBottom = row + height;

    for (const item of this.blocks) {
      const itemRight = item.col + item.cellWidth;
      const itemBottom = item.row + item.cellHeight;

      // 检查是否有重叠
      if (
        item.col < areaRight &&
        itemRight > col &&
        item.row < areaBottom &&
        itemBottom > row
      ) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * 获取所有物品
   */
  getAllItems(): Item[] {
    return [...this.blocks];
  }

  // ========== 坐标转换方法 ==========

  /**
   * 从全局坐标转换为网格坐标
   */
  getGridPositionFromGlobal(
    globalX: number,
    globalY: number,
    item: Item | null
  ): {
    clampedCol: number;
    clampedRow: number;
    snapX: number;
    snapY: number;
  } {
    const globalPosition = this.getGlobalPosition();
    const cellWidth = item ? item.cellWidth : 1;
    const cellHeight = item ? item.cellHeight : 1;

    // 计算网格位置（考虑物品中心点）
    const col = Math.round(
      (globalX - globalPosition.x - (cellWidth * this.cellSize * this.aspect) / 2) /
        (this.cellSize * this.aspect)
    );
    const row = Math.round(
      (globalY - globalPosition.y - (cellHeight * this.cellSize) / 2) /
        this.cellSize
    );

    // 限制在网格范围内
    const clampedCol = Math.max(0, Math.min(col, this.width - cellWidth));
    const clampedRow = Math.max(0, Math.min(row, this.height - cellHeight));

    // 计算对齐后的像素位置
    const snapX = (clampedCol + cellWidth / 2) * this.cellSize * this.aspect;
    const snapY = (clampedRow + cellHeight / 2) * this.cellSize;

    return { clampedCol, clampedRow, snapX, snapY };
  }

  /**
   * 获取网格的全局位置
   */
  getGlobalPosition(): PIXI.Point {
    return this.container.getGlobalPosition();
  }

  /**
   * 从网格坐标转换为全局坐标
   */
  getGridGlobalPosition(pos: GridPosition): PIXI.Point {
    const globalPos = this.getGlobalPosition();
    return new PIXI.Point(
      globalPos.x + pos.col * this.cellSize * this.aspect,
      globalPos.y + pos.row * this.cellSize
    );
  }

  // ========== 辅助方法 ==========

  /**
   * 查找空位置
   */
  private findEmptyPosition(item: Item): GridPosition | null {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (!this.checkForOverlap(item, col, row) && this.checkBoundary(item, col, row)) {
          return { col, row, x: col, y: row };
        }
      }
    }
    return null;
  }

  /**
   * 安全检查（防止容器嵌套等问题）
   */
  private checkSafety(obj: Item): boolean {
    // 1. 容器不能放入自身
    if ((obj.type === 'bag' || obj.type === 'chest') && this.isInsideContainer(obj)) {
      console.log(`拒绝：容器不能放入自身`);
      return false;
    }

    // 2. 未装备的背包/胸挂不能放入物品
    if (this.parentRegion && typeof this.parentRegion.type === 'string') {
      const parentItem = this.parentRegion as Item;
      if (
        (parentItem.type === 'bag' || parentItem.type === 'chest') &&
        !this.isParentItemInEquipmentSlot(parentItem)
      ) {
        console.log(`拒绝向未装备的容器添加物品`);
        return false;
      }
    }

    // 3. 背包/胸挂放到地面或嵌套时，清空内部物品
    if (obj.type === 'bag' || obj.type === 'chest') {
      if (this.isGroundContainer()) {
        this.emptyNestedContainerToGround(obj);
      }

      // 检查嵌套情况
      if (this.parentRegion && typeof this.parentRegion.type === 'string') {
        const parentItem = this.parentRegion as Item;
        if (parentItem.type === 'bag' || parentItem.type === 'chest') {
          console.log(`检测到嵌套容器，清空内部物品`);
          this.emptyNestedContainerToGround(obj);
        }
      }
    }

    return true;
  }

  /**
   * 检查是否在容器内部
   */
  private isInsideContainer(container: Item): boolean {
    let current = this.parentRegion;
    while (current) {
      if (current === container) {
        return true;
      }
      if (current.parentRegion) {
        current = current.parentRegion;
      } else {
        break;
      }
    }
    return false;
  }

  /**
   * 检查父物品是否在装备槽中
   */
  private isParentItemInEquipmentSlot(parentItem: Item): boolean {
    // TODO: 实现装备槽检查逻辑
    // 需要访问 Region 的装备槽信息
    return false;
  }

  /**
   * 检查是否是地面容器
   */
  private isGroundContainer(): boolean {
    // TODO: 实现地面容器检查逻辑
    return false;
  }

  /**
   * 清空嵌套容器到地面
   */
  private emptyNestedContainerToGround(container: Item): void {
    // TODO: 实现清空逻辑
    console.log(`清空容器 ${container.name} 的内部物品到地面`);
  }

  // ========== 状态控制方法 ==========

  /**
   * 设置启用状态
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.container.visible = enabled;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.clearItem();
    this.container.destroy({ children: true });
  }
}
