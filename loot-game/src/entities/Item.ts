import type { ItemData } from '@types/index';

/**
 * 物品实体类
 * 封装物品数据和相关方法
 */
export class Item {
  public readonly data: ItemData;

  constructor(data: ItemData) {
    this.data = data;
  }

  /**
   * 获取物品ID
   */
  get objectID(): number {
    return this.data.objectID;
  }

  /**
   * 获取物品名称
   */
  get name(): string {
    return this.data.objectName;
  }

  /**
   * 获取物品类别
   */
  get category(): string {
    return this.data.category;
  }

  /**
   * 获取物品宽度（网格单位）
   */
  get width(): number {
    return this.data.width || 1;
  }

  /**
   * 获取物品高度（网格单位）
   */
  get height(): number {
    return this.data.height || 1;
  }

  /**
   * 获取物品重量
   */
  get weight(): number {
    return this.data.weight || 0;
  }

  /**
   * 获取物品价格
   */
  get price(): number {
    return this.data.avgPrice || 0;
  }

  /**
   * 获取物品图片URL
   */
  get picture(): string | undefined {
    return this.data.picture || this.data.imageData;
  }

  /**
   * 判断是否为武器
   */
  isWeapon(): boolean {
    return this.data.category === 'weapon';
  }

  /**
   * 判断是否为装备
   */
  isEquipment(): boolean {
    return ['helmet', 'armor', 'chest', 'backpack'].includes(this.data.category);
  }

  /**
   * 判断是否为容器（背包、胸挂等）
   */
  isContainer(): boolean {
    return ['backpack', 'chest'].includes(this.data.category);
  }

  /**
   * 获取容器格子配置
   */
  getGridCells() {
    return this.data.grid || [];
  }

  /**
   * 克隆物品
   */
  clone(): Item {
    return new Item({ ...this.data });
  }
}
