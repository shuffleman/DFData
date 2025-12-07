import { GAME_RESOURCE_CDN, REALTIME_VALUE } from './config';
import * as PIXI from 'pixi.js';

interface ResourceInfo {
    name: string;
    url: string;
}

interface ResourceResult {
    name: string;
    data: any[];
}

type CDNType = 'local' | 'jsdelivr' | 'api';

// import { Item } from "./item";
// import { Subgrid } from "./subgrid";

export class ItemManager {
    // private itemTypes: any;
    public readonly itemInfos: { [key: string]: any } = {};
    public values: any = {};
    public gunSlotMap: any = {};
    public dataJson: any = null; // 完整的 data.json 数据
    private pickingPreset: any = {};

    constructor() {
        // this.loadResources();
        // 临时，之后转移到单独的 json 文件中
        this.pickingPreset = {
            'default': {
                "collection": {
                    "prob": 0.65,  // 提高收集品概率 (从0.55提高到0.65)
                    "grades" :[0, 0.2, 0.15, 0.2, 0.25, 0.15, 0.05, 0]  // 提高4-5级概率
                    // 等级分布: 1级20%, 2级15%, 3级20%, 4级25%, 5级15%, 6级5%
                },
                "consume": {
                    "prob": 0.08,  // 略微降低消耗品概率 (从0.1降低到0.08)
                    "grades" :[0, 0.2, 0.15, 0.2, 0.25, 0.15, 0.05, 0]  // 提高4-5级概率
                },
                "key": {
                    "prob": 0.01,
                    "grades" :[0, 0, 0, 0.5, 0.3, 0.15, 0.05, 0]  // 提高4-5级概率
                },
                "armor": {
                    "prob": 0.02,
                    "grades": [0, 0.05, 0.1, 0.2, 0.35, 0.2, 0.1, 0]  // 提高4-5级概率
                },
                "backpack": {
                    "prob": 0.04,  // 略微降低 (从0.05降低到0.04)
                    "grades": [0, 0.05, 0.15, 0.2, 0.35, 0.15, 0.1, 0]  // 提高4-5级概率
                },
                "chestRigs": {
                    "prob": 0.04,  // 略微降低 (从0.05降低到0.04)
                    "grades": [0, 0.05, 0.15, 0.2, 0.4, 0.15, 0.05, 0]  // 提高4-5级概率
                },
                "helmet": {
                    "prob": 0.04,  // 略微降低 (从0.05降低到0.04)
                    "grades": [0, 0.05, 0.1, 0.2, 0.35, 0.2, 0.1, 0]  // 提高4-5级概率
                },
                "gunRifle": {
                    "prob": 0.04,
                    "grades": [1, 0, 0, 0, 0, 0, 0, 0]
                },
                "gunPistol": {
                    "prob": 0.02,
                    "grades": [1, 0, 0, 0, 0, 0, 0, 0]
                },
                "ammo": {
                    "prob": 0.02,
                    "grades": [0, 0.05, 0.1, 0.2, 0.35, 0.2, 0.1, 0]  // 提高4-5级概率
                },
                "accBackGrip": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]  // 提高4-5级概率
                },
                "accBarrel": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]  // 提高4-5级概率
                },
                "accForeGrip": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]  // 提高4-5级概率
                },
                "accFunctional": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]  // 提高4-5级概率
                },
                "accHandGuard": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]  // 提高4-5级概率
                },
                "accMagazine": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]  // 提高4-5级概率
                },
                "accMuzzle": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]  // 提高4-5级概率
                },
                "accScope": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]  // 提高4-5级概率
                },
                "accStock": {
                    "prob": 0.01,
                    "grades": [0, 0, 0.3, 0.25, 0.3, 0.1, 0.05, 0]  // 提高4-5级概率
                }
            }
        }
    }
    
    async loadResources() {
        try {
            const cdn = window.game.config.resource_cdn as CDNType;
            
            // 加载物品信息
            const itemLoadPromises = GAME_RESOURCE_CDN[cdn].item_info.map(async (info: ResourceInfo) => {
                console.log(`[ItemManager] 正在加载: ${info.name} from ${info.url}`);
                const response = await fetch(info.url, { cache: 'no-store' });

                if (!response.ok) {
                    console.error(`[ItemManager] 加载失败: ${info.name}, 状态: ${response.status}, URL: ${info.url}`);
                    throw new Error(`Failed to load ${info.name}: ${response.status}`);
                }

                const data = await response.json();

                // 处理API格式 vs 本地JSON格式
                let list;
                if (data.success !== undefined) {
                    // API返回格式：{ success: true, data: { jData: { data: { data: { list: [...] } } } } }
                    list = data.data.jData.data.data.list;
                    console.log(`[ItemManager] ${info.name} 加载成功，数据量: ${list?.length || 0}`);
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
                    console.log(`[ItemManager] ${info.name} 加载成功(本地)，数据量: ${list?.length || 0}`);
                }

                if (list && list.length > 0) {
                    console.log(`[ItemManager] ${info.name} 第一条数据示例:`, list[0]);
                }

                return {
                    name: info.name,
                    data: list
                };
            });

            // 加载 gunSlotMap
            console.log(`[ItemManager] 正在加载 gunSlotMap from ${GAME_RESOURCE_CDN[cdn].gunSlotMap}`);
            const gunSlotMapRes = await fetch(GAME_RESOURCE_CDN[cdn].gunSlotMap, { cache: 'no-store' });
            if (!gunSlotMapRes.ok) {
                console.error(`[ItemManager] gunSlotMap 加载失败: ${gunSlotMapRes.status}, URL: ${GAME_RESOURCE_CDN[cdn].gunSlotMap}`);
                throw new Error(`Failed to load gunSlotMap: ${gunSlotMapRes.status}`);
            }
            const gunSlotMapResponse = await gunSlotMapRes.json();

            // 加载 data.json（完整数据）
            console.log(`[ItemManager] 正在加载 data.json from ${GAME_RESOURCE_CDN[cdn].dataJson}`);
            const dataJsonRes = await fetch(GAME_RESOURCE_CDN[cdn].dataJson, { cache: 'no-store' });
            console.log(`[ItemManager] data.json fetch 响应:`, {
                status: dataJsonRes.status,
                ok: dataJsonRes.ok,
                statusText: dataJsonRes.statusText,
                headers: {
                    contentType: dataJsonRes.headers.get('content-type'),
                    contentLength: dataJsonRes.headers.get('content-length')
                }
            });

            if (!dataJsonRes.ok) {
                console.error(`[ItemManager] data.json 加载失败: ${dataJsonRes.status}, URL: ${GAME_RESOURCE_CDN[cdn].dataJson}`);
                throw new Error(`Failed to load data.json: ${dataJsonRes.status}`);
            }

            // 读取为文本然后解析为 JSON
            const dataJsonText = await dataJsonRes.text();
            console.log(`[ItemManager] data.json 文本长度: ${dataJsonText.length} 字符`);

            // 检查是否包含 HTML 标签
            const htmlTagIndex = dataJsonText.indexOf('<');
            if (htmlTagIndex !== -1) {
                console.error(`[ItemManager] data.json 包含 HTML 标签！位置: ${htmlTagIndex}`);
                console.error(`[ItemManager] 前后文本:`, dataJsonText.substring(Math.max(0, htmlTagIndex - 50), htmlTagIndex + 100));
                throw new Error(`data.json contains HTML tags at position ${htmlTagIndex}`);
            }

            const dataJsonResponse = JSON.parse(dataJsonText);

            // 等待所有资源加载完成
            const itemResults = await Promise.all(itemLoadPromises);

            // 处理物品信息
            itemResults.forEach((result: ResourceResult) => {
                this.itemInfos[result.name] = result.data;
                console.log(`[ItemManager] 已存储 ${result.name}: ${result.data?.length || 0} 条记录`);
            });

            console.log('[ItemManager] itemInfos 所有键:', Object.keys(this.itemInfos));
            console.log('[ItemManager] itemInfos 统计:', Object.entries(this.itemInfos).map(([key, val]) => `${key}: ${val?.length || 0}`).join(', '));

            // 处理 gunSlotMap 数据，支持API格式
            if (gunSlotMapResponse.success !== undefined) {
                // API 返回格式：{ success: true, data: {...} }
                this.gunSlotMap = gunSlotMapResponse.data;
            } else {
                // 本地 JSON 格式：直接是数据对象
                this.gunSlotMap = gunSlotMapResponse;
            }

            // 处理 data.json 数据
            if (dataJsonResponse.success !== undefined) {
                // API 返回格式
                this.dataJson = dataJsonResponse.data;
            } else {
                // 本地 JSON 格式
                this.dataJson = dataJsonResponse;
            }
            console.log('[ItemManager] data.json 加载完成');

            // 加载实时价格
            await this.getValues();

            // 预加载常用物品图片
            await this.preloadCommonImages();

            console.log('资源加载完成');
            return true;
        } catch (error) {
            console.error('加载资源时出错：', error);
            console.error('错误详情:', error instanceof Error ? error.message : String(error));
            if (error instanceof Error && error.stack) {
                console.error('错误堆栈:', error.stack);
            }
            return false;
        }
    }

    async getValues() {
        try {
            // 使用配置中指定的价格数据源
            const valueSource = window.game.config.realtime_value as 'local' | 'api' | 'jsdelivr';
            const response = await fetch(REALTIME_VALUE[valueSource]);
            const data = await response.json();

            const ret: Array<{objectID: number, baseValue: number}> = [];
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

            console.log(`价格数据加载完成，共 ${this.values.length} 条记录 (来源: ${valueSource})`);
            if (this.values.length > 0) {
                console.log('价格数据示例:', this.values.slice(0, 3));
            }
        } catch (error) {
            console.error('加载实时价格时出错：', error);
            this.values = [];
        }
    }

    getItemInfoByName(name: string) {
        for (const key of Object.keys(this.itemInfos)) {
            const infos = this.itemInfos[key];
            if (Array.isArray(infos)) {
                for (const itemInfo of infos) {
                    if (name === itemInfo.objectName) {
                        // 应用外部信息（layout、value等）
                        return this.applyExternalInfo({...itemInfo});
                    }
                }
            }
        }
        return null;
    }

    getItemInfoById(id: number | string) {
        if (typeof id === 'string') {
            id = parseInt(id);
        }
        for (const key of Object.keys(this.itemInfos)) {
            const infos = this.itemInfos[key];
            if (Array.isArray(infos)) {
                for (const itemInfo of infos) {
                    // 兼容 number 和 string 类型的 objectID
                    const itemId = typeof itemInfo.objectID === 'string' ? parseInt(itemInfo.objectID) : itemInfo.objectID;
                    if (id === itemId) {
                        // 应用外部信息（layout、value等）
                        return this.applyExternalInfo({...itemInfo});
                    }
                }
            }
        }
        console.log(`[ItemManager] getItemInfoById(${id}) 未找到，已搜索 ${Object.keys(this.itemInfos).length} 个类别`);
        return null;
    }

    getGunSlotInfoByID(id: string | number) {
        if(typeof id === 'number') {
            id = id.toString();
        }
        return this.gunSlotMap[id];
    }

    /**
     * 获取武器的所有槽位信息
     * @param weaponID 武器的 objectID
     * @returns 槽位数组，每个槽位包含 slotID 和 slotName
     */
    getWeaponSlots(weaponID: string | number): any[] {
        if (!this.dataJson || !this.dataJson.rawData || !this.dataJson.rawData.weaponSlots) {
            console.warn('[ItemManager] data.json 未加载或缺少 weaponSlots 数据');
            return [];
        }

        const weaponSlots = this.dataJson.rawData.weaponSlots[weaponID];
        if (!weaponSlots || !weaponSlots.slots) {
            return [];
        }

        // 转换字段名：slotid -> slotID
        return weaponSlots.slots.map((slot: any) => ({
            slotID: slot.slotid || slot.slotID,  // 兼容两种字段名
            slotName: slot.slotName,
            slotType: slot.slotType,
            unlock: slot.unlock
        }));
    }

    /**
     * 获取某个武器槽位可以安装的配件 objectID 列表
     * @param weaponID 武器的 objectID
     * @param slotID 槽位 ID（如 "slot_muzzle"）
     * @returns 可安装的配件 objectID 数组
     */
    getSlotAccessoryIDs(weaponID: string | number, slotID: string): number[] {
        if (!this.dataJson || !this.dataJson.rawData || !this.dataJson.rawData.slotAccessories) {
            console.warn('[ItemManager] data.json 未加载或缺少 slotAccessories 数据');
            return [];
        }

        const key = `${weaponID}_${slotID}`;
        const slotData = this.dataJson.rawData.slotAccessories[key];

        if (!slotData || !slotData.accessories) {
            return [];
        }

        // 提取所有配件的 objectID
        return slotData.accessories.map((acc: any) => Number(acc.objectID));
    }

    /**
     * 获取某个武器槽位的完整信息（包括槽位名称和可安装配件列表）
     * @param weaponID 武器的 objectID
     * @param slotID 槽位 ID
     * @returns 槽位信息对象，包含 slotName 和 acceptedObjectIDs
     */
    getSlotInfo(weaponID: string | number, slotID: string): {slotName: string, acceptedObjectIDs: number[]} | null {
        if (!this.dataJson || !this.dataJson.rawData || !this.dataJson.rawData.slotAccessories) {
            console.warn('[ItemManager] getSlotInfo: data.json 未加载或缺少 rawData.slotAccessories');
            return null;
        }

        const key = `${weaponID}_${slotID}`;
        const slotData = this.dataJson.rawData.slotAccessories[key];

        if (!slotData) {
            console.warn(`[ItemManager] getSlotInfo: 未找到槽位数据，key: ${key}`);
            // 列出可用的键（前10个）
            const availableKeys = Object.keys(this.dataJson.rawData.slotAccessories).slice(0, 10);
            console.log(`[ItemManager] getSlotInfo: 可用的键示例:`, availableKeys);
            return null;
        }

        console.log(`[ItemManager] getSlotInfo: 找到槽位数据，key: ${key}, slotName: ${slotData.slotName}, 配件数量: ${slotData.accessories?.length || 0}`);

        return {
            slotName: slotData.slotName || slotID,
            acceptedObjectIDs: slotData.accessories?.map((acc: any) => Number(acc.objectID)) || []
        };
    }

    getRandomItem(probabilities: any) {
        // 首先根据概率选择物品类型
        const totalProb = Object.values(probabilities).reduce((sum: number, info: any) => sum + info.prob, 0);
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

        // 根据等级概率选择等级
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

        // 从选定类型和等级的物品中随机选择一个
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

    applyExternalInfo(info: any) {
        // 确保 subgridLayout 字段存在
        if (!info.subgridLayout) {
            info.subgridLayout = [];
        }

        // 添加 value 信息
        // 优先使用物品本身的 baseValue（从各个JSON文件加载的）
        if (info.baseValue && info.baseValue > 0) {
            // 物品本身已有价格，直接使用
        } else {
            // 如果物品没有价格，尝试从 values.json 查找
            const valueInfo = this.values.find((val: any) => val.objectID === info.objectID);
            if (valueInfo) {
                info.baseValue = valueInfo.baseValue;
            } else {
                console.warn(`未找到物品价格信息: objectID=${info.objectID}, objectName=${info.objectName}`);
                info.baseValue = 1;
            }
        }

        // 如果是子弹，随机添加数量
        if ( info.primaryClass === 'ammo') {
            // 暂时统一设置为60
            info.maxStack = 60;
            info.stack = Math.floor(Math.random() * 60) + 1;
        }

        // 添加搜索时间信息（TODO：当前默认为 1.2s，之后再写具体算法）
        info.searchTime = 1.2;
        return info;
    }

    getRandomItemWithPreset(preset: string | null) {
        if (!preset || !this.pickingPreset[preset]) {
            preset = 'default';
        }
        while(true) {
            const item = this.getRandomItem(this.pickingPreset[preset]);
            if(item) {
                return item;
            }
        }
    }

    /**
     * 预加载常用物品图片，使用PIXI.Assets批量加载以提升性能
     */
    async preloadCommonImages() {
        try {
            console.log('[ItemManager] 开始预加载物品图片...');

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
            console.log(`[ItemManager] 共需加载 ${urls.length} 张图片`);

            // 使用PIXI.Assets批量加载（支持并发，比逐个加载快得多）
            // 这会利用浏览器的HTTP/2多路复用和并行下载能力
            const loadPromises = urls.map(url => {
                return PIXI.Assets.load(url).catch((err: any) => {
                    // 忽略单个图片加载失败，不影响整体加载
                    console.warn(`预加载图片失败: ${url}`, err);
                    return null;
                });
            });

            // 等待所有图片加载完成
            await Promise.all(loadPromises);

            console.log(`[ItemManager] 图片预加载完成，成功加载 ${urls.length} 张`);
        } catch (error) {
            console.warn('[ItemManager] 预加载图片时出错，继续运行游戏', error);
        }
    }
}
