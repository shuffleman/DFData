import * as PIXI from "pixi.js";

/**
 * Tab标签页切换UI组件
 */
export class TabSwitchUI {
    container: PIXI.Container;
    private tabs: PIXI.Container[] = [];
    private tabLabels: string[] = [];
    private currentIndex: number = 0;
    private switchCallback: (index: number) => void;

    constructor(
        labels: string[],
        switchCallback: (index: number) => void,
        initialIndex: number = 0
    ) {
        this.tabLabels = labels;
        this.switchCallback = switchCallback;
        this.currentIndex = initialIndex;
        this.container = new PIXI.Container();
        this.initUI();
    }

    /**
     * 初始化 UI 组件
     */
    initUI() {
        const tabWidth = 120;
        const tabHeight = 36;
        const tabSpacing = 4;

        this.tabLabels.forEach((label, index) => {
            const tabContainer = new PIXI.Container();
            const xPos = index * (tabWidth + tabSpacing);

            // 标签背景
            const bg = new PIXI.Graphics();
            const isActive = index === this.currentIndex;

            if (isActive) {
                // 激活状态：实心背景
                bg.roundRect(0, 0, tabWidth, tabHeight, 8);
                bg.fill({ color: 0xff6b6b, alpha: 0.8 });
            } else {
                // 非激活状态：边框样式
                bg.roundRect(0, 0, tabWidth, tabHeight, 8);
                bg.fill({ color: 0xffffff, alpha: 0.1 });
                bg.stroke({ color: 0xffffff, width: 2, alpha: 0.3 });
            }

            bg.eventMode = "static";
            bg.cursor = "pointer";
            tabContainer.addChild(bg);

            // 标签文本
            const text = new PIXI.Text({
                text: label,
                style: {
                    fontFamily: "Arial",
                    fontSize: 16,
                    fill: isActive ? 0xffffff : 0xcccccc,
                    fontWeight: isActive ? "bold" : "normal",
                },
            });
            text.anchor.set(0.5);
            text.position.set(tabWidth / 2, tabHeight / 2);
            tabContainer.addChild(text);

            // 点击事件
            bg.on("pointerdown", () => {
                this.switchTo(index);
            });

            // 悬停效果
            bg.on("pointerover", () => {
                if (index !== this.currentIndex) {
                    bg.clear();
                    bg.roundRect(0, 0, tabWidth, tabHeight, 8);
                    bg.fill({ color: 0xffffff, alpha: 0.2 });
                    bg.stroke({ color: 0xffffff, width: 2, alpha: 0.5 });
                }
            });

            bg.on("pointerout", () => {
                if (index !== this.currentIndex) {
                    bg.clear();
                    bg.roundRect(0, 0, tabWidth, tabHeight, 8);
                    bg.fill({ color: 0xffffff, alpha: 0.1 });
                    bg.stroke({ color: 0xffffff, width: 2, alpha: 0.3 });
                }
            });

            tabContainer.position.set(xPos, 0);
            this.tabs.push(tabContainer);
            this.container.addChild(tabContainer);
        });
    }

    /**
     * 切换到指定的标签页
     */
    switchTo(index: number) {
        if (index === this.currentIndex || index < 0 || index >= this.tabLabels.length) {
            return;
        }

        this.currentIndex = index;
        this.updateTabStyles();
        this.switchCallback(index);
    }

    /**
     * 更新所有标签的样式
     */
    private updateTabStyles() {
        const tabWidth = 120;
        const tabHeight = 36;

        this.tabs.forEach((tabContainer, index) => {
            const bg = tabContainer.children[0] as PIXI.Graphics;
            const text = tabContainer.children[1] as PIXI.Text;
            const isActive = index === this.currentIndex;

            // 更新背景
            bg.clear();
            if (isActive) {
                bg.roundRect(0, 0, tabWidth, tabHeight, 8);
                bg.fill({ color: 0xff6b6b, alpha: 0.8 });
            } else {
                bg.roundRect(0, 0, tabWidth, tabHeight, 8);
                bg.fill({ color: 0xffffff, alpha: 0.1 });
                bg.stroke({ color: 0xffffff, width: 2, alpha: 0.3 });
            }

            // 更新文本样式
            text.style.fill = isActive ? 0xffffff : 0xcccccc;
            text.style.fontWeight = isActive ? "bold" : "normal";
        });
    }

    /**
     * 更新标签文本
     */
    updateLabels(labels: string[]) {
        this.tabLabels = labels;
        this.container.removeChildren();
        this.tabs = [];
        this.initUI();
    }

    /**
     * 获取当前选中的索引
     */
    getCurrentIndex(): number {
        return this.currentIndex;
    }
}
