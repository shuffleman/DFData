import * as PIXI from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT, GAME_DEFAULT_CONFIG, getResponsiveLayout } from "./config";
import { Subgrid } from "./subgrid";
import { TotalValueDisplay } from "./totalValueDisplay";
import { RegionSwitchUI } from "./components/regionSwitchUI";
import { Timer } from "./components/timer";
import { ItemInfoPanel } from "./itemInfoPanel";
import { Item } from "./item";
import { TitleBar } from "./titleBar";
import { Region } from "./region";
// import { ItemManager } from "./components/ItemManager";
// import { DebugTools } from "./components/DebugTools";
import { initInventory, updateTotalValueDisplay } from "./utils";
import { ItemManager } from "./itemManager";
import { generateLocalLoot } from "./lootGenerator";
import { GroundButton } from "./components/GroundButton";
import { ResetButton } from "./components/ResetButton";
import { ScreenshotButton } from "./components/ScreenshotButton";
import { SearchAllButton } from "./components/SearchAllButton";
import { AutoOptimizeButton } from "./components/AutoOptimizeButton";
// import { Magnify } from "./magnify";

declare global {
    interface Window {
        game: Game;
        app: HTMLElement;
    }
}

/**
 * The Game class represents the main game instance.
 * It initializes the PIXI application, loads block types, and creates the game UI.
 */
export class Game {
    app: PIXI.Application;
    // Legacy debug property - kept for compatibility with debug tools (not used in production)
    BLOCK_TYPES: any[] = [];
    grids: Subgrid[];
    icon: PIXI.Texture | null;
    titleBar: TitleBar | null;
    defaultSpoilsRegionConfig: any[] = [];
    spoilsRegion: Region | null = null;

    // Components
    playerRegion: Region | null = null;
    totalValueDisplay: TotalValueDisplay | null;
    regionSwitchUI: RegionSwitchUI | null;
    isGameStarted: boolean;
    timer: Timer | null;
    instances: Array<any> = [];

    activeItemInfoPanel: ItemInfoPanel | null;

    /** 预设 */
    defaultSpoilsRegionNumber: number = 3;
    defaultPlayerRegionNumber: number = 1;
    presets: any[] = [];

    // 控制面板区域
    controlPanelRegion: Region | null = null;

    // debug
    // debugTools: DebugTools | null;

    // item manager
    itemManager: ItemManager;

    // 基础配置信息
    config: any = GAME_DEFAULT_CONFIG;

    constructor() {
        this.app = new PIXI.Application();
        this.grids = [];
        this.totalValueDisplay = null;
        this.regionSwitchUI = null;
        this.isGameStarted = false; // 是否开始游戏
        this.timer = null; // 计时器实例
        this.icon = null;
        this.titleBar = null;
        // this.scrollableContainer = null; // 滚动容器实例
        this.instances = [];
        this.activeItemInfoPanel = null;

        this.itemManager = new ItemManager();

        // default spoils region
        const storedRegions = localStorage.getItem('defaultSpoilsRegionConfig');
        if (storedRegions) {
            try {
                const parsedConfig = JSON.parse(storedRegions);
                // 检查配置版本，如果第一个不是 groundContainer，说明是旧版本，需要重置
                if (parsedConfig.length === 0 || parsedConfig[0].type !== 'groundContainer') {
                    console.log('检测到旧版本配置，重置为新版本');
                    this.initDefaultSpoilsRegionConfig();
                    // 保存新配置到 localStorage
                    localStorage.setItem('defaultSpoilsRegionConfig', JSON.stringify(this.defaultSpoilsRegionConfig));
                } else {
                    this.defaultSpoilsRegionConfig = parsedConfig;
                }
            } catch (e) {
                console.error('Failed to parse stored regions, using default config:', e);
                this.initDefaultSpoilsRegionConfig();
            }
        } else {
            this.initDefaultSpoilsRegionConfig();
        }

        /** Debuging */
        if (import.meta.env.MODE === "development") {
            this.config.needSearch = true; // 开发模式下也启用搜索
            // 使用本地数据源（从 data.json 转换而来）
            this.config.resource_cdn = 'local';
            this.config.realtime_value = 'local';
        }

        window.game = this;
    }

