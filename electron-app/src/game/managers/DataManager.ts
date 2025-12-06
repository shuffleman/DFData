/**
 * DataManager - 数据管理器
 * 负责加载和管理游戏数据（物品、武器、配件、价格等）
 */

import * as PIXI from 'pixi.js';
import type { ItemData } from '@types';

/**
 * 资源信息接口
 */
interface ResourceInfo {
  name: string;
  url: string;
}

/**
 * 资源加载结果
 */
interface ResourceResult {
  name: string;
  data: any[];
}

/**
 * 槽位信息
 */
export interface SlotInfo {
  slotName: string;
  acceptedObjectIDs: number[];
}

/**
 * CDN类型
 */
type CDNType = 'local' | 'jsdelivr' | 'api';

export class DataManager {
  // ========== 数据存储 ==========
  /** 物品信息字典 {类型名: 物品数组} */
  public readonly itemInfos: { [key: string]: ItemData[] } = {};

  /** 价格数据 */
  public values: Array<{ objectID: number; baseValue: number }> = [];

  /** 枪械槽位映射表 */
  public gunSlotMap: any = {};

  /** 完整的 data.json 数据 */
  public dataJson: any = null;

  // ========== 随机物品生成预设 ==========
  private pickingPreset: { [key: string]: any } = {
    default: {
      collection: {
        prob: 0.65,
        grades: [0, 0.2, 0.15, 0.2, 0.25, 0.15, 0.05, 0]
      },
      consume: {
        prob: 0.08,
        grades: [0, 0.2, 0.15, 0.2, 0.25, 0.15, 0.05, 0]
      },
      key: {
        prob: 0.01,
        grades: [0, 0, 0, 0.5, 0.3, 0.15, 0.05, 0]
      },
      armor: {
        prob: 0.02,
        grades: [0, 0.05, 0.1, 0.2, 0.35, 0.2, 0.1, 0]
      },
      backpack: {
        prob: 0.04,
        grades: [0, 0.05, 0.15, 0.2, 0.35, 0.15, 0.1, 0]
      },
      chestRigs: {
        prob: 0.04,
        grades: [0, 0.05, 0.15, 0.2, 0.4, 0.15, 0.05, 0]
      },
      helmet: {
        prob: 0.04,
        grades: [0, 0.05, 0.1, 0.2, 0.35, 0.2, 0.1, 0]
      },
      gunRifle: {
        prob: 0.04,
        grades: [1, 0, 0, 0, 0, 0, 0, 0]
      },
      gunPistol: {
        prob: 0.02,
        grades: [1, 0, 0, 0, 0, 0, 0, 0]
      },
      ammo: {
        prob: 0.02,
        grades: [0, 0.05, 0.1, 0.2, 0.35, 0.2, 0.1, 0]
      },
      accBackGrip: {
        prob: 0.01,
        grades: [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]
      },
      accBarrel: {
        prob: 0.01,
        grades: [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]
      },
      accForeGrip: {
        prob: 0.01,
        grades: [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]
      },
      accFunctional: {
        prob: 0.01,
        grades: [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]
      },
      accHandGuard: {
        prob: 0.01,
        grades: [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]
      },
      accMagazine: {
        prob: 0.01,
        grades: [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]
      },
      accMuzzle: {
        prob: 0.01,
        grades: [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]
      },
      accScope: {
        prob: 0.01,
        grades: [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]
      },
      accStock: {
        prob: 0.01,
        grades: [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]
      }
    }
  };

  constructor() {
    // 初始化完成
  }

  // ========== 数据加载方法 ==========

