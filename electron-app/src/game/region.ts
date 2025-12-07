import * as PIXI from "pixi.js";
import { Inventory } from "./invntory";
import { initInventory } from "./utils";
import { RegionSwitchUI } from "./components/regionSwitchUI";
import { TabSwitchUI } from "./components/TabSwitchUI";
import { Item } from "./item";

interface RegionOptions {
    title: string;
    width?: number;
    height?: number;
    titleColor?: number;
    titleAlpha?: number
    titleHeight?: number;
    backgroundColor?: number;
    backgroundAlpha?: number;
    componentWidth?: number;
    countable: boolean;
}

/**
 * 游戏中的区域组件，包含标题栏和内容区
 */
export class Region {
    private container: PIXI.Container;
    private switcherUI: RegionSwitchUI | null = null;
    private tabSwitchUI: TabSwitchUI | null = null;
    private currentComponentPosition: {
        x: number;
        y: number;
    } = {
        x: 12,
        y: 62,
    };

    public readonly components: { [key: string]: any } = {};
    public readonly inventories: Inventory[] = [];
    public currentInventoryId: number = 0;

    private options: RegionOptions;

    // 用于存储UI元素的引用，方便更新
    private titleBarBG: PIXI.Graphics | null = null;
    private titleText: PIXI.Text | null = null;
    private contentBG: PIXI.Graphics | null = null;

    constructor(pos: {x: number, y: number}, options: RegionOptions) {
        this.options = {
            width: 508,
            height: 632,
            titleColor: 0x999999,
            titleAlpha: 0.3,
            titleHeight: 50,
            backgroundColor: 0xffffff,
            componentWidth: 246,
            ...options
        };

        this.container = new PIXI.Container();
        this.container.position.set(pos.x, pos.y);

        this.initUI();

        // 将容器添加到游戏舞台
        window.game.app.stage.addChild(this.container);
    }

    private initUI() {
        // Title bar
        this.titleBarBG = new PIXI.Graphics();
        this.titleBarBG.rect(0, 0, this.options.width!, this.options.titleHeight!);
        this.titleBarBG.fill({ color: this.options.titleColor!, alpha: this.options.titleAlpha! });
        this.container.addChild(this.titleBarBG);

        this.titleText = new PIXI.Text({
            text: this.options.title!,
            style: {
                fontFamily: "Arial",
                fontSize: 24,
                fill: 0xffffff,
                fontWeight: "bold",
                stroke: { color: "black", width: 3 },
            },
        });
        this.titleText.anchor.set(0.5);
        this.titleText.position.set(56, this.options.titleHeight! / 2);
        this.container.addChild(this.titleText);

        // Content background
        this.contentBG = new PIXI.Graphics();
        this.contentBG.rect(0, this.options.titleHeight!, this.options.width!, this.options.height! - this.options.titleHeight!);
        this.contentBG.fill({ color: this.options.backgroundColor!, alpha: this.options.backgroundAlpha! });
        this.container.addChild(this.contentBG);
    }

    /**
     * 更新区域的位置和尺寸
     */
    public updateLayout(pos: {x: number, y: number}, size?: {width: number, height: number, componentWidth?: number, titleHeight?: number}) {
        // 更新容器位置
        this.container.position.set(pos.x, pos.y);

        // 如果提供了尺寸参数，更新尺寸
        if (size) {
            if (size.width !== undefined) this.options.width = size.width;
            if (size.height !== undefined) this.options.height = size.height;
            if (size.componentWidth !== undefined) this.options.componentWidth = size.componentWidth;
            if (size.titleHeight !== undefined) this.options.titleHeight = size.titleHeight;

            // 重新绘制UI元素
            if (this.titleBarBG) {
                this.titleBarBG.clear();
                this.titleBarBG.rect(0, 0, this.options.width!, this.options.titleHeight!);
                this.titleBarBG.fill({ color: this.options.titleColor!, alpha: this.options.titleAlpha! });
            }

            if (this.titleText) {
                this.titleText.position.set(56, this.options.titleHeight! / 2);
            }

            if (this.contentBG) {
                this.contentBG.clear();
                this.contentBG.rect(0, this.options.titleHeight!, this.options.width!, this.options.height! - this.options.titleHeight!);
                this.contentBG.fill({ color: this.options.backgroundColor!, alpha: this.options.backgroundAlpha! });
            }

            // 更新所有 Inventory 的尺寸
            const inventoryWidth = this.options.width! - (this.options.componentWidth || 0);
            const inventoryHeight = this.options.height! - (this.options.titleHeight || 0);

            for (const inventory of this.inventories) {
                inventory.updateSize(inventoryWidth, inventoryHeight);
            }

            // 刷新所有子组件
            this.refreshUIRecursive();
        }
    }

