import * as PIXI from "pixi.js";
import { GridTitle } from "./gridTitle";
import { Subgrid } from "./subgrid";
import { GridContainer } from "./gridContainer";
import { DEFAULT_CELL_SIZE } from "./config";
import { Item } from "./item";
import { Magnify } from "./magnify";
import { Region } from "./region";

/**
 * Inventory，可以代表一个玩家的盒子或一个地图中的容器（保险、航空箱、鸟窝、井盖等）。
 * 如果是普通容器，一般只包含一个 Subgrid，若是玩家盒子，则会包含多个 GridContainer、GridTitle 和 Subgrid。
 * @param {Game} game - The game instance
 * @param {number} x - The x coordinate of the container
 * @param {number} y - The y coordinate of the container
 * @param {number} width - The width of the container
 * @param {number} height - The height of the container
 * */
export class Inventory {
    // Inventory 的标题
    title: string;

    // UI相关
    private width: number;
    private height: number;
    container: PIXI.Container;

    // 所有包含的子网格
    contents: { [key: string]: GridTitle | Subgrid | GridContainer };

    // 是否计算价值（左侧的当前总价值）
    countable: boolean;

    // Inventory 的所在区域。（是在个人物资区域还是战利品区域，如果是枪上的配件需要单独处理）
    // （虽然 Inventory 不可能是一个枪的配件，但还是这么写了，方便处理）
    parentRegion: Region | Item | null = null;

    // 滚动相关
    scrollable: boolean | number;  // true=玩家盒子, false=战利品盒, 2=地面容器
    baseY: number = 0;
    maxHeight: number = 128;

    // 启用状态（false 将会不可见，此时无法将 Item 拖动到对应的 Inventory 中）
    enabled: boolean = true;

    // 搜索相关（放大镜转圈）
    private currentSearchItem: Item | null = null;
    private magnify: Magnify | null = null;
    private searchTimer: number = 0;

    // UI元素引用
    private mask: PIXI.Graphics | null = null;
    private bg: PIXI.Graphics | null = null;

    constructor(
        title: string,
        options: {
            position: {x: number, y: number},
            size: {width: number, height: number},
            countable: boolean,
            scrollable: boolean | number,  // true=玩家盒子, false=战利品盒, 2=地面容器
            parentRegion: Region | Item | null,
        }
    ) {
        this.title = title;
        this.countable = options.countable;
        this.scrollable = options.scrollable;
        this.width = options.size.width;
        this.height = options.size.height;
        this.parentRegion = options.parentRegion;

        this.contents = {};
        this.container = new PIXI.Container();
        this.container.position.set(options.position.x, options.position.y);

        this.initUI();
        this.initContent();
        this.refreshUI();
    }

    /**
     * 初始化 UI
     */
    initUI () {
        // 创建遮罩
        this.mask = new PIXI.Graphics();
        this.mask.rect(0, 0, this.width, this.height);
        this.mask.fill({ color: 0xffffff });
        this.container.addChild(this.mask);
        this.container.mask = this.mask;

        this.bg = new PIXI.Graphics();
        this.bg.rect(0, 0, this.width, this.height);
        this.bg.fill({ color: 0xffffff, alpha: 0.1 });
        this.container.addChild(this.bg);

        // 添加滚动事件
        this.container.interactive = true;
        this.container.on("wheel", this.onScroll.bind(this));
    }

