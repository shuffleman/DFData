import * as PIXI from "pixi.js";

export class ScreenshotButton {
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

        // 创建截图按钮
        const button = this.createButton("截图", 20, 15, () => {
            this.takeScreenshot();
        });

        this.container.addChild(button);
    }

    private createButton(label: string, x: number, y: number, onClick: Function) {
        const button = new PIXI.Container();

        // 按钮背景
        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, 180, 30, 5);
        bg.fill(0x2196F3); // 蓝色

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
            bg.tint = 0x1976D2;
        });
        button.on('pointerout', () => {
            bg.tint = 0xFFFFFF;
        });

        return button;
    }

    private takeScreenshot() {
        try {
            // 使用 PIXI 的 extract 功能截取整个舞台
            const app = window.game.app;

            // 提取画布为图片
            const canvas = app.renderer.extract.canvas(app.stage);
            if (canvas && canvas.toBlob) {
                canvas.toBlob((blob) => {
                    if (blob) {
                        // 创建下载链接
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        link.download = `delta-force-screenshot-${timestamp}.png`;
                        link.href = url;
                        link.click();

                        // 清理
                        setTimeout(() => URL.revokeObjectURL(url), 100);
                    }
                }, 'image/png');
            }
        } catch (error) {
            console.error('截图失败:', error);
            alert('截图失败，请重试');
        }
    }
}
