import * as PIXI from 'pixi.js';

/**
 * 控制面板组件
 * 显示操作按钮和统计信息
 */
export class ControlPanel extends PIXI.Container {
  private panelWidth: number;
  private panelHeight: number;
  private background: PIXI.Graphics;

  constructor(width: number, height: number) {
    super();

    this.panelWidth = width;
    this.panelHeight = height;

    // 创建背景
    this.background = new PIXI.Graphics();
    this.addChild(this.background);
    this.draw();

    // 创建标题
    const title = new PIXI.Text('控制面板', {
      fontSize: 18,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    title.x = 10;
    title.y = 10;
    this.addChild(title);

    // 创建按钮区域
    this.createButtons();

    // 创建统计信息区域
    this.createStats();
  }

  /**
   * 绘制背景
   */
  private draw(): void {
    this.background.clear();
    this.background.beginFill(0x1a1a1a, 0.9);
    this.background.lineStyle(2, 0x444444);
    this.background.drawRect(0, 0, this.panelWidth, this.panelHeight);
    this.background.endFill();
  }

  /**
   * 创建按钮
   */
  private createButtons(): void {
    let yPos = 50;

    // 整理按钮
    this.createButton('整理物品', yPos, () => {
      console.log('整理物品');
    });
    yPos += 50;

    // 全部拾取按钮
    this.createButton('拾取全部', yPos, () => {
      console.log('拾取全部');
    });
    yPos += 50;

    // 丢弃按钮
    this.createButton('丢弃物品', yPos, () => {
      console.log('丢弃物品');
    });
  }

  /**
   * 创建单个按钮
   */
  private createButton(text: string, yPos: number, onClick: () => void): void {
    const button = new PIXI.Container();
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.x = 10;
    button.y = yPos;

    // 背景
    const bg = new PIXI.Graphics();
    bg.beginFill(0x444444);
    bg.lineStyle(1, 0x666666);
    bg.drawRoundedRect(0, 0, this.panelWidth - 20, 40, 5);
    bg.endFill();
    button.addChild(bg);

    // 文本
    const buttonText = new PIXI.Text(text, {
      fontSize: 14,
      fill: 0xffffff,
    });
    buttonText.x = (this.panelWidth - 20 - buttonText.width) / 2;
    buttonText.y = 10;
    button.addChild(buttonText);

    // 事件
    button.on('pointerdown', onClick);
    button.on('pointerover', () => {
      bg.clear();
      bg.beginFill(0x555555);
      bg.lineStyle(1, 0x888888);
      bg.drawRoundedRect(0, 0, this.panelWidth - 20, 40, 5);
      bg.endFill();
    });
    button.on('pointerout', () => {
      bg.clear();
      bg.beginFill(0x444444);
      bg.lineStyle(1, 0x666666);
      bg.drawRoundedRect(0, 0, this.panelWidth - 20, 40, 5);
      bg.endFill();
    });

    this.addChild(button);
  }

  /**
   * 创建统计信息
   */
  private createStats(): void {
    const statsY = 200;

    // 统计标题
    const statsTitle = new PIXI.Text('统计信息', {
      fontSize: 16,
      fill: 0xaaaaaa,
      fontWeight: 'bold',
    });
    statsTitle.x = 10;
    statsTitle.y = statsY;
    this.addChild(statsTitle);

    // 物品数量
    const itemCount = new PIXI.Text('物品: 0', {
      fontSize: 12,
      fill: 0xffffff,
    });
    itemCount.x = 10;
    itemCount.y = statsY + 30;
    this.addChild(itemCount);

    // 总重量
    const totalWeight = new PIXI.Text('重量: 0.0 kg', {
      fontSize: 12,
      fill: 0xffffff,
    });
    totalWeight.x = 10;
    totalWeight.y = statsY + 50;
    this.addChild(totalWeight);

    // 总价值
    const totalValue = new PIXI.Text('价值: ¥0', {
      fontSize: 12,
      fill: 0xffffff,
    });
    totalValue.x = 10;
    totalValue.y = statsY + 70;
    this.addChild(totalValue);
  }

  /**
   * 销毁
   */
  override destroy(options?: boolean | PIXI.IDestroyOptions): void {
    this.background.destroy();
    super.destroy(options);
  }
}
