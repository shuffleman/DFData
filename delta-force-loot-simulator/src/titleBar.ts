import * as PIXI from "pixi.js";

export class TitleBar {
    private container: PIXI.Container;
    private iconSprite: PIXI.Sprite | null = null;
    private titleText: PIXI.Text;

    iconWidth: number = 48;
    iconHeight: number = 48;
    titleTextWidth: number = 120;
    titleTextHeight: number = 32;
    textPaddingX: number = 12;
    textPaddingY: number = 8;

    constructor() {
        this.container = new PIXI.Container();
        
        // 创建标题文本
        this.titleText = new PIXI.Text({
            text: "三角洲 - 炒菜模拟器（舔包模拟器）",
            style: {
                fontFamily: "Arial",
                fontSize: 24,
                fill: 0xffffff,
                fontWeight: "bold",
                stroke: { color: "black", width: 3 },
            }
        });

        //this.initUI();
    }

    /**
     * 更新标题栏
     * 如果图标在之后才加载完成，可以调用此方法更新UI
     */
    public update() {
        if (window.game.icon && !this.iconSprite) {
            this.iconSprite = new PIXI.Sprite(window.game.icon);
            this.iconSprite.width = this.iconWidth;
            this.iconSprite.height = this.iconHeight;
            this.container.addChildAt(this.iconSprite, 0);
            this.titleText.position.set(this.iconWidth + this.textPaddingX, this.textPaddingY);
        }
    }

    /**
     * 销毁标题栏
     */
    public destroy() {
        this.container.destroy(true);
    }
}
