/**
 * 游戏配置文件
 * 包含布局、尺寸、资源URL等配置
 */

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

// 品质颜色
export const RARITY_COLORS = [
  0x808080, 0x808080, 0x367e68, 0x4b6b87,
  0x695687, 0xa16e50, 0xa14a4c, 0xa14a4c
];

/**
 * 计算自适应布局参数
 * 根据当前屏幕尺寸按比例计算各区域的位置和尺寸
 */
export const getResponsiveLayout = () => {
  const { width, height } = getGameSize();
  const scaleY = height / BASE_HEIGHT;

  // 控制面板固定宽度在最右侧
  const controlPanelWidth = 246;
  const controlPanelX = width - controlPanelWidth - 30;

  // 个人物资区域固定宽度
  const playerRegionWidth = 800;
  const playerRegionX = 30;

  // 战利品区域填充中间空间
  const spoilsRegionX = playerRegionX + playerRegionWidth + 14;
  const spoilsRegionWidth = controlPanelX - spoilsRegionX - 14;

  return {
    // 个人物资区域
    playerRegion: {
      x: playerRegionX,
      y: 72 * scaleY,
      width: playerRegionWidth,
      height: 632 * scaleY,
      componentWidth: 0,
      titleHeight: 50
    },
    // 战利品区域
    spoilsRegion: {
      x: spoilsRegionX,
      y: 72 * scaleY,
      width: spoilsRegionWidth,
      height: 632 * scaleY,
      componentWidth: 0,
      titleHeight: 50
    },
    // 控制面板区域
    controlPanel: {
      x: controlPanelX,
      y: 72 * scaleY,
      width: controlPanelWidth,
      height: 632 * scaleY,
      componentWidth: controlPanelWidth,
      titleHeight: 50
    },
    scaleY
  };
};

/**
 * 游戏资源CDN配置
 */
export const GAME_RESOURCE_CDN = {
  local: {
    item_info: [
      { name: 'collection', url: '/normalized_data/props/collection.json' },
      { name: 'armor', url: '/normalized_data/protect/armor.json' },
      { name: 'backpack', url: '/normalized_data/container/backpack.json' },
      { name: 'chestRigs', url: '/normalized_data/container/chestRigs.json' },
      { name: 'helmet', url: '/normalized_data/protect/helmet.json' },
      { name: 'gunRifle', url: '/normalized_data/gun/gunRifle.json' },
      { name: 'gunPistol', url: '/normalized_data/gun/gunPistol.json' },
      { name: 'ammo', url: '/normalized_data/props/ammo.json' },
      { name: 'accBackGrip', url: '/normalized_data/acc/accBackGrip.json' },
      { name: 'accBarrel', url: '/normalized_data/acc/accBarrel.json' },
      { name: 'accForeGrip', url: '/normalized_data/acc/accForeGrip.json' },
      { name: 'accFunctional', url: '/normalized_data/acc/accFunctional.json' },
      { name: 'accHandGuard', url: '/normalized_data/acc/accHandGuard.json' },
      { name: 'accMagazine', url: '/normalized_data/acc/accMagazine.json' },
      { name: 'accMuzzle', url: '/normalized_data/acc/accMuzzle.json' },
      { name: 'accScope', url: '/normalized_data/acc/accScope.json' },
      { name: 'accStock', url: '/normalized_data/acc/accStock.json' },
      { name: 'consume', url: '/normalized_data/props/consume.json' },
      { name: 'key', url: '/normalized_data/props/key.json' }
    ],
    gunSlotMap: '/normalized_data/gunSlotMap.json',
    dataJson: '/normalized_data/data.json'
  },
  api: {
    item_info: [
      { name: 'collection', url: '/api/public/gameitem/items-by-class?primaryClass=collectible' },
      { name: 'armor', url: '/api/public/gameitem/items-by-class?primaryClass=protect&secondClass=armor' },
      { name: 'backpack', url: '/api/public/gameitem/items-by-class?primaryClass=container&secondClass=bag' },
      { name: 'chestRigs', url: '/api/public/gameitem/items-by-class?primaryClass=container&secondClass=chest' },
      { name: 'helmet', url: '/api/public/gameitem/items-by-class?primaryClass=protect&secondClass=helmet' },
      { name: 'gunRifle', url: '/api/public/gameitem/items-by-class?primaryClass=gun&secondClass=rifle' },
      { name: 'gunPistol', url: '/api/public/gameitem/items-by-class?primaryClass=gun&secondClass=pistol' },
      { name: 'ammo', url: '/api/public/gameitem/items-by-class?primaryClass=ammo' },
      { name: 'accBackGrip', url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accBackGrip' },
      { name: 'accBarrel', url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accBarrel' },
      { name: 'accForeGrip', url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accForeGrip' },
      { name: 'accFunctional', url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accFunctional' },
      { name: 'accHandGuard', url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accHandGuard' },
      { name: 'accMagazine', url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accMagazine' },
      { name: 'accMuzzle', url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accMuzzle' },
      { name: 'accScope', url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accScope' },
      { name: 'accStock', url: '/api/public/gameitem/items-by-class?primaryClass=acc&secondClass=accStock' },
      { name: 'consume', url: '/api/public/gameitem/items-by-class?primaryClass=consumable' },
      { name: 'key', url: '/api/public/gameitem/items-by-class?primaryClass=container' }
    ],
    gunSlotMap: '/api/public/gun-slot-map',
    dataJson: '/api/public/data'
  },
  jsdelivr: {
    item_info: [
      { name: 'collection', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/props/collection.json' },
      { name: 'armor', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/protect/armor.json' },
      { name: 'backpack', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/container/backpack.json' },
      { name: 'chestRigs', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/container/chestRigs.json' },
      { name: 'helmet', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/protect/helmet.json' },
      { name: 'gunRifle', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/gun/gunRifle.json' },
      { name: 'gunPistol', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/gun/gunPistol.json' },
      { name: 'ammo', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/props/ammo.json' },
      { name: 'accBackGrip', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accBackGrip.json' },
      { name: 'accBarrel', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accBarrel.json' },
      { name: 'accForeGrip', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accForeGrip.json' },
      { name: 'accFunctional', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accFunctional.json' },
      { name: 'accHandGuard', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accHandGuard.json' },
      { name: 'accMagazine', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accMagazine.json' },
      { name: 'accMuzzle', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accMuzzle.json' },
      { name: 'accScope', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accScope.json' },
      { name: 'accStock', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/acc/accStock.json' },
      { name: 'consume', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/props/consume.json' },
      { name: 'key', url: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/props/key.json' }
    ],
    gunSlotMap: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/gunSlotMap.json',
    dataJson: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/data.json'
  }
};

/**
 * 实时价格数据URL
 */
export const REALTIME_VALUE: { [key: string]: string } = {
  local: '/normalized_data/values.json',
  jsdelivr: 'https://cdn.jsdelivr.net/gh/panedioic/delta-force-loot-simulator@master/public/json/values.json',
  api: '/api/public/gameitem/values'
};

/**
 * 游戏默认配置
 */
export const GAME_DEFAULT_CONFIG = {
  displayGridTitle: false,
  needSearch: false,
  resource_cdn: 'local' as 'local' | 'jsdelivr' | 'api',
  realtime_value: 'local' as 'local' | 'api' | 'jsdelivr'
};
