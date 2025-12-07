import * as PIXI from "pixi.js";

export class ResetButton {
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

        // 创建还原按钮
        const button = this.createButton("还原", 20, 15, () => {
            // 还原游戏状态
            if (confirm("确定要还原游戏吗？这将重置所有数据。")) {
                window.location.reload();
            }
        });

        this.container.addChild(button);
    }

    private createButton(label: string, x: number, y: number, onClick: Function) {
        const button = new PIXI.Container();

        // 按钮背景
        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, 180, 30, 5);
        bg.fill(0xFF9800); // 橙色

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
            bg.tint = 0xE68900;
        });
        button.on('pointerout', () => {
            bg.tint = 0xFFFFFF;
        });

        return button;
    }
}
