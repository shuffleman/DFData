import type { ItemData } from '@types';
import { Item } from '@entities/Item';

/**
 * 数据管理器
 * 负责加载和管理游戏数据
 */
export class DataManager {
  private items: Map<number, Item> = new Map();
  private itemsCatalog: Map<number, ItemData> = new Map();

  private basePath = './normalized_data';

  /**
   * 加载所有数据
   */
  async loadAllData(): Promise<void> {
    try {
      // 加载物品目录
      await this.loadItemsCatalog();

      // 加载各类物品数据
      await Promise.all([
        this.loadWeapons(),
        this.loadAccessories(),
        this.loadAmmunitions(),
        this.loadProtection(),
        this.loadCollectibles(),
        this.loadConsumables(),
      ]);

      console.log(`数据加载完成: ${this.items.size} 个物品`);
    } catch (error) {
      console.error('数据加载失败:', error);
      throw error;
    }
  }

  /**
   * 加载物品目录
   */
  private async loadItemsCatalog(): Promise<void> {
    const data = await this.loadJSON<{ items: Record<string, ItemData> }>('items_catalog.json');
    // items是一个对象，需要转换为值的数组
    Object.values(data.items).forEach(item => {
      this.itemsCatalog.set(Number(item.objectID), item);
    });
  }

  /**
   * 加载武器数据
   */
  private async loadWeapons(): Promise<void> {
    const data = await this.loadJSON<{ items: ItemData[] }>('weapons_spec.json');
    data.items.forEach(spec => {
      const catalog = this.itemsCatalog.get(Number(spec.objectID));
      if (catalog) {
        const itemData = { ...spec, ...catalog };
        this.items.set(Number(spec.objectID), new Item(itemData));
      }
    });
  }

  /**
   * 加载配件数据
   */
  private async loadAccessories(): Promise<void> {
    const data = await this.loadJSON<{ items: ItemData[] }>('accessories_spec.json');
    data.items.forEach(spec => {
      const catalog = this.itemsCatalog.get(Number(spec.objectID));
      if (catalog) {
        const itemData = { ...spec, ...catalog };
        this.items.set(Number(spec.objectID), new Item(itemData));
      }
    });
  }

  /**
   * 加载弹药数据
   */
  private async loadAmmunitions(): Promise<void> {
    const data = await this.loadJSON<{ items: ItemData[] }>('ammunitions_spec.json');
    data.items.forEach(spec => {
      const catalog = this.itemsCatalog.get(Number(spec.objectID));
      if (catalog) {
        const itemData = { ...spec, ...catalog };
        this.items.set(Number(spec.objectID), new Item(itemData));
      }
    });
  }

  /**
   * 加载防护装备数据
   */
  private async loadProtection(): Promise<void> {
    const categories = ['helmets', 'armors', 'chests', 'backpacks'];

    for (const category of categories) {
      try {
        const data = await this.loadJSON<{ items: ItemData[] }>(`${category}_spec.json`);
        data.items.forEach(spec => {
          const catalog = this.itemsCatalog.get(Number(spec.objectID));
          if (catalog) {
            const itemData = { ...spec, ...catalog };
            this.items.set(Number(spec.objectID), new Item(itemData));
          }
        });
      } catch (error) {
        console.warn(`无法加载 ${category} 数据:`, error);
      }
    }
  }

  /**
   * 加载收集品数据
   */
  private async loadCollectibles(): Promise<void> {
    try {
      const data = await this.loadJSON<{ items: ItemData[] }>('collectibles_spec.json');
      data.items.forEach(spec => {
        const catalog = this.itemsCatalog.get(Number(spec.objectID));
        if (catalog) {
          const itemData = { ...spec, ...catalog };
          this.items.set(Number(spec.objectID), new Item(itemData));
        }
      });
    } catch (error) {
      console.warn('无法加载收集品数据:', error);
    }
  }

  /**
   * 加载消耗品数据
   */
  private async loadConsumables(): Promise<void> {
    try {
      const data = await this.loadJSON<{ items: ItemData[] }>('consumables_spec.json');
      data.items.forEach(spec => {
        const catalog = this.itemsCatalog.get(Number(spec.objectID));
        if (catalog) {
          const itemData = { ...spec, ...catalog };
          this.items.set(Number(spec.objectID), new Item(itemData));
        }
      });
    } catch (error) {
      console.warn('无法加载消耗品数据:', error);
    }
  }

  /**
   * 加载JSON文件
   */
  private async loadJSON<T>(filename: string): Promise<T> {
    const response = await fetch(`${this.basePath}/${filename}`);
    if (!response.ok) {
      throw new Error(`无法加载 ${filename}: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * 根据ID获取物品
   */
  getItem(objectID: number): Item | undefined {
    return this.items.get(objectID);
  }

  /**
   * 获取所有物品
   */
  getAllItems(): Item[] {
    return Array.from(this.items.values());
  }

  /**
   * 根据类别获取物品
   */
  getItemsByCategory(category: string): Item[] {
    return this.getAllItems().filter(item => item.category === category);
  }

  /**
   * 随机获取物品（用于测试）
   */
  getRandomItems(count: number): Item[] {
    const allItems = this.getAllItems();
    const result: Item[] = [];

    for (let i = 0; i < count && i < allItems.length; i++) {
      const randomIndex = Math.floor(Math.random() * allItems.length);
      result.push(allItems[randomIndex].clone());
    }

    return result;
  }
}
