// 基础设计尺寸（作为参考）
export const BASE_WIDTH = 1334;
export const BASE_HEIGHT = 750;

// 动态获取当前游戏尺寸
export const getGameSize = () => {
    if (typeof window !== 'undefined' && window.game?.app) {
        return {
            width: window.game.app.screen.width,
            height: window.game.app.screen.height
        };
    }
    return { width: BASE_WIDTH, height: BASE_HEIGHT };
};

// 保持向后兼容
export const GAME_WIDTH = BASE_WIDTH;
export const GAME_HEIGHT = BASE_HEIGHT;
export const DEFAULT_CELL_SIZE = 72;
export const RIGHT_REGION_COUNT = 6;

export const RARITY_COLORS = [0x808080, 0x808080, 0x367e68, 0x4b6b87, 0x695687, 0xa16e50, 0xa14a4c, 0xa14a4c];

/**
 * 计算自适应布局参数
 * 根据当前屏幕尺寸按比例计算各区域的位置和尺寸
 * 个人物资区域和战利品区域宽度自适应，控制面板固定在最右侧
 */
export const getResponsiveLayout = () => {
    const { width, height } = getGameSize();
    const scaleY = height / BASE_HEIGHT;

    // 控制面板固定宽度在最右侧
    const controlPanelWidth = 246;
    const controlPanelX = width - controlPanelWidth - 30; // 右侧留30px边距

    // 个人物资区域固定宽度（设置为800px）
    const playerRegionWidth = 800;
    const playerRegionX = 30;

    // 战利品区域填充中间空间
    const spoilsRegionX = playerRegionX + playerRegionWidth + 14; // 14px间距
    const spoilsRegionWidth = controlPanelX - spoilsRegionX - 14; // 与控制面板保持14px间距

    return {
        // 个人物资区域（固定宽度，无左侧组件）
        playerRegion: {
            x: playerRegionX,
            y: 72 * scaleY,
            width: playerRegionWidth,
            height: 632 * scaleY,
            componentWidth: 0, // 移除左侧组件区域
            titleHeight: 50
        },
        // 战利品区域（自适应宽度）
        spoilsRegion: {
            x: spoilsRegionX,
            y: 72 * scaleY,
            width: spoilsRegionWidth,
            height: 632 * scaleY,
            componentWidth: 0,
            titleHeight: 50
        },
        // 控制面板区域（固定宽度在最右侧）
        controlPanel: {
            x: controlPanelX,
            y: 72 * scaleY,
            width: controlPanelWidth,
            height: 632 * scaleY,
            componentWidth: controlPanelWidth, // 全宽度用于组件
            titleHeight: 50
        },
        scaleY
    };
};