    private initDefaultSpoilsRegionConfig() {
        this.defaultSpoilsRegionConfig = [
            {type: "groundContainer", title: "地面容器", width: 15, height: 8},
            {type: "spoilsBox", title: "战利品1", width: 7, height: 8},
            {type: "spoilsBox", title: "战利品2", width: 7, height: 8},
            {type: "spoilsBox", title: "战利品3", width: 7, height: 8},
            {type: "playerContainer", title: "玩家盒子1"},
            {type: "playerContainer", title: "玩家盒子2"},
            {type: "playerContainer", title: "玩家盒子3"}
        ];
    }

    /**
     * Initialize the game, this method will be called when the game starts.
     * @returns {Promise<void>} A promise that resolves when the block types are loaded.
     * */
    async init(): Promise<void> {
        await this.loadResources();
        // Create PIXI application
        await this.createPixiApp();
        this.initGameUI();
        this.initGameComponents();

        // 初始化标题栏
        this.titleBar = new TitleBar();

        // 不再自动加载数据和开始游戏，等待用户点击开始按钮
        // await this.itemManager.loadResources();
        // this.startGameWithPreset(0);
    }

    /**
     * 刷新游戏 UI （一般用于更新配置后）
     */
    public refreshUI() {

    }

    public refreshUIRecursive() {
        this.refreshUI();
        if (this.playerRegion) {
            this.playerRegion.refreshUIRecursive();
        }
        if (this.spoilsRegion) {
            this.spoilsRegion.refreshUIRecursive();
        }
    }

    /**
     * 并行加载所有游戏资源
     * @returns {Promise<void>} 当所有资源加载完成时解析的Promise
     */
    private async loadResources(): Promise<void> {
        try {
            // 只加载图标
            const icon = await PIXI.Assets.load("/deltaforce.png");

            // 保存加载的资源
            this.icon = icon;

            // 隐藏加载提示
            const loadingElement = document.querySelector(".loading");
            if (loadingElement) {
                (loadingElement as HTMLElement).style.display = "none";
            }
        } catch (error) {
            console.error("Failed to load game resources:", error);
            const loadingElement = document.querySelector(".loading");
            if (loadingElement) {
                loadingElement.textContent = "加载游戏资源失败，请刷新重试";
            }
            throw error;
        }
    }

    /**
     * Create the PIXI application.
     * @returns {Promise<void>} A promise that resolves when the PIXI application is created.
     * */
    async createPixiApp(): Promise<void> {
        
        await this.app.init({
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            antialias: true,
            backgroundColor: 0x000000,
            resolution: window.devicePixelRatio || 1,
        });
        const appElement = document.getElementById("app");
        if (appElement) {
            appElement.appendChild(this.app.canvas);
            window.app = appElement;
            
            // 设置app元素样式
            appElement.style.cssText = `
                width: 100vw;
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                background: #000;
                overflow: hidden;
            `;

            // 自动调整canvas大小保持16:9
            const resizeCanvas = () => {
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const aspectRatio = 16 / 9;

                let width = windowWidth;
                let height = width / aspectRatio;

                if (height > windowHeight) {
                    height = windowHeight;
                    width = height * aspectRatio;
                }

                this.app.renderer.resize(width, height);
                this.app.canvas.style.width = `${width}px`;
                this.app.canvas.style.height = `${height}px`;

                // 更新所有区域的布局
                this.updateAllRegionsLayout();
            };

            // 初始调整和监听窗口大小变化
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            

            
        }

        // 添加更新循环
        this.app.ticker.add(() => {
            if(!this.spoilsRegion) return;
            for (const inventory of this.spoilsRegion.inventories) {
                inventory.update();
            }
            // if (this.playerInventory) {
            //     this.playerInventory.update();
            // }
        });
    }