  /**
   * 加载所有游戏资源
   */
  async loadResources(config: {
    resourceCDN: CDNType;
    realtimeValue: 'local' | 'api' | 'jsdelivr';
    itemInfoURLs: ResourceInfo[];
    gunSlotMapURL: string;
    dataJsonURL: string;
    valuesURL: string;
  }): Promise<boolean> {
    try {
      // 1. 加载物品信息
      const itemLoadPromises = config.itemInfoURLs.map(async (info: ResourceInfo) => {
        console.log(`[DataManager] 正在加载: ${info.name} from ${info.url}`);
        const response = await fetch(info.url, { cache: 'no-store' });

        if (!response.ok) {
          console.error(`[DataManager] 加载失败: ${info.name}, 状态: ${response.status}`);
          throw new Error(`Failed to load ${info.name}: ${response.status}`);
        }

        const data = await response.json();

        // 处理API格式 vs 本地JSON格式
        let list;
        if (data.success !== undefined) {
          // API返回格式：{ success: true, data: { jData: { data: { data: { list: [...] } } } } }
          list = data.data.jData.data.data.list;
          // API返回的字段名是 objectId，需要统一为 objectID
          list = list.map((item: any) => {
            if (item.objectId !== undefined && item.objectID === undefined) {
              item.objectID = item.objectId;
            }
            return item;
          });
        } else {
          // 本地JSON格式：{ jData: { data: { data: { list: [...] } } } }
          list = data.jData.data.data.list;
        }

        console.log(`[DataManager] ${info.name} 加载成功，数据量: ${list?.length || 0}`);
        return { name: info.name, data: list };
      });

      // 2. 加载 gunSlotMap
      console.log(`[DataManager] 正在加载 gunSlotMap from ${config.gunSlotMapURL}`);
      const gunSlotMapRes = await fetch(config.gunSlotMapURL, { cache: 'no-store' });
      if (!gunSlotMapRes.ok) {
        throw new Error(`Failed to load gunSlotMap: ${gunSlotMapRes.status}`);
      }
      const gunSlotMapResponse = await gunSlotMapRes.json();

      // 3. 加载 data.json（完整数据）
      console.log(`[DataManager] 正在加载 data.json from ${config.dataJsonURL}`);
      const dataJsonRes = await fetch(config.dataJsonURL, { cache: 'no-store' });

      if (!dataJsonRes.ok) {
        throw new Error(`Failed to load data.json: ${dataJsonRes.status}`);
      }

      const dataJsonText = await dataJsonRes.text();
      console.log(`[DataManager] data.json 文本长度: ${dataJsonText.length} 字符`);

      // 检查是否包含 HTML 标签
      const htmlTagIndex = dataJsonText.indexOf('<');
      if (htmlTagIndex !== -1) {
        console.error(`[DataManager] data.json 包含 HTML 标签！位置: ${htmlTagIndex}`);
        throw new Error(`data.json contains HTML tags at position ${htmlTagIndex}`);
      }

      const dataJsonResponse = JSON.parse(dataJsonText);

      // 4. 等待所有物品信息加载完成
      const itemResults = await Promise.all(itemLoadPromises);

      // 5. 存储物品信息
      itemResults.forEach((result: ResourceResult) => {
        this.itemInfos[result.name] = result.data;
        console.log(`[DataManager] 已存储 ${result.name}: ${result.data?.length || 0} 条记录`);
      });

      // 6. 处理 gunSlotMap 数据
      if (gunSlotMapResponse.success !== undefined) {
        this.gunSlotMap = gunSlotMapResponse.data;
      } else {
        this.gunSlotMap = gunSlotMapResponse;
      }

      // 7. 处理 data.json 数据
      if (dataJsonResponse.success !== undefined) {
        this.dataJson = dataJsonResponse.data;
      } else {
        this.dataJson = dataJsonResponse;
      }
      console.log('[DataManager] data.json 加载完成');

      // 8. 加载实时价格
      await this.loadValues(config.valuesURL);

      // 9. 预加载常用物品图片
      await this.preloadCommonImages();

      console.log('[DataManager] 资源加载完成');
      return true;
    } catch (error) {
      console.error('[DataManager] 加载资源时出错：', error);
      if (error instanceof Error) {
        console.error('错误详情:', error.message);
        if (error.stack) {
          console.error('错误堆栈:', error.stack);
        }
      }
      return false;
    }
  }

  /**
   * 加载价格数据
   */
  private async loadValues(valuesURL: string): Promise<void> {
    try {
      const response = await fetch(valuesURL);
      const data = await response.json();

      const ret: Array<{ objectID: number; baseValue: number }> = [];
      // API returns: {success: true, data: {list: [{objectID, objectName, baseValue}, ...]}}
      // Local returns: {list: [{objectID, objectName, baseValue}, ...]}
      const list = data.success ? data.data.list : data.list;

      for (const item of list) {
        ret.push({
          objectID: Number(item.objectID),
          baseValue: Number(item.baseValue)
        });
      }

      this.values = ret;
      console.log(`[DataManager] 价格数据加载完成，共 ${this.values.length} 条记录`);
    } catch (error) {
      console.error('[DataManager] 加载实时价格时出错：', error);
      this.values = [];
    }
  }