    public refreshUI() {
        // 目前没有需要做的
    }

    public refreshUIRecursive() {
        this.refreshUI();
        // 只刷新当前激活的 inventory 的 UI，其他的会在切换过去的时候刷新
        if (this.inventories[this.currentInventoryId]) {
            this.inventories[this.currentInventoryId].refreshUIRecursive();
        }
    }

    /**
     * 添加一个组件到内容区
     * @param component 要添加的组件
     */
    public addComponent(name: string, component: any) {
        const componentInstance = new component();
        this.components[name] = componentInstance;
        componentInstance.container.position.set(
            this.currentComponentPosition.x, this.currentComponentPosition.y);
        this.currentComponentPosition.y += componentInstance.additiveSize.y + 12;
        this.container.addChild(componentInstance.container);
    }

    /**
     * 添加一个物品栏到内容区
     * @param type 0 为普通容器，1 为玩家盒子，2 为地面容器
     */
    public addInventory(type: number, needToInit: boolean=true, title: string='') {
        const inventoryTitle = title ? title : this.options.title + (this.inventories.length + 1);

        // 根据type设置scrollable值
        // type 0: false (普通容器)
        // type 1: true (玩家盒子)
        // type 2: 2 (地面容器，15x8网格)
        const scrollableValue = type === 1 ? true : type === 2 ? 2 : false;

        const inventory = new Inventory(inventoryTitle, {
            position: {
                x: this.options.componentWidth ? this.options.componentWidth : 0,
                y: this.options.titleHeight ? this.options.titleHeight : 0,
            },
            size: {width: 514, height: 580},
            countable: this.options.countable,
            scrollable: scrollableValue,
            parentRegion: this,
        });

        this.inventories.push(inventory);
        this.container.addChild(inventory.container);
        if (needToInit) {
            initInventory(inventory, type);
        }
        inventory.setEnabled(false);
        return inventory;
    }

    addItem(item: Item) {
        return this.inventories[this.currentInventoryId].addItem(item);
    }

    public addSwitcherUI() {
        this.switcherUI = new RegionSwitchUI(
            () => {
                this.switchTo(this.currentInventoryId - 1);
            },
            () => {
                this.switchTo(this.currentInventoryId + 1);
            }
        );
        this.container.addChild(this.switcherUI.container);
        this.switcherUI.container.position.set(116, 10);
        this.switcherUI.updateText(`区域 ${this.currentInventoryId + 1}/${this.inventories.length}`);
    }

    /**
     * 添加 Tab 切换 UI（新的标签页式切换）
     */
    public addTabSwitcherUI() {
        // 获取所有 inventory 的标题作为标签
        const labels = this.inventories.map(inv => inv.title);
        console.log('创建 TabSwitchUI，标签列表:', labels);

        this.tabSwitchUI = new TabSwitchUI(
            labels,
            (index: number) => {
                this.switchTo(index);
            },
            this.currentInventoryId
        );

        this.container.addChild(this.tabSwitchUI.container);
        // 放置在标题栏内，居中偏右
        this.tabSwitchUI.container.position.set(120, 8);
    }

    public switchTo (id: number) {
        if (this.inventories.length === 0 || id >= this.inventories.length) {
            return;
        }
        if (id < 0) {
            return;
        }
        // console.log(id)
        this.inventories[this.currentInventoryId].setEnabled(false);
        this.currentInventoryId = id;
        this.inventories[this.currentInventoryId].setEnabled(true);

        // 更新旧的切换器UI
        this.switcherUI?.updateText(`区域 ${this.currentInventoryId + 1}/${this.inventories.length}`);

        // 更新Tab切换器UI
        if (this.tabSwitchUI && this.tabSwitchUI.getCurrentIndex() !== id) {
            this.tabSwitchUI.switchTo(id);
        }
    }

    /**
     * 更新区域内所有组件
     */
    public update() {
        for (const inventory of this.inventories) {
            inventory.update();
        }
    }

    /**
     * 销毁区域及其所有子组件
     */
    public destroy() {
        for (const inventory of this.inventories) {
            inventory.destroy();
        }
        this.container.destroy();
    }

    /**
     * 获取容器的边界
     */
    public getBounds(): PIXI.Bounds {
        return this.container.getBounds();
    }
}
