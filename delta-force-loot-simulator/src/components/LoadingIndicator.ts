import * as PIXI from "pixi.js";

export class LoadingIndicator {
    private container: PIXI.Container;
    private background: PIXI.Graphics;
    private loadingText: PIXI.Text;
    private spinner: PIXI.Graphics;
    private ticker: PIXI.Ticker;
    private rotation: number = 0;

    constructor() {
        this.container = new PIXI.Container();
        this.background = new PIXI.Graphics();
        this.loadingText = new PIXI.Text();
        this.spinner = new PIXI.Graphics();
        this.ticker = new PIXI.Ticker();

        this.initUI();
    }

    private initUI() {
        // 半透明背景遮罩
        this.background.rect(0, 0, window.game.app.screen.width, window.game.app.screen.height);
        this.background.fill({ color: 0x000000, alpha: 0.7 });
        this.container.addChild(this.background);

        // 加载框背景
        const loadingBox = new PIXI.Graphics();
        loadingBox.roundRect(-150, -80, 300, 160, 10);
        loadingBox.fill({ color: 0xffffff, alpha: 0.95 });
        loadingBox.position.set(
            window.game.app.screen.width / 2,
            window.game.app.screen.height / 2
        );
        this.container.addChild(loadingBox);

        // 加载文本
        this.loadingText = new PIXI.Text({
            text: "加载游戏数据中...",
            style: {
                fontFamily: "Arial",
                fontSize: 24,
                fill: 0x333333,
                fontWeight: "bold",
            },
        });
        this.loadingText.anchor.set(0.5);
        this.loadingText.position.set(
            window.game.app.screen.width / 2,
            window.game.app.screen.height / 2 + 30
        );
        this.container.addChild(this.loadingText);

        // 旋转的加载图标
        this.drawSpinner();
        this.spinner.position.set(
            window.game.app.screen.width / 2,
            window.game.app.screen.height / 2 - 20
        );
        this.container.addChild(this.spinner);

        // 启动旋转动画
        this.ticker.add(() => {
            this.rotation += 0.1;
            this.spinner.rotation = this.rotation;
        });
        this.ticker.start();
    }

    private drawSpinner() {
        const radius = 30;
        const segments = 8;

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const alpha = (i + 1) / segments;

            this.spinner.circle(x, y, 5);
            this.spinner.fill({ color: 0x4CAF50, alpha });
        }
    }

    public show() {
        window.game.app.stage.addChild(this.container);
    }

    public hide() {
        this.ticker.stop();
        if (this.container.parent) {
            window.game.app.stage.removeChild(this.container);
        }
    }

    public destroy() {
        this.ticker.destroy();
        this.container.destroy({ children: true });
    }
}