    /**
     * Initialize the game UI.
     * */
    initGameUI() {
        // Create background
        // const bg = new PIXI.Graphics();
        // // bg.roundRect(0, 0, BASE_WIDTH, BASE_HEIGHT, 10);
        // // bg.fill({ color: 0x242f39 });
        // this.app.stage.addChild(bg);
    }

    /**
     * Initialize the game components.
     * */
    initGameComponents() {
        const layout = getResponsiveLayout();

        // 个人物资区域（无左侧组件）
        this.playerRegion = new Region(
            {x: layout.playerRegion.x, y: layout.playerRegion.y},
            {
                title: "个人物资",
                width: layout.playerRegion.width,
                height: layout.playerRegion.height,
                titleColor: 0xffffff,
                titleAlpha: 0.3,
                componentWidth: layout.playerRegion.componentWidth,
                titleHeight: layout.playerRegion.titleHeight,
                backgroundColor: 0xffffff,
                backgroundAlpha: 0.1,
                countable: true
            }
        );
        this.playerRegion.addInventory(1, false);
        this.playerRegion.switchTo(0);

        // 控制面板区域
        this.controlPanelRegion = new Region(
            {x: layout.controlPanel.x, y: layout.controlPanel.y},
            {
                title: "控制面板",
                width: layout.controlPanel.width,
                height: layout.controlPanel.height,
                titleColor: 0x4a9eff,
                titleAlpha: 0.3,
                componentWidth: layout.controlPanel.componentWidth,
                titleHeight: layout.controlPanel.titleHeight,
                backgroundColor: 0xffffff,
                backgroundAlpha: 0.1,
                countable: false
            }
        );
        this.controlPanelRegion.addComponent('totalValueDisplay', TotalValueDisplay);
        this.controlPanelRegion.addComponent('timer', Timer);
        this.controlPanelRegion.addComponent('groundButton', GroundButton);
        this.controlPanelRegion.addComponent('resetButton', ResetButton);
        this.controlPanelRegion.addComponent('screenshotButton', ScreenshotButton);
        this.controlPanelRegion.addComponent('searchAllButton', SearchAllButton);
        this.controlPanelRegion.addComponent('autoOptimizeButton', AutoOptimizeButton);

        this.updateAllRegionsLayout();
    }

    createItemInfoPanel(item: Item) {
        // 如果已经存在面板，则不创建新的
        if (this.activeItemInfoPanel) {
            return;
        }

        // 如果游戏还没开始，不创建面板
        if (!this.isGameStarted) {
            return;
        }

        // 创建面板
        this.activeItemInfoPanel = new ItemInfoPanel(
            this,
            item,
            (this.app.screen.width - 420) / 2,  // 居中显示
            (this.app.screen.height - 636) / 2,
            [
                {
                    text: "丢弃",
                    callback: () => {
                        // 将物品添加到地面容器（战利品区域的第一个inventory）
                        if (this.spoilsRegion && this.spoilsRegion.inventories.length > 0) {
                            const groundInventory = this.spoilsRegion.inventories[0];
                            const groundGrid = groundInventory.contents['groundContainer'];

                            if (groundGrid) {
                                // 从当前位置移除物品
                                if (item.parentGrid) {
                                    item.parentGrid.removeItem(item);
                                }

                                // 添加到地面容器
                                if (groundGrid instanceof Subgrid) {
                                    groundGrid.addItem(item);
                                }
                            } else {
                                // 如果没有地面容器，则销毁
                                item.destroy();
                            }
                        } else {
                            // 如果没有战利品区域，则销毁
                            item.destroy();
                        }

                        this.activeItemInfoPanel?.close();
                        updateTotalValueDisplay();
                    }
                }
            ]
        );
    }