    /**
     * 初始化内容。如果是玩家盒子的话就创建需要的头、甲、枪、背包、胸挂等。
     */
    initContent() {
        if (this.scrollable === true) {
            // scrollable=true: 玩家盒子，创建装备槽
            // 硬编码的装备配置
            const gridConfigs = [
                // 装备槽
                { type: 'Grid', name: 'PrimaryWeapon1', accept: ['gunRifle', 'gunSMG', 'gunShotgun', 'gunLMG', 'gunMP', 'gunSniper'], cellsize: 128, aspect: 2.0, fullfill: true },
                { type: 'Grid', name: 'Secondary', accept: ['gunPistol'], cellsize: 128, aspect: 1.0, fullfill: true },
                { type: 'Grid', name: 'PrimaryWeapon2', accept: ['gunRifle', 'gunSMG', 'gunShotgun', 'gunLMG', 'gunMP', 'gunSniper'], cellsize: 128, aspect: 2.0, fullfill: true },
                { type: 'Grid', name: 'Knife', accept: ['knife'], cellsize: 128, aspect: 1.0, fullfill: true },
                { type: 'Grid', name: 'Helmet', accept: ['helmet'], cellsize: 128, aspect: 1.0, fullfill: true },
                { type: 'Grid', name: 'Armor', accept: ['armor'], cellsize: 128, aspect: 1.0, fullfill: true },

                // 胸挂
                { type: 'GridTitle', name: '胸挂' },
                { type: 'Grid', name: 'ChestRig', accept: ['chest'], cellsize: 108, aspect: 1.0, fullfill: true },
                { type: 'GridContainer', name: 'ContainerChestRigs' },

                // 口袋
                { type: 'GridTitle', name: '口袋' },
                { type: 'GridContainer', name: 'pocket' },

                // 背包
                { type: 'GridTitle', name: '背包' },
                { type: 'Grid', name: 'Backpack', accept: ['bag'], cellsize: 100, aspect: 1.0, fullfill: true },
                { type: 'GridContainer', name: 'ContainerBackpack' },

                // 安全箱
                { type: 'GridTitle', name: '安全箱' },
                { type: 'GridContainer', name: 'ContainerSecure' }
            ];

            // 创建所有组件
            for (const info of gridConfigs) {
                if (info.type === 'Grid') {
                    const subgrid = new Subgrid({
                        size: {width: 1, height: 1},
                        cellSize: info.cellsize,
                        aspect: info.aspect,
                        fullfill: info.fullfill,
                        countable: this.countable,
                        accept: info.accept,
                        title: info.name
                    });
                    subgrid.parentRegion = this.parentRegion;
                    this.contents[info.name] = subgrid;
                    this.container.addChild(subgrid.container);
                } else if (info.type === 'GridTitle') {
                    const gridTitle = new GridTitle(
                        window.game,
                        info.name,
                        36,
                        13.8
                    );
                    this.contents[info.name] = gridTitle;
                    this.container.addChild(gridTitle.container);
                } else if (info.type === 'GridContainer') {
                    // 为安全箱设置黑名单：不允许放入武器、护甲、头盔、背包、胸挂、配件等
                    const rejectedTypes = info.name === 'ContainerSecure' ? [
                        // 武器类型
                        'gunRifle', 'gunSMG', 'gunShotgun', 'gunLMG', 'gunMP', 'gunSniper', 'gunPistol',
                        // 装备类型
                        'armor', 'helmet', 'bag', 'chest', 'knife',
                        // 配件类型（所有以 acc 开头的）
                        'accForeGrip', 'accSight', 'accMuzzle', 'accStock', 'accMagazine', 'accBarrel',
                        'accHandguard', 'accRail', 'accGrip', 'accScope', 'accLight', 'accLaser', 'accPatch'
                    ] : [];

                    const gridContainer = new GridContainer(
                        window.game,
                        info.name,
                        [],
                        4,
                        false,
                        DEFAULT_CELL_SIZE,
                        1,
                        false,
                        this.countable,
                        [],
                        rejectedTypes
                    );
                    gridContainer.parentRegion = this.parentRegion;
                    this.contents[info.name] = gridContainer;
                    this.container.addChild(gridContainer.container);
                }
            }

            // 定义口袋
            (this.contents['pocket'] as GridContainer).layout = [
                [1, 1, 0, 0], [1, 1, 1.05, 0], [1, 1, 2.1, 0], [1, 1, 3.15, 0], [1, 1, 4.2, 0]
            ];
            (this.contents['pocket'] as GridContainer).initSubgrids();

            // 定义安全箱
            (this.contents['ContainerSecure'] as GridContainer).layout = [
                [3, 3, 0, 0]
            ];
            (this.contents['ContainerSecure'] as GridContainer).initSubgrids();

            try {
                // 胸挂回调函数
                (this.contents['ChestRig'] as Subgrid).onItemDraggedIn = (item, _col, _row) => {
                    // 关联容器Item
                    (this.contents['ContainerChestRigs'] as GridContainer).associatedItem = item;

                    (this.contents['ContainerChestRigs'] as GridContainer).layout = item.subgridLayout || [];
                    if (Object.keys(item.subgrids).length > 0) {
                        for (const subgrid of Object.values(item.subgrids)) {
                            // 更新 subgrid 的 parentRegion 指向 GridContainer
                            subgrid.parentRegion = this.contents['ContainerChestRigs'] as any;
                            (this.contents['ContainerChestRigs'] as GridContainer).subgrids.push(subgrid);
                        }
                        (this.contents['ContainerChestRigs'] as GridContainer).refreshUI();
                    } else {
                        (this.contents['ContainerChestRigs'] as GridContainer).initSubgrids();
                    }
                    this.refreshUI();
                }
                (this.contents['ChestRig'] as Subgrid).onItemDraggedOut = (item) => {
                    // 清除关联
                    (this.contents['ContainerChestRigs'] as GridContainer).associatedItem = null;

                    item.subgrids = {};
                    for (const subgrid of Object.values((this.contents['ContainerChestRigs'] as GridContainer).subgrids)) {
                        item.subgrids[subgrid.title] = subgrid;
                        // 恢复 subgrid 的 parentRegion
                        subgrid.parentRegion = this.parentRegion;
                    }
                    (this.contents['ContainerChestRigs'] as GridContainer).layout = [];
                    (this.contents['ContainerChestRigs'] as GridContainer).initSubgrids();
                    this.refreshUI();
                }
            } catch(error) {
                console.error('添加胸挂道具时出现错误：', this.contents['ChestRig'])
                console.error(error)
            }

            try{
                // 背包回调函数
                (this.contents['Backpack'] as Subgrid).onItemDraggedIn = (item, _col, _row) => {
                    // 关联容器Item
                    (this.contents['ContainerBackpack'] as GridContainer).associatedItem = item;

                    (this.contents['ContainerBackpack'] as GridContainer).layout = item.subgridLayout || [];
                    if (Object.keys(item.subgrids).length > 0) {
                        for (const subgrid of Object.values(item.subgrids)) {
                            // 更新 subgrid 的 parentRegion 指向 GridContainer
                            subgrid.parentRegion = this.contents['ContainerBackpack'] as any;
                            (this.contents['ContainerBackpack'] as GridContainer).subgrids.push(subgrid);
                        }
                        (this.contents['ContainerBackpack'] as GridContainer).refreshUI();
                    } else {
                        (this.contents['ContainerBackpack'] as GridContainer).initSubgrids();
                    }
                    this.refreshUI();
                }
                (this.contents['Backpack'] as Subgrid).onItemDraggedOut = (item) => {
                    // 清除关联
                    (this.contents['ContainerBackpack'] as GridContainer).associatedItem = null;

                    item.subgrids = {};
                    for (const subgrid of Object.values((this.contents['ContainerBackpack'] as GridContainer).subgrids)) {
                        item.subgrids[subgrid.title] = subgrid;
                        // 恢复 subgrid 的 parentRegion
                        subgrid.parentRegion = this.parentRegion;
                    }
                    (this.contents['ContainerBackpack'] as GridContainer).layout = [];
                    (this.contents['ContainerBackpack'] as GridContainer).initSubgrids();
                    this.refreshUI();
                }
            } catch(error) {
                console.error('添加背包道具时出现错误：', this.contents['Backpack'])
                console.error(error)
            }
        } else if (this.scrollable === 2) {
            // scrollable=2: 地面容器，创建15x8网格
            const cellSize = 72;
            const gridWidth = 15;
            const gridHeight = 8;

            const groundContainer = new Subgrid({
                size: {width: gridWidth, height: gridHeight},
                cellSize: cellSize,
                aspect: 1,
                fullfill: false,
                countable: false,
                accept: [],
                title: "groundContainer"
            });
            groundContainer.parentRegion = this.parentRegion;
            this.contents["groundContainer"] = groundContainer;
            this.container.addChild(groundContainer.container);
        } else {
            // scrollable=false: 战利品盒子
            // 计算战利品盒子的初始尺寸
            const cellSize = 72;
            const availableWidth = this.width - 16; // 左右各8px边距
            const availableHeight = this.height - 16; // 上下各8px边距
            const gridWidth = Math.floor(availableWidth / cellSize);
            const gridHeight = Math.floor(availableHeight / cellSize);

            const spoilsBox = new Subgrid({
                size: {width: gridWidth, height: gridHeight},
                cellSize: cellSize,
                aspect: 1,
                fullfill: false,
                countable: false,
                accept: [],
                title: "spoilsBox"
            });
            spoilsBox.parentRegion = this.parentRegion;
            this.contents["spoilsBox"] = spoilsBox;
            this.container.addChild(spoilsBox.container);
        }
    }

