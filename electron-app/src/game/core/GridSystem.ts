import type { PlacedItem, GridPosition, GridContainerConfig } from '@types';
import { Item } from '@entities/Item';

/**
 * 网格系统
 * 管理基于网格的物品放置逻辑
 */
export class GridSystem {
  private gridWidth: number;
  private gridHeight: number;
  private cellSize: number;
  private grid: (Item | null)[][];
  private placedItems: Map<Item, PlacedItem> = new Map();

  constructor(config: GridContainerConfig) {
    this.gridWidth = config.gridWidth;
    this.gridHeight = config.gridHeight;
    this.cellSize = config.cellSize;

    // 初始化网格
    this.grid = Array(this.gridHeight).fill(null).map(() =>
      Array(this.gridWidth).fill(null)
    );
  }

  /**
   * 检查位置是否可以放置物品
   */
  canPlaceItem(item: Item, gridX: number, gridY: number): boolean {
    const width = item.width;
    const height = item.height;

    // 检查边界
    if (gridX < 0 || gridY < 0 ||
        gridX + width > this.gridWidth ||
        gridY + height > this.gridHeight) {
      return false;
    }

    // 检查目标位置是否被占用
    for (let y = gridY; y < gridY + height; y++) {
      for (let x = gridX; x < gridX + width; x++) {
        if (this.grid[y][x] !== null) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 放置物品到网格
   */
  placeItem(item: Item, gridX: number, gridY: number): boolean {
    if (!this.canPlaceItem(item, gridX, gridY)) {
      return false;
    }

    const width = item.width;
    const height = item.height;

    // 在网格中标记物品占用
    for (let y = gridY; y < gridY + height; y++) {
      for (let x = gridX; x < gridX + width; x++) {
        this.grid[y][x] = item;
      }
    }

    // 记录物品放置信息
    this.placedItems.set(item, {
      item,
      gridX,
      gridY,
      width,
      height,
    });

    return true;
  }

  /**
   * 移除物品
   */
  removeItem(item: Item): boolean {
    const placed = this.placedItems.get(item);
    if (!placed) {
      return false;
    }

    // 清除网格占用
    for (let y = placed.gridY; y < placed.gridY + placed.height; y++) {
      for (let x = placed.gridX; x < placed.gridX + placed.width; x++) {
        if (this.grid[y][x] === item) {
          this.grid[y][x] = null;
        }
      }
    }

    this.placedItems.delete(item);
    return true;
  }

  /**
   * 移动物品到新位置
   */
  moveItem(item: Item, newGridX: number, newGridY: number): boolean {
    // 暂时移除物品
    const placed = this.placedItems.get(item);
    if (!placed) {
      return false;
    }

    this.removeItem(item);

    // 尝试放置到新位置
    if (this.placeItem(item, newGridX, newGridY)) {
      return true;
    }

    // 如果失败，恢复到原位置
    this.placeItem(item, placed.gridX, placed.gridY);
    return false;
  }

  /**
   * 获取指定位置的物品
   */
  getItemAt(gridX: number, gridY: number): Item | null {
    if (gridX < 0 || gridY < 0 ||
        gridX >= this.gridWidth || gridY >= this.gridHeight) {
      return null;
    }
    return this.grid[gridY][gridX];
  }

  /**
   * 获取物品的放置信息
   */
  getPlacedItem(item: Item): PlacedItem | undefined {
    return this.placedItems.get(item);
  }

  /**
   * 获取所有已放置的物品
   */
  getAllPlacedItems(): PlacedItem[] {
    return Array.from(this.placedItems.values());
  }

  /**
   * 将像素坐标转换为网格坐标
   */
  pixelToGrid(pixelX: number, pixelY: number): GridPosition {
    const col = Math.floor(pixelX / this.cellSize);
    const row = Math.floor(pixelY / this.cellSize);
    return {
      col,
      row,
      x: col,
      y: row,
    };
  }

  /**
   * 将网格坐标转换为像素坐标
   */
  gridToPixel(gridX: number, gridY: number): GridPosition {
    const x = gridX * this.cellSize;
    const y = gridY * this.cellSize;
    return {
      col: gridX,
      row: gridY,
      x,
      y,
    };
  }

  /**
   * 查找可以放置物品的位置
   */
  findPlacementPosition(item: Item): GridPosition | null {
    const width = item.width;
    const height = item.height;

    for (let y = 0; y <= this.gridHeight - height; y++) {
      for (let x = 0; x <= this.gridWidth - width; x++) {
        if (this.canPlaceItem(item, x, y)) {
          return { col: x, row: y, x, y };
        }
      }
    }

    return null;
  }

  /**
   * 自动放置物品
   */
  autoPlaceItem(item: Item): boolean {
    const position = this.findPlacementPosition(item);
    if (position) {
      return this.placeItem(item, position.x, position.y);
    }
    return false;
  }

  /**
   * 清空网格
   */
  clear(): void {
    this.grid = Array(this.gridHeight).fill(null).map(() =>
      Array(this.gridWidth).fill(null)
    );
    this.placedItems.clear();
  }

  /**
   * 获取网格尺寸
   */
  getGridSize(): { width: number; height: number } {
    return {
      width: this.gridWidth,
      height: this.gridHeight,
    };
  }

  /**
   * 获取单元格大小
   */
  getCellSize(): number {
    return this.cellSize;
  }

  /**
   * 计算网格总容量（单元格数量）
   */
  getTotalCapacity(): number {
    return this.gridWidth * this.gridHeight;
  }

  /**
   * 计算已使用的容量
   */
  getUsedCapacity(): number {
    let used = 0;
    for (const placed of this.placedItems.values()) {
      used += placed.width * placed.height;
    }
    return used;
  }

  /**
   * 计算剩余容量
   */
  getRemainingCapacity(): number {
    return this.getTotalCapacity() - this.getUsedCapacity();
  }
}