    /**
     * 工具函数，根据全局坐标查找对应的 Subgrid
     * @param x x坐标
     * @param y y坐标
     * @returns 返回找到的 Subgrid 或 null 表示没有找到
     */
    findGrid(x: number, y: number) {
        // 先检查是否位于 itemInfoPanel 的 Subgrid 内
        if (this.activeItemInfoPanel) {
            for (const subgrid of this.activeItemInfoPanel.getSubgrids()) {
                const bounds = subgrid.container.getBounds();
                if (
                    x >= bounds.x &&
                    x <= bounds.x + bounds.width &&
                    y >= bounds.y &&
                    y <= bounds.y + bounds.height
                ) {
                    // console.log(bounds.x, bounds.y, bounds.width, bounds.height)
                    return subgrid;
                }
            }
            const bounds = this.activeItemInfoPanel.getBounds()
            if (
                x >= bounds.x &&
                x <= bounds.x + bounds.width &&
                y >= bounds.y &&
                y <= bounds.y + bounds.height
            ) {
                return null;
            }
        }
        // 不位于 itemInfoPanel，也没有被遮挡
        for (const subgrid of this.grids.filter(grid => grid.enabled)) {
            // console.log(subgrid)
            const bounds = subgrid.container.getBounds();
            // 检查坐标是否在当前网格的范围内
            if (
                x >= bounds.x &&
                x <= bounds.x + bounds.width &&
                y >= bounds.y &&
                y <= bounds.y + bounds.height
            ) {
                // Debug
                // const parentInventory = (subgrid.parentRegion as Region).inventories.find((inventory) => {
                //     for (const grid of Object.values(inventory.contents)) {
                //         if (grid instanceof Subgrid) {
                //             if (grid === subgrid) {
                //             return true;
                //         } else if (grid instanceof GridContainer) {
                //             if (grid.subgrids.includes(subgrid)) {
                //                 return true;
                //             }
                //         }
                //     }
                //     return false;
                // });
                // console.log(subgrid)
                return subgrid; // 返回找到的 Grid 实例
            }
        }
        return null; // 如果没有找到对应的 Grid，则返回 null
    }

    async startGameWithPreset(idx: number) {
        if (idx < 0 || idx > this.presets.length) {
            return;
        }

        if (this.spoilsRegion) {
            this.spoilsRegion.destroy();
        }

        // find timer and clear

        const layout = getResponsiveLayout();

        const region = new Region(
            {x: layout.spoilsRegion.x, y: layout.spoilsRegion.y},
            {
                title: "战利品",
                width: layout.spoilsRegion.width,
                height: layout.spoilsRegion.height,
                titleColor: 0x999999,
                titleAlpha: 0.3,
                componentWidth: layout.spoilsRegion.componentWidth,
                titleHeight: layout.spoilsRegion.titleHeight,
                backgroundColor: 0xffffff,
                backgroundAlpha: 0.1,
                countable: false,
            }
        );

        if (idx === 0) {
            // 根据配置选择数据源
            const useLocalData = this.config.resource_cdn === 'local';

            if (useLocalData) {
                console.log('本地模式：使用本地战利品生成器...');
                try {
                    // 使用本地战利品生成器 - 保持6个容器，增加每个箱子内的物品数量
                    const preset_data = generateLocalLoot(3, 3);  // 3个战利品箱，3个玩家箱
                    console.log('本地战利品数据生成成功:', preset_data);

                    for (const preset of preset_data.data) {
                        const inventory_type = preset.type === 'playerContainer' ? 1 : 0;
                        const inventory = region.addInventory(inventory_type, false);
                        initInventory(inventory, inventory_type, preset);
                        inventory.setEnabled(false);
                    }

                    // 始终添加地面容器（固定显示）
                    console.log('添加固定地面容器');
                    region.addInventory(2, false, '地面容器');
                } catch (error) {
                    console.error('本地生成战利品失败:', error);
                    // 降级到默认配置
                    this.loadDefaultConfig(region);
                }
            } else {
                console.log('API模式：从API加载随机战利品数据...');
                try {
                    // 调用后端API生成随机战利品
                    const response = await fetch('/api/public/gameitem/generate-loot?spoilsCount=3&playerCount=3');
                    const result = await response.json();

                    if (result.success && result.data) {
                        console.log('随机战利品数据加载成功:', result.data);
                        const preset_data = result.data;

                        for (const preset of preset_data.data) {
                            const inventory_type = preset.type === 'playerContainer' ? 1 : 0;
                            const inventory = region.addInventory(inventory_type, false);
                            initInventory(inventory, inventory_type, preset);
                            inventory.setEnabled(false);
                        }

                        // 始终添加地面容器（固定显示）
                        console.log('添加固定地面容器');
                        region.addInventory(2, false, '地面容器');
                    } else {
                        console.error('加载随机战利品失败:', result.message);
                        // 降级到默认配置
                        this.loadDefaultConfig(region);
                    }
                } catch (error) {
                    console.error('调用API失败:', error);
                    // 降级到默认配置
                    this.loadDefaultConfig(region);
                }
            }
        } else {
            const preset_data = this.presets[idx - 1];
            for ( const preset of preset_data.data) {
                const inventory_type = preset.type === 'playerContainer' ? 1 : 0;
                const inventory = region.addInventory(inventory_type, false);
                initInventory(inventory, inventory_type, preset);
                inventory.setEnabled(false);
            }
        }
        // console.log('23334')
        region.switchTo(0);
        region.addTabSwitcherUI(); // 使用 Tab 切换代替箭头切换
        this.spoilsRegion = region;
        this.updateAllRegionsLayout();
    }