    /**
     * 刷新 UI（部分对 UI 的调整需要刷新）
     */
    refreshUI() {
        // 定义左右分栏的起始位置
        const leftColumnX = 8;
        const rightColumnX = 280; // 减小右侧列的起始X位置，缩小间距

        let leftY = this.baseY + 8;
        let rightY = this.baseY + 8;

        // 装备区的组件名称（左侧）- 按新顺序排列
        const equipmentOrder = ['Helmet', 'Armor', 'Secondary', 'Knife', 'PrimaryWeapon1', 'PrimaryWeapon2'];

        // 容器区的组件顺序（右侧）
        const containerOrder = [
            '胸挂', 'ChestRig', 'ContainerChestRigs',
            '口袋', 'pocket',
            '背包', 'Backpack', 'ContainerBackpack',
            '安全箱', 'ContainerSecure'
        ];

        // 先按顺序布局左侧装备
        for (const itemName of equipmentOrder) {
            const item = this.contents[itemName];
            if (item && item instanceof Subgrid) {
                item.container.position.set(leftColumnX, leftY);
                leftY += 136; // 每个装备项高度
            }
        }

        // 再布局右侧容器
        for (const itemName of containerOrder) {
            const item = this.contents[itemName];
            if (!item || !item.container || !item.container.position) {
                continue;
            }

            if (item instanceof GridTitle) {
                item.container.position.set(rightColumnX, rightY);
                rightY += item.container.height + 8;
            } else if (item instanceof Subgrid) {
                item.container.position.set(rightColumnX, rightY);
                rightY += item.additiveSize.y + 8;
            } else if (item instanceof GridContainer) {
                item.container.position.set(rightColumnX, rightY);
                rightY += item.additiveSize.y + 8;
            }
        }

        // 计算最大高度用于滚动
        this.maxHeight = Math.max(leftY, rightY) - this.baseY - 580;
    }