  /**
   * 预加载常用物品图片
   */
  private async preloadCommonImages(): Promise<void> {
    try {
      console.log('[DataManager] 开始预加载物品图片...');

      // 收集所有物品的图片URL（去重）
      const imageUrls = new Set<string>();

      for (const key of Object.keys(this.itemInfos)) {
        const infos = this.itemInfos[key];
        if (Array.isArray(infos)) {
          for (const itemInfo of infos) {
            if (itemInfo.pic) {
              imageUrls.add(itemInfo.pic);
            }
          }
        }
      }

      const urls = Array.from(imageUrls);
      console.log(`[DataManager] 共需加载 ${urls.length} 张图片`);

      // 使用PIXI.Assets批量加载
      const loadPromises = urls.map((url) => {
        return PIXI.Assets.load(url).catch((err: any) => {
          console.warn(`预加载图片失败: ${url}`, err);
          return null;
        });
      });

      await Promise.all(loadPromises);
      console.log(`[DataManager] 图片预加载完成`);
    } catch (error) {
      console.warn('[DataManager] 预加载图片时出错，继续运行游戏', error);
    }
  }

  // ========== 物品查询方法 ==========

  /**
   * 通过名称获取物品信息
   */
  getItemInfoByName(name: string): ItemData | null {
    for (const key of Object.keys(this.itemInfos)) {
      const infos = this.itemInfos[key];
      if (Array.isArray(infos)) {
        for (const itemInfo of infos) {
          if (name === itemInfo.objectName) {
            return this.applyExternalInfo({ ...itemInfo });
          }
        }
      }
    }
    return null;
  }

  /**
   * 通过objectID获取物品信息
   */
  getItemInfoById(id: number | string): ItemData | null {
    if (typeof id === 'string') {
      id = parseInt(id);
    }

    for (const key of Object.keys(this.itemInfos)) {
      const infos = this.itemInfos[key];
      if (Array.isArray(infos)) {
        for (const itemInfo of infos) {
          const itemId = typeof itemInfo.objectID === 'string'
            ? parseInt(itemInfo.objectID)
            : itemInfo.objectID;
          if (id === itemId) {
            return this.applyExternalInfo({ ...itemInfo });
          }
        }
      }
    }

    console.warn(`[DataManager] getItemInfoById(${id}) 未找到`);
    return null;
  }

  // ========== 枪械配件查询方法 ==========

  /**
   * 通过槽位ID获取槽位信息
   */
  getGunSlotInfoByID(id: string | number): any {
    if (typeof id === 'number') {
      id = id.toString();
    }
    return this.gunSlotMap[id];
  }

  /**
   * 获取武器的所有槽位信息
   */
  getWeaponSlots(weaponID: string | number): any[] {
    if (!this.dataJson || !this.dataJson.rawData || !this.dataJson.rawData.weaponSlots) {
      console.warn('[DataManager] data.json 未加载或缺少 weaponSlots 数据');
      return [];
    }

    const weaponSlots = this.dataJson.rawData.weaponSlots[weaponID];
    if (!weaponSlots || !weaponSlots.slots) {
      return [];
    }

    // 转换字段名：slotid -> slotID
    return weaponSlots.slots.map((slot: any) => ({
      slotID: slot.slotid || slot.slotID,
      slotName: slot.slotName,
      slotType: slot.slotType,
      unlock: slot.unlock
    }));
  }

  /**
   * 获取某个武器槽位可以安装的配件 objectID 列表
   */
  getSlotAccessoryIDs(weaponID: string | number, slotID: string): number[] {
    if (!this.dataJson || !this.dataJson.rawData || !this.dataJson.rawData.slotAccessories) {
      console.warn('[DataManager] data.json 未加载或缺少 slotAccessories 数据');
      return [];
    }

    const key = `${weaponID}_${slotID}`;
    const slotData = this.dataJson.rawData.slotAccessories[key];

    if (!slotData || !slotData.accessories) {
      return [];
    }

    return slotData.accessories.map((acc: any) => Number(acc.objectID));
  }

