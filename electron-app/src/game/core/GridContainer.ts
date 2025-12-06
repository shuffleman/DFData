/**
 * GridContainer - 多网格容器类
 * 用于管理复杂布局（如背包、胸挂的多格布局）
 */

import * as PIXI from 'pixi.js';
import { Subgrid } from './Subgrid';
import type { GridContainerOptions } from '@types';
import type { Item } from '@entities/Item';

export class GridContainer {
  // ========== 基础属性 ==========
  title: string;
  container: PIXI.Container;
  cellSize: number;
  aspect: number;

  // ========== 布局配置 ==========
  layout: [number, number, number, number][];  // [宽, 高, x偏移, y偏移]
  subgrids: Subgrid[] = [];

  // ========== 功能标志 ==========
  fullfill: boolean;
  countable: boolean;

  // ========== 类型过滤 ==========
  acceptedTypes: string[];
  rejectedTypes: string[];

  // ========== 关联物品 ==========
  associatedItem: Item | null = null;

  // ========== 父级引用 ==========
  parentRegion: any | null = null;

  constructor(options: GridContainerOptions) {
    this.title = options.title;
    this.layout = options.layout || [];
    this.cellSize = options.cellSize;
    this.aspect = options.aspect ?? 1;
    this.fullfill = options.fullfill ?? false;
    this.countable = options.countable ?? true;
    this.acceptedTypes = options.acceptTypes ?? [];
    this.rejectedTypes = options.rejectTypes ?? [];

    // 创建容器
    this.container = new PIXI.Container();

    // 初始化子网格
    this.initSubgrids();
  }

  // ========== 初始化方法 ==========

  /**
   * 初始化子网格（根据layout创建）
   */
  initSubgrids(): void {
    // 清空现有子网格
    for (const subgrid of this.subgrids) {
      this.container.removeChild(subgrid.container);
      subgrid.destroy();
    }
    this.subgrids = [];

    // 如果没有布局，创建默认的单个网格
    if (this.layout.length === 0) {
      this.layout = [[1, 1, 0, 0]];
    }

    // 根据布局创建子网格
    for (let i = 0; i < this.layout.length; i++) {
      const [width, height, xOffset, yOffset] = this.layout[i];

      const subgrid = new Subgrid({
        size: { width, height },
        cellSize: this.cellSize,
        aspect: this.aspect,
        fullfill: this.fullfill,
        countable: this.countable,
        acceptTypes: this.acceptedTypes,
        rejectTypes: this.rejectedTypes,
        title: `${this.title}_${i}`
      });

      // 设置父级引用
      subgrid.parentRegion = this.associatedItem || this.parentRegion;

      // 设置位置
      subgrid.container.position.set(
        xOffset * this.cellSize * this.aspect,
        yOffset * this.cellSize
      );

      this.subgrids.push(subgrid);
      this.container.addChild(subgrid.container);
    }
  }

  /**
   * 刷新UI（重新布局所有子网格）
   */
  refreshUI(): void {
    for (let i = 0; i < this.subgrids.length; i++) {
      if (i < this.layout.length) {
        const [, , xOffset, yOffset] = this.layout[i];
        this.subgrids[i].container.position.set(
          xOffset * this.cellSize * this.aspect,
          yOffset * this.cellSize
        );
      }
    }
  }

  // ========== 物品管理方法 ==========