    public refreshUIRecursive() {
        this.refreshUI();
        for (const content of Object.values(this.contents)) {
            content.refreshUIRecursive();
        }
    }

    /**
     * 更新 Inventory 的尺寸
     */
    public updateSize(width: number, height: number) {
        this.width = width;
        this.height = height;

        // 重新绘制遮罩
        if (this.mask) {
            this.mask.clear();
            this.mask.rect(0, 0, this.width, this.height);
            this.mask.fill({ color: 0xffffff });
        }

        // 重新绘制背景
        if (this.bg) {
            this.bg.clear();
            this.bg.rect(0, 0, this.width, this.height);
            this.bg.fill({ color: 0xffffff, alpha: 0.1 });
        }

        // 如果是战利品盒子（非滚动式），计算并更新 Subgrid 的尺寸
        if (!this.scrollable && this.contents['spoilsBox']) {
            const spoilsBox = this.contents['spoilsBox'] as Subgrid;
            const cellSize = spoilsBox.cellSize;

            // 计算可用空间（减去边距）
            const availableWidth = this.width - 16; // 左右各8px边距
            const availableHeight = this.height - 16; // 上下各8px边距

            // 计算可以容纳的格子数
            const gridWidth = Math.floor(availableWidth / cellSize);
            const gridHeight = Math.floor(availableHeight / cellSize);

            // 更新 Subgrid 尺寸
            spoilsBox.updateSize(gridWidth, gridHeight);
        }

        // 刷新UI
        this.refreshUI();
    }

    /**
     * Handle the scroll event
     * @param {PIXI.FederatedMouseEvent} event - The scroll event
     * */
    onScroll(event: any) {
        const delta = event.deltaY; // 获取滚动的方向和距离
        this.baseY -= delta; // 根据滚动方向调整内容位置

        // clamp
        if (this.baseY > 0) {
            this.baseY = 0;
        } else if (this.baseY < -(this.maxHeight)) {
            this.baseY = -this.maxHeight
        }
        this.refreshUI();
        // console.log(this.baseY)
    }