  /**
   * 获取某个武器槽位的完整信息（包括槽位名称和可安装配件列表）
   * 这是 Item 配件系统的核心依赖方法
   */
  getSlotInfo(weaponID: string | number, slotID: string): SlotInfo | null {
    if (!this.dataJson || !this.dataJson.rawData || !this.dataJson.rawData.slotAccessories) {
      console.warn('[DataManager] getSlotInfo: data.json 未加载或缺少 rawData.slotAccessories');
      return null;
    }

    const key = `${weaponID}_${slotID}`;
    const slotData = this.dataJson.rawData.slotAccessories[key];

    if (!slotData) {
      console.warn(`[DataManager] getSlotInfo: 未找到槽位数据，key: ${key}`);
      return null;
    }

    console.log(`[DataManager] getSlotInfo: 找到槽位数据，key: ${key}, slotName: ${slotData.slotName}`);

    return {
      slotName: slotData.slotName || slotID,
      acceptedObjectIDs: slotData.accessories?.map((acc: any) => Number(acc.objectID)) || []
    };
  }

  // ========== 随机物品生成方法 ==========

  /**
   * 根据概率生成随机物品
   */
  getRandomItem(probabilities: any): ItemData | null {
    // 1. 根据概率选择物品类型
    const totalProb: number = (Object.values(probabilities) as any[]).reduce<number>(
      (sum: number, info: any) => sum + Number(info.prob),
      0
    );
    let randomValue = Math.random() * totalProb;
    let selectedType = '';

    for (const [type, info] of Object.entries(probabilities)) {
      randomValue -= (info as any).prob;
      if (randomValue <= 0) {
        selectedType = type;
        break;
      }
    }

    if (!selectedType || !this.itemInfos[selectedType]) {
      return null;
    }

    // 2. 根据等级概率选择等级
    const gradeProbs = probabilities[selectedType].grades;
    randomValue = Math.random();
    let selectedGrade = -1;
    let accumProb = 0;

    for (let i = 0; i < gradeProbs.length; i++) {
      accumProb += gradeProbs[i];
      if (randomValue <= accumProb) {
        selectedGrade = i;
        break;
      }
    }

    if (selectedGrade === -1) {
      return null;
    }

    // 3. 从选定类型和等级的物品中随机选择一个
    const itemsOfGrade = this.itemInfos[selectedType].filter(
      (item: any) => item.grade === selectedGrade
    );

    if (itemsOfGrade.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * itemsOfGrade.length);
    let info = itemsOfGrade[randomIndex];

    info = this.applyExternalInfo(info);

    // 过滤低于100价格的物品
    if (info.baseValue && info.baseValue < 100) {
      return null;
    }

    return info;
  }

  /**
   * 使用预设生成随机物品
   */
  getRandomItemWithPreset(preset: string | null = null): ItemData {
    if (!preset || !this.pickingPreset[preset]) {
      preset = 'default';
    }

    while (true) {
      const item = this.getRandomItem(this.pickingPreset[preset]);
      if (item) {
        return item;
      }
    }
  }

  // ========== 辅助方法 ==========

  /**
   * 为物品信息添加额外数据（价格、堆叠等）
   */
  private applyExternalInfo(info: any): ItemData {
    // 确保 subgridLayout 字段存在
    if (!info.subgridLayout) {
      info.subgridLayout = [];
    }

    // 添加价格信息
    if (info.baseValue && info.baseValue > 0) {
      // 物品本身已有价格，直接使用
    } else {
      // 从 values.json 查找
      const valueInfo = this.values.find((val: any) => val.objectID === info.objectID);
      if (valueInfo) {
        info.baseValue = valueInfo.baseValue;
      } else {
        console.warn(`未找到物品价格信息: objectID=${info.objectID}, objectName=${info.objectName}`);
        info.baseValue = 1;
      }
    }

    // 如果是弹药，随机添加数量
    if (info.primaryClass === 'ammo') {
      info.maxStack = 60;
      info.stack = Math.floor(Math.random() * 60) + 1;
    }

    // 添加搜索时间信息
    info.searchTime = 1.2;

    return info as ItemData;
  }
}