export const GAME_RESOURCE_CDN = {
    local: {
        item_info: [
            {
                name: 'collection',
                url: '/json/props/collection.json'
            },
            {
                name: 'armor',
                url: '/json/protect/armor.json'
            },
            {
                name: 'backpack',
                url: '/json/container/backpack.json'
            },
            {
                name: 'chestRigs',
                url: '/json/container/chestRigs.json'
            },
            {
                name: 'helmet',
                url: '/json/protect/helmet.json'
            },
            {
                name: 'primaryWeapon',
                url: '/json/gun/gunRifle.json'
            },
            {
                name: 'secondaryWeapon',
                url: '/json/gun/gunPistol.json'
            },
            {
                name: 'ammo',
                url: '/json/props/ammo.json'
            },
            {
                name: 'accBackGrip',
                url: '/json/acc/accBackGrip.json'
            },
            {
                name: 'accBarrel',
                url: '/json/acc/accBarrel.json'
            },
            {
                name: 'accForeGrip',
                url: '/json/acc/accForeGrip.json'
            },
            {
                name: 'accFunctional',
                url: '/json/acc/accFunctional.json'
            },
            {
                name: 'accHandGuard',
                url: '/json/acc/accHandGuard.json'
            },
            {
                name: 'accMagazine',
                url: '/json/acc/accMagazine.json'
            },
            {
                name: 'accMuzzle',
                url: '/json/acc/accMuzzle.json'
            },
            {
                name: 'accScope',
                url: '/json/acc/accScope.json'
            },
            {
                name: 'accStock',
                url: '/json/acc/accStock.json'
            },
            {
                name: 'consume',
                url: '/json/props/consume.json'
            },
            {
                name: 'key',
                url: '/json/props/key.json'
            }
        ],
        gunSlotMap: "/json/gunSlotMap.json",
        dataJson: "/json/data.json"
    },
    api: {
        item_info: [
            {
                name: 'collection',
                url: '/api/public/gameitem/items-by-class?primaryClass=collectible'
            },
            {
                name: 'armor',
                url: '/api/public/gameitem/items-by-class?primaryClass=protect&secondClass=armor'
            },
            {
                name: 'backpack',
                url: '/api/public/gameitem/items-by-class?primaryClass=container&secondClass=bag'
            },
            {
                name: 'chestRigs',
                url: '/api/public/gameitem/items-by-class?primaryClass=container&secondClass=chest'
            },
            {
                name: 'helmet',
                url: '/api/public/gameitem/items-by-class?primaryClass=protect&secondClass=helmet'
            },
            {
                name: 'primaryWeapon',
                url: '/api/public/gameitem/items-by-class?primaryClass=gun&secondClass=gunRifle'
            },
            {
                name: 'secondaryWeapon',
                url: '/api/public/gameitem/items-by-class?primaryClass=gun&secondClass=gunPistol'
            },
            {
                name: 'ammo',
                url: '/api/public/gameitem/items-by-class?primaryClass=ammo'
            },
            {
                name: 'accBackGrip',
                url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accBackGrip'
            },
            {
                name: 'accBarrel',
                url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accBarrel'
            },
            {
                name: 'accForeGrip',
                url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accForeGrip'
            },
            {
                name: 'accFunctional',
                url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accFunctional'
            },
            {
                name: 'accHandGuard',
                url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accHandGuard'
            },
            {
                name: 'accMagazine',
                url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accMagazine'
            },
            {
                name: 'accMuzzle',
                url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accMuzzle'
            },
            {
                name: 'accScope',
                url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accScope'
            },
            {
                name: 'accStock',
                url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accStock'
            },
            {
                name: 'consume',
                url: '/api/public/gameitem/items-by-class?primaryClass=consumable'
            },
            {
                name: 'key',
                url: '/api/public/gameitem/items-by-class?primaryClass=container'
            }
        ],
        gunSlotMap: "/api/public/gun-slot-map",
        dataJson: "/api/public/data"
    },
    jsdelivr: {
        item_info: [
            {
                name: 'collection',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/props/collection.json'
            },
            {
                name: 'armor',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/protect/armor.json'
            },
            {
                name: 'backpack',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/protect/backpack.json'
            },
            {
                name: 'chestRigs',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/protect/chestRigs.json'
            },
            {
                name: 'helmet',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/protect/helmet.json'
            },
            {
                name: 'primaryWeapon',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/gun/gunRifle.json'
            },
            {
                name: 'secondaryWeapon',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/gun/gunPistol.json'
            },
            {
                name: 'ammo',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/gun/ammo.json'
            },
            {
                name: 'accBackGrip',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accBackGrip.json'
            },
            {
                name: 'accBarrel',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accBarrel.json'
            },
            {
                name: 'accForeGrip',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accForeGrip.json'
            },
            {
                name: 'accFunctional',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accFunctional.json'
            },
            {
                name: 'accHandGuard',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accHandGuard.json'
            },
            {
                name: 'accMagazine',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accMagazine.json'
            },
            {
                name: 'accMuzzle',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accMuzzle.json'
            },
            {
                name: 'accScope',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accScope.json'
            },
            {
                name: 'accStock',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accStock.json'
            },
            {
                name: 'consume',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/props/consume.json'
            },
            {
                name: 'key',
                url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/props/key.json'
            }
        ],
        gunSlotMap: "https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/gunSlotMap.json",
        dataJson: "https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/data.json"
    }
}

export const REALTIME_VALUE: { [key: string]: string } = {
    "local": "/json/values.json",
    "jsdelivr": "https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/values.json",
    "api": "/api/public/gameitem/values"
}

export const GAME_DEFAULT_CONFIG = {
    displayGridTitle: false,
    needSearch: true,
    resource_cdn: 'local',
    realtime_value: 'local'
}