    /**
     * 设置启用状态
     * @param enabled 是否启用
     */
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        // 遍历所有的subgrid并设置启用状态
        // console.log(this)
        for (const grid of Object.values(this.contents)) {
            grid.setEnabled(enabled);
        }
        // console.log(this)
        this.container.visible = enabled;
        this.refreshUI();
    }

    /**
     * 添加一个物品。
     * （Inventory 处理：如果是能装备的道具，尽量先尝试装备，无法装备在转移到背包里）
     * @param item 要添加的物品
     * @returns 是否添加成功
     */
    addItem(item: Item) {
        for (const subgrid of Object.values(this.contents).filter(item => item instanceof Subgrid)) {
            if (subgrid.addItem(item)) {
                return true;
            }
        }
        for (const subgrid of Object.values(this.contents).filter(item => item instanceof GridContainer)) {
            if (subgrid.addItem(item)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 清空所有物品
     */
    clearItem() {
        for (const subgrid of Object.values(this.contents)) {
            if (subgrid instanceof GridTitle) {
                continue;
            }
            subgrid.clearItem();
        }
    }

    /**
     * Tick 函数，一般每帧执行一次
     */
    update() {
        if (!this.enabled || !window.game.config.needSearch) {
            this.currentSearchItem = null;
            if(this.magnify) {
                this.magnify.hide();
                this.magnify = null;
            }
            this.searchTimer = 0;
            return;
        }
        // 检查是否有需要搜索的物品
        if (window.game.config.needSearch && !this.currentSearchItem) {
            const itemToSearch = this.findNextSearchableItem();
            if (itemToSearch) {
                this.startSearchItem(itemToSearch);
            }
        }

        // 更新搜索计时
        if (this.currentSearchItem) {
            this.searchTimer += window.game.app.ticker.deltaMS / 1000; // 转换为秒
            const searchTime = this.currentSearchItem.info.searchTime ? this.currentSearchItem.info.searchTime : 1.2;
            if (this.searchTimer >= searchTime) { // 1秒后完成搜索
                this.completeSearch();
            }
        }
    }

    /**
     * 找到下一个需要搜索的物品
     * @returns 下一个需要搜索的物品，若没有则返回 null
     */
    private findNextSearchableItem(): Item | null {
        // 首先在当前 inventory 中查找
        for (const key in this.contents) {
            const content = this.contents[key];
            if (content instanceof Subgrid) {
                for (const item of content.blocks) {
                    if (!item.searched) {
                        return item;
                    }
                }
            } else if (content instanceof GridContainer) {
                for (const subgrid of content.subgrids) {
                    for (const item of subgrid.blocks) {
                        if (!item.searched) {
                            return item;
                        }
                    }
                }
            }
        }

        // 如果当前 inventory 中没有待搜索物品，检查个人物资区域
        if (window.game.playerRegion) {
            for (const inventory of window.game.playerRegion.inventories) {
                for (const key in inventory.contents) {
                    const content = inventory.contents[key];
                    if (content instanceof Subgrid) {
                        for (const item of content.blocks) {
                            if (!item.searched) {
                                return item;
                            }
                        }
                    } else if (content instanceof GridContainer) {
                        for (const subgrid of content.subgrids) {
                            for (const item of subgrid.blocks) {
                                if (!item.searched) {
                                    return item;
                                }
                            }
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * 开始搜索物品
     * @param item 要搜索的物品
     */
    private startSearchItem(item: Item) {
        this.currentSearchItem = item;
        this.searchTimer = 0;

        // 创建放大镜动画
        if(!this.currentSearchItem.parentGrid) return;
        const parentGrid = this.currentSearchItem.parentGrid;
        const x = (this.currentSearchItem.col + (this.currentSearchItem.cellWidth-1) / 2) * parentGrid.cellSize * parentGrid.aspect;
        const y = (this.currentSearchItem.row + (this.currentSearchItem.cellHeight-1) / 2) * parentGrid.cellSize;
        this.magnify = new Magnify(
            parentGrid.container,
            x,
            y,
            72,
            72
        );
        this.magnify.show();
    }

    /**
     * 完成搜索
     */
    private completeSearch() {
        if (this.currentSearchItem) {
            this.currentSearchItem.searched = true;
            this.currentSearchItem.searchMask.visible = false;
            this.currentSearchItem.refreshUI();
        }

        // 移除放大镜
        if (this.magnify) {
            this.magnify.hide();
            this.magnify = null;
        }

        this.currentSearchItem = null;
        this.searchTimer = 0;
    }
    
    destroy() {
        Object.values(this.contents).forEach((content: GridTitle | Subgrid | GridContainer) => {
            content.destroy();
        });
        this.container.destroy();
    }
}
