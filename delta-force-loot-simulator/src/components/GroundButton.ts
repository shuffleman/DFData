import * as PIXI from "pixi.js";

export class GroundButton {
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

        // 创建按钮
        const button = this.createButton("打开地面容器", 20, 15, () => {
            // 切换到地面容器（战利品区域的第一个inventory）
            if (window.game.spoilsRegion) {
                window.game.spoilsRegion.switchTo(0);
            }
        });

        this.container.addChild(button);
    }

    private createButton(label: string, x: number, y: number, onClick: Function) {
        const button = new PIXI.Container();

        // 按钮背景
        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, 180, 30, 5);
        bg.fill(0x4CAF50);

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
            bg.tint = 0x45A049;
        });
        button.on('pointerout', () => {
            bg.tint = 0xFFFFFF;
        });

        return button;
    }
}