    private loadDefaultConfig(region: Region) {
        console.log('使用默认配置初始化战利品区域');
        this.defaultSpoilsRegionConfig.forEach((val, index) => {
            console.log(`处理配置 ${index}:`, val, 'type:', val.type);
            if (val.type === "groundContainer") {
                console.log('添加地面容器:', val.title);
                region.addInventory(2, false, val.title);
            } else if (val.type === "spoilsBox") {
                console.log('添加战利品容器:', val.title);
                region.addInventory(0, true, val.title);
            } else if (val.type === "playerContainer") {
                console.log('添加玩家容器:', val.title);
                region.addInventory(1, true, val.title);
            } else {
                console.log('未知类型，添加为战利品容器:', val.title);
                region.addInventory(0, true, val.title);
            }
        });
        console.log('所有容器添加完成，inventories 数量:', region.inventories.length);
    }

    /**
     * 更新所有区域的布局以适应新的屏幕尺寸
     */
    updateAllRegionsLayout() {
        const layout = getResponsiveLayout();

        // 更新个人物资区域
        if (this.playerRegion) {
            this.playerRegion.updateLayout(
                {x: layout.playerRegion.x, y: layout.playerRegion.y},
                {
                    width: layout.playerRegion.width,
                    height: layout.playerRegion.height,
                    componentWidth: layout.playerRegion.componentWidth,
                    titleHeight: layout.playerRegion.titleHeight
                }
            );
        }

        // 更新战利品区域
        if (this.spoilsRegion) {
            this.spoilsRegion.updateLayout(
                {x: layout.spoilsRegion.x, y: layout.spoilsRegion.y},
                {
                    width: layout.spoilsRegion.width,
                    height: layout.spoilsRegion.height,
                    componentWidth: layout.spoilsRegion.componentWidth,
                    titleHeight: layout.spoilsRegion.titleHeight
                }
            );
        }

        // 更新控制面板区域
        if (this.controlPanelRegion) {
            this.controlPanelRegion.updateLayout(
                {x: layout.controlPanel.x, y: layout.controlPanel.y},
                {
                    width: layout.controlPanel.width,
                    height: layout.controlPanel.height,
                    componentWidth: layout.controlPanel.componentWidth,
                    titleHeight: layout.controlPanel.titleHeight
                }
            );
        }
    }
}