  /**
   * 添加物品（自动寻找合适的子网格）
   */
  addItem(item: Item, col: number = -1, row: number = -1): boolean {
    // 如果指定了位置，找到对应的子网格
    if (col >= 0 && row >= 0) {
      const targetSubgrid = this.findSubgridAtPosition(col, row);
      if (targetSubgrid) {
        return targetSubgrid.addItem(item, col, row);
      }
    }

    // 自动寻找能容纳物品的子网格
    for (const subgrid of this.subgrids) {
      if (subgrid.addItem(item)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 移除物品
   */
  removeItem(item: Item): void {
    for (const subgrid of this.subgrids) {
      if (subgrid.blocks.includes(item)) {
        subgrid.removeItem(item);
        return;
      }
    }
  }

  /**
   * 清空所有物品
   */
  clearAllItems(): void {
    for (const subgrid of this.subgrids) {
      subgrid.clearItem();
    }
  }

  /**
   * 获取所有物品
   */
  getAllItems(): Item[] {
    const allItems: Item[] = [];
    for (const subgrid of this.subgrids) {
      allItems.push(...subgrid.getAllItems());
    }
    return allItems;
  }

  /**
   * 获取物品总数
   */
  getItemCount(): number {
    let count = 0;
    for (const subgrid of this.subgrids) {
      count += subgrid.blocks.length;
    }
    return count;
  }

  // ========== 自动整理功能 ==========

  /**
   * 自动整理（按面积从大到小重新排列）
   */
  autoArrange(): void {
    // 1. 收集所有物品
    const allItems = this.getAllItems();

    // 2. 清空所有子网格
    this.clearAllItems();

    // 3. 按面积从大到小排序
    allItems.sort((a, b) => {
      const areaA = a.cellWidth * a.cellHeight;
      const areaB = b.cellWidth * b.cellHeight;
      return areaB - areaA;
    });

    // 4. 重新放置物品
    for (const item of allItems) {
      this.addItem(item);
    }
  }

  // ========== 辅助方法 ==========

  /**
   * 根据位置找到对应的子网格
   */
  private findSubgridAtPosition(col: number, row: number): Subgrid | null {
    for (let i = 0; i < this.subgrids.length; i++) {
      const [width, height, xOffset, yOffset] = this.layout[i];

      // 检查位置是否在这个子网格范围内
      if (
        col >= xOffset &&
        col < xOffset + width &&
        row >= yOffset &&
        row < yOffset + height
      ) {
        return this.subgrids[i];
      }
    }
    return null;
  }

  /**
   * 计算容器的总网格尺寸
   */
  getTotalSize(): { width: number; height: number } {
    if (this.layout.length === 0) {
      return { width: 0, height: 0 };
    }

    let maxWidth = 0;
    let maxHeight = 0;

    for (const [width, height, xOffset, yOffset] of this.layout) {
      maxWidth = Math.max(maxWidth, xOffset + width);
      maxHeight = Math.max(maxHeight, yOffset + height);
    }

    return { width: maxWidth, height: maxHeight };
  }

  /**
   * 计算容器的像素尺寸
   */
  getPixelSize(): { width: number; height: number } {
    const { width, height } = this.getTotalSize();
    return {
      width: width * this.cellSize * this.aspect,
      height: height * this.cellSize
    };
  }

  // ========== 状态控制方法 ==========

  /**
   * 设置启用状态
   */
  setEnabled(enabled: boolean): void {
    for (const subgrid of this.subgrids) {
      subgrid.setEnabled(enabled);
    }
    this.container.visible = enabled;
  }

  /**
   * 设置关联物品（背包/胸挂装备时）
   */
  setAssociatedItem(item: Item | null): void {
    this.associatedItem = item;

    // 更新所有子网格的父级引用
    for (const subgrid of this.subgrids) {
      subgrid.parentRegion = item || this.parentRegion;
    }
  }

  /**
   * 应用物品的子网格布局
   */
  applyItemLayout(item: Item): void {
    // 如果物品已有子网格，直接使用
    if (item.subgrids && Object.keys(item.subgrids).length > 0) {
      // 清空当前子网格
      for (const subgrid of this.subgrids) {
        this.container.removeChild(subgrid.container);
      }
      this.subgrids = [];

      // 使用物品的子网格
      for (const subgrid of Object.values(item.subgrids)) {
        subgrid.parentRegion = this;
        this.subgrids.push(subgrid);
        this.container.addChild(subgrid.container);
      }

      this.refreshUI();
    } else {
      // 否则根据物品的布局创建新子网格
      if (item.subgridLayout && item.subgridLayout.length > 0) {
        this.layout = item.subgridLayout;
        this.initSubgrids();
      }
    }
  }

  /**
   * 保存子网格到物品
   */
  saveSubgridsToItem(item: Item): void {
    item.subgrids = {};
    for (const subgrid of this.subgrids) {
      item.subgrids[subgrid.title] = subgrid;
      subgrid.parentRegion = item;
    }
  }

  // ========== 查询方法 ==========

  /**
   * 检查是否为空
   */
  isEmpty(): boolean {
    for (const subgrid of this.subgrids) {
      if (subgrid.blocks.length > 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * 计算总价值
   */
  getTotalValue(): number {
    if (!this.countable) {
      return 0;
    }

    let totalValue = 0;
    for (const subgrid of this.subgrids) {
      if (subgrid.countable) {
        for (const item of subgrid.blocks) {
          totalValue += item.baseValue || 0;
        }
      }
    }
    return totalValue;
  }

  // ========== 销毁方法 ==========

  /**
   * 获取所有Subgrid
   */
  getAllSubgrids(): Subgrid[] {
    return [...this.subgrids];
  }

  /**
   * 销毁容器
   */
  destroy(): void {
    this.clearAllItems();

    for (const subgrid of this.subgrids) {
      subgrid.destroy();
    }

    this.subgrids = [];
    this.container.destroy({ children: true });
  }
}
