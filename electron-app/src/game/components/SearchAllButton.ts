import * as PIXI from "pixi.js";

export class SearchAllButton {
    public container: PIXI.Container;
    public additiveSize: {
        x: number,
        y: number
    } = {
        x: 220,
        y: 60
    }

    constructor() {
        this.container = new PIXI.Container();
        this.initUI();
    }

    private initUI() {
        // 创建按钮背景
        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, 220, 60, 10);
        bg.fill({ color: 0xffffff });
        this.container.addChild(bg);

        // 创建全部已搜索按钮
        const button = this.createButton("全部已搜索", 20, 15, () => {
            this.markAllAsSearched();
        });

        this.container.addChild(button);
    }

    private createButton(label: string, x: number, y: number, onClick: Function) {
        const button = new PIXI.Container();

        // 按钮背景
        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, 180, 30, 5);
        bg.fill(0x9C27B0); // 紫色

        // 按钮文本
        const text = new PIXI.Text({
            text: label,
            style: {
                fontFamily: "Arial",
                fontSize: 16,
                fill: 0xffffff,
                fontWeight: "bold",
            },
        });
        text.anchor.set(0.5);
        text.position.set(90, 15);

        button.addChild(bg, text);
        button.position.set(x, y);

        // 添加按钮交互
        button.eventMode = 'static';
        button.cursor = 'pointer';
        button.on('pointerdown', () => onClick());
        button.on('pointerover', () => {
            bg.tint = 0x7B1FA2;
        });
        button.on('pointerout', () => {
            bg.tint = 0xFFFFFF;
        });

        return button;
    }

    private markAllAsSearched() {
        let count = 0;

        // 遍历战利品区域的所有物品
        if (window.game.spoilsRegion) {
            for (const inventory of window.game.spoilsRegion.inventories) {
                count += this.markInventoryAsSearched(inventory);
            }
        }

        // 遍历个人物资区域的所有物品
        if (window.game.playerRegion) {
            for (const inventory of window.game.playerRegion.inventories) {
                count += this.markInventoryAsSearched(inventory);
            }
        }

        console.log(`已将 ${count} 个物品标记为已搜索`);
    }

    private markInventoryAsSearched(inventory: any): number {
        let count = 0;

        for (const content of Object.values(inventory.contents)) {
            // 处理 Subgrid
            if (content && typeof content === 'object' && 'blocks' in content && Array.isArray(content.blocks)) {
                for (const item of content.blocks) {
                    if (!item.searched) {
                        item.searched = true;
                        item.searchMask.visible = false;
                        count++;
                    }
                }
            }

            // 处理 GridContainer 中的 subgrids
            if (content && typeof content === 'object' && 'subgrids' in content && Array.isArray(content.subgrids)) {
                for (const subgrid of content.subgrids) {
                    if (subgrid.blocks) {
                        for (const item of subgrid.blocks) {
                            if (!item.searched) {
                                item.searched = true;
                                item.searchMask.visible = false;
                                count++;
                            }
                        }
                    }
                }
            }
        }

        return count;
    }
}
