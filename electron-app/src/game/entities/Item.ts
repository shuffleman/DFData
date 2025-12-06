/**
 * Item - 物品实体类
 * 负责物品的渲染、交互和状态管理
 */

import * as PIXI from 'pixi.js';
import type { ItemData, RARITY_COLORS } from '@types';
import { Subgrid } from '@core/Subgrid';

export class Item {
  // ========== 基础属性 ==========
  name: string;
  type: string;
  baseValue: number = 0;
  grade: number = 0;

  // ========== 网格属性 ==========
  cellWidth: number;
  cellHeight: number;
  col: number = 0;
  row: number = 0;

  // ========== 兼容性属性 ==========
  // Getters for backward compatibility with old code
  get width(): number {
    return this.cellWidth;
  }

  get height(): number {
    return this.cellHeight;
  }

  // category 根据 primaryClass 或 secondClass 返回
  get category(): string | undefined {
    return this.info.primaryClass || this.info.secondClass;
  }

  // ========== 渲染元素 ==========
  container: PIXI.Container;
  graphicsBg: PIXI.Graphics;
  itemSprite: PIXI.Sprite | null = null;
  graphicsText: PIXI.Container | null = null;

  // ========== 父级引用 ==========
  parentGrid: Subgrid | null = null;
  parentRegion: any | null = null;

  // ========== 原始数据 ==========
  info: ItemData;

  // ========== 武器相关 ==========
  caliber: string = '';
  capacity: number | null = null;
  ammo: { [key: number]: number} = {};
  ammoType: string = '';

  // ========== 配件相关 ==========
  accessories: any[] = [];
  subgrids: { [key: string]: Subgrid } = {};
  subgridLayout: [number, number, number, number][] = [];

  // ========== 堆叠相关 ==========
  maxStackCount: number = 1;
  currentStactCount: number = 1;

  // ========== 搜索状态 ==========
  searched: boolean = false;
  searchTime: number = 1.2;
  searchMask: PIXI.Graphics;

  // ========== 拖拽状态 ==========
  isDragging: boolean = false;
  hasMoved: boolean = false;

  // ========== 拖拽相关属性 ==========
  dragStartParentContainer: PIXI.Container | null = null;
  dragStartItemLocalPosition: PIXI.Point = new PIXI.Point(0, 0);
  dragStartItemGlobalPosition: PIXI.Point = new PIXI.Point(0, 0);
  dragStartMouseGlobalPoint: PIXI.Point = new PIXI.Point(0, 0);
  dragOverlay: PIXI.Graphics | null = null;
  previewIndicator: PIXI.Graphics | null = null;

  // ========== 点击相关 ==========
  clickCount: number = 0;
  clickTimeout: number | null = null;

  constructor(itemInfo: ItemData) {
    // 保存原始信息（必须在最前面）
    this.info = itemInfo;

    // 解析基础属性
    this.cellWidth = itemInfo.length || 1;
    this.cellHeight = itemInfo.width || 1;
    this.name = itemInfo.objectName || 'Unknown Item';
    this.type = this.parseItemType(itemInfo);
    this.baseValue = itemInfo.baseValue || 0;
    this.grade = itemInfo.grade || 0;
    this.searchTime = itemInfo.searchTime || 1.2;

    // 解析武器属性
    if (itemInfo.primaryClass === 'gun' && itemInfo.gunDetail) {
      this.caliber = itemInfo.gunDetail.caliber || '';
      this.capacity = itemInfo.gunDetail.capacity || null;
      this.accessories = itemInfo.gunDetail.accessory || itemInfo.gunDetail.allAccessory || [];
    }

    // 解析容器属性
    if (itemInfo.subgridLayout) {
      this.subgridLayout = itemInfo.subgridLayout;
    }

    // 解析堆叠属性
    if (itemInfo.stack) {
      this.maxStackCount = itemInfo.stack;
      this.currentStactCount = itemInfo.stack;
    }

    // 创建容器
    this.container = new PIXI.Container();
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';

    // 创建背景图形
    this.graphicsBg = new PIXI.Graphics();
    this.container.addChild(this.graphicsBg);

    // 创建搜索遮罩
    this.searchMask = new PIXI.Graphics();
    this.searchMask.visible = !this.searched;
    this.container.addChild(this.searchMask);

    // 初始化UI
    this.initUI();

    // 添加事件监听器（基础版本）
    this.addEventListeners();
  }

  // ========== 类型解析 ==========

  /**
   * 解析物品类型（从primaryClass和secondClass推断ItemType）
   */
  private parseItemType(itemInfo: ItemData): string {
    const primaryClass = itemInfo.primaryClass;
    const secondClass = itemInfo.secondClass;

    // 武器类型
    if (primaryClass === 'gun') {
      if (secondClass === 'rifle') return 'gunRifle';
      if (secondClass === 'smg') return 'gunSMG';
      if (secondClass === 'shotgun') return 'gunShotgun';
      if (secondClass === 'lmg') return 'gunLMG';
      if (secondClass === 'mp') return 'gunMP';
      if (secondClass === 'sniper') return 'gunSniper';
      if (secondClass === 'pistol') return 'gunPistol';
      return 'gunRifle'; // 默认
    }

    // 装备类型
    if (primaryClass === 'equipment') {
      if (secondClass === 'armor') return 'armor';
      if (secondClass === 'helmet') return 'helmet';
      if (secondClass === 'bag') return 'bag';
      if (secondClass === 'chest') return 'chest';
      if (secondClass === 'knife') return 'knife';
    }

    // 配件类型
    if (primaryClass === 'accessory') {
      return 'acc' + secondClass.charAt(0).toUpperCase() + secondClass.slice(1);
    }

    // 弹药类型
    if (primaryClass === 'ammunition') {
      return 'ammo';
    }

    // 消耗品
    if (primaryClass === 'consumable') {
      return 'consumable';
    }

    // 收集品
    if (primaryClass === 'collection') {
      return 'collection';
    }

    return secondClass || primaryClass || 'unknown';
  }

  // ========== 渲染方法 ==========

  /**
   * 初始化UI
   */
  private initUI(): void {
    const pixelWidth = this.cellWidth * 60;  // 默认cellSize=60
    const pixelHeight = this.cellHeight * 60;

    // 绘制背景和边框
    this.drawBackground(pixelWidth, pixelHeight);

    // 加载物品图片
    if (this.info.pic || this.info.imageUrl) {
      this.loadItemImage(pixelWidth, pixelHeight);
    }

    // 添加物品名称
    this.addItemName(pixelWidth, pixelHeight);

    // 绘制搜索遮罩
    this.drawSearchMask(pixelWidth, pixelHeight);
  }

  /**
   * 绘制背景
   */
  private drawBackground(width: number, height: number): void {
    this.graphicsBg.clear();

    // 品质颜色
    const rarityColors: { [key: number]: number } = {
      0: 0x808080,
      1: 0x4A90E2,
      2: 0x9B59B6,
      3: 0xF39C12,
      4: 0xE74C3C
    };
    const color = rarityColors[this.grade] || 0x808080;

    // 背景（PixiJS v7 API）
    this.graphicsBg.beginFill(color, 0.8);
    this.graphicsBg.drawRect(2, 2, width - 4, height - 4);
    this.graphicsBg.endFill();

    // 边框（PixiJS v7 API）
    this.graphicsBg.lineStyle(2, 0x666666, 1);
    this.graphicsBg.drawRect(2, 2, width - 4, height - 4);
  }

  /**
   * 加载物品图片
   */
  private loadItemImage(width: number, height: number): void {
    try {
      const imageUrl = this.info.imageUrl || `./normalized_data/images/${this.info.pic}`;
      const texture = PIXI.Texture.from(imageUrl);

      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.position.set(width / 2, height / 2);

      // 等待纹理加载后缩放
      if (texture.valid) {
        this.scaleSprite(sprite, texture, width, height);
      } else {
        texture.once('update', () => {
          this.scaleSprite(sprite, texture, width, height);
        });
      }

      this.itemSprite = sprite;
      this.container.addChild(sprite);
    } catch (error) {
      console.warn(`无法加载物品图片: ${this.info.pic}`, error);
    }
  }

  /**
   * 缩放精灵以适应格子
   */
  private scaleSprite(sprite: PIXI.Sprite, texture: PIXI.Texture, pixelWidth: number, pixelHeight: number): void {
    const padding = 8;
    const maxWidth = pixelWidth - padding * 2;
    const maxHeight = pixelHeight - padding * 2;

    // 计算缩放比例
    const scaleX = maxWidth / texture.width;
    const scaleY = maxHeight / texture.height;
    const scale = Math.min(scaleX, scaleY, 1); // 不放大，只缩小

    sprite.scale.set(scale);
  }

  /**
   * 添加物品名称
   */
  private addItemName(width: number, height: number): void {
    const textContainer = new PIXI.Container();

    // PixiJS v7 API：Text构造函数接受两个参数（text, style）
    const nameText = new PIXI.Text(this.name, {
      fontSize: 12,
      fill: 0xffffff,
      fontWeight: 'bold',
      dropShadow: true,
      dropShadowAlpha: 0.8,
      dropShadowAngle: 45,
      dropShadowBlur: 2,
      dropShadowColor: 0x000000,
      dropShadowDistance: 1
    });

    nameText.x = 4;
    nameText.y = 4;

    textContainer.addChild(nameText);
    this.graphicsText = textContainer;
    this.container.addChild(textContainer);
  }

  /**
   * 绘制搜索遮罩
   */
  private drawSearchMask(width: number, height: number): void {
    this.searchMask.clear();
    this.searchMask.beginFill(0x000000, 0.7);
    this.searchMask.drawRect(0, 0, width, height);
    this.searchMask.endFill();
  }

  /**
   * 刷新UI（在大小或状态改变后调用）
   */
  refreshUI(): void {
    if (!this.parentGrid) return;

    const pixelWidth = this.cellWidth * this.parentGrid.cellSize * this.parentGrid.aspect;
    const pixelHeight = this.cellHeight * this.parentGrid.cellSize;

    // 重绘背景
    this.drawBackground(pixelWidth, pixelHeight);

    // 更新搜索遮罩
    this.searchMask.visible = !this.searched;
    this.drawSearchMask(pixelWidth, pixelHeight);

    // 如果有精灵，更新缩放
    if (this.itemSprite && this.itemSprite.texture.valid) {
      this.scaleSprite(this.itemSprite, this.itemSprite.texture, pixelWidth, pixelHeight);
      this.itemSprite.position.set(pixelWidth / 2, pixelHeight / 2);
    }
  }

  // ========== 位置和大小方法 ==========

  /**
   * 调整大小
   */
  resize(width: number, height: number): void {
    // 这里不修改cellWidth/cellHeight，只是更新渲染
    this.refreshUI();
  }

  /**
   * 设置网格位置
   */
  setGridPosition(col: number, row: number): void {
    this.col = col;
    this.row = row;

    if (this.parentGrid) {
      this.container.position.set(
        col * this.parentGrid.cellSize * this.parentGrid.aspect + 2,
        row * this.parentGrid.cellSize + 2
      );
    }
  }

  // ========== 事件监听器 ==========

  /**
   * 添加事件监听器（基础版本）
   */
  private addEventListeners(): void {
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';

    // 悬停效果
    this.container.on('pointerover', () => {
      if (!this.isDragging && this.searched) {
        this.container.alpha = 0.9;
      }
    });

    this.container.on('pointerout', () => {
      if (!this.isDragging) {
        this.container.alpha = 1;
      }
    });

    // 鼠标按下 - 开始拖拽
    this.container.on('pointerdown', (event) => {
      if (!this.searched) {
        return;
      }

      // 增加点击计数
      this.clickCount++;

      // 初始化拖拽状态
      this.isDragging = false;
      this.hasMoved = false;

      // 记录初始位置
      this.dragStartParentContainer = this.container.parent;
      this.dragStartItemLocalPosition = this.container.position.clone();
      this.dragStartItemGlobalPosition = this.container.getGlobalPosition();
      this.dragStartMouseGlobalPoint = event.global.clone();

      // 绑定移动事件
      this.container.on('pointermove', this.onDragMove.bind(this));

      this.onDragStart(event);
    });

    // 鼠标释放 - 结束拖拽
    this.container.on('pointerup', () => {
      // 移除拖动事件监听
      this.container.off('pointermove');

      if (this.isDragging) {
        // 如果发生了拖动，不处理点击事件
        this.clickCount = 0;
        this.onDragEnd();
      } else {
        // 处理点击事件（单击/双击）
        if (this.clickCount === 1) {
          // 200ms 内没有第二次点击就认为是单击
          this.clickTimeout = window.setTimeout(() => {
            this.clickCount = 0;
            this.clickTimeout = null;
            this.onClick();
          }, 200);
        } else if (this.clickCount === 2) {
          // 双击
          if (this.clickTimeout) {
            window.clearTimeout(this.clickTimeout);
          }
          this.clickCount = 0;
          this.clickTimeout = null;
          this.onDoubleClick();
        }
      }
    });

    // 添加键盘事件监听（旋转功能）
    window.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  // ========== 拖拽相关方法 ==========

  /**
   * 开始拖动事件
   */
  private onDragStart(_event: PIXI.FederatedPointerEvent): void {
    // 占位，可在此处添加拖动开始时的额外逻辑
  }

  /**
   * 拖动移动事件
   */
  private onDragMove(event: PIXI.FederatedPointerEvent): void {
    // 检查是否移动超过阈值（3像素）才开始真正的拖动
    const dx = event.global.x - this.dragStartMouseGlobalPoint.x;
    const dy = event.global.y - this.dragStartMouseGlobalPoint.y;

    if (!this.isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      this.isDragging = true;
      this.hasMoved = true;
      this.container.alpha = 0.7;

      // 创建预览指示器
      if (!this.previewIndicator) {
        this.previewIndicator = new PIXI.Graphics();
        // 将预览指示器添加到舞台（需要全局访问）
        // 注意：这里需要通过父级引用访问舞台
        if (this.parentGrid && this.parentGrid.container.parent) {
          let stage = this.parentGrid.container.parent;
          while (stage.parent) {
            stage = stage.parent;
          }
          stage.addChild(this.previewIndicator);
        }
      }

      // 创建拖动覆盖层（半透明背景）
      if (!this.dragOverlay) {
        this.dragOverlay = new PIXI.Graphics();
        this.dragOverlay.beginFill(0x000000, 0.1);
        this.dragOverlay.drawRect(-10000, -10000, 20000, 20000);
        this.dragOverlay.endFill();
        this.container.addChild(this.dragOverlay);
      }

      // 移动到舞台顶层
      if (this.dragStartParentContainer) {
        const globalPosition = this.container.getGlobalPosition();
        // 移动到最顶层容器
        let stage = this.dragStartParentContainer;
        while (stage.parent) {
          stage = stage.parent;
        }
        stage.addChild(this.container);
        this.container.position.set(globalPosition.x, globalPosition.y);
      }
    }

    if (this.isDragging) {
      // 更新位置
      const newX = this.dragStartItemGlobalPosition.x + dx;
      const newY = this.dragStartItemGlobalPosition.y + dy;
      this.container.position.set(newX, newY);

      // 更新预览指示器
      this.updatePreviewIndicator(event.global.x, event.global.y);
    }
  }

  /**
   * 结束拖动事件
   */
  private onDragEnd(): void {
    this.container.alpha = 1;

    if (!this.isDragging) return;

    // 移除预览指示器和拖动覆盖层
    if (this.previewIndicator) {
      this.previewIndicator.parent?.removeChild(this.previewIndicator);
      this.previewIndicator.destroy();
      this.previewIndicator = null;
    }
    if (this.dragOverlay) {
      this.container.removeChild(this.dragOverlay);
      this.dragOverlay.destroy();
      this.dragOverlay = null;
    }

    // 1. 查找目标网格
    const game = (window as any).game;
    const currentPos = this.container.getGlobalPosition();
    const centerX = currentPos.x + (this.cellWidth * 60) / 2;
    const centerY = currentPos.y + (this.cellHeight * 60) / 2;

    const targetGrid = game?.findGrid(centerX, centerY);

    if (targetGrid && targetGrid.enabled) {
      // 2. 计算目标位置（网格坐标）
      const gridBounds = targetGrid.container.getBounds();
      const localX = centerX - gridBounds.x;
      const localY = centerY - gridBounds.y;

      const col = Math.floor(localX / (targetGrid.cellSize * targetGrid.aspect));
      const row = Math.floor(localY / targetGrid.cellSize);

      // 3. 验证位置合法性
      const canPlace =
        !targetGrid.checkForOverlap(this, col, row) &&
        targetGrid.checkBoundary(this, col, row) &&
        targetGrid.checkAccept(this);

      if (canPlace) {
        // 执行放置
        console.log(`[Item] 放置物品 ${this.name} 到网格 (${col}, ${row})`);

        // 从原网格移除（如果有）
        if (this.parentGrid && this.parentGrid !== targetGrid) {
          this.parentGrid.removeItem(this);
        }

        // 添加到目标网格
        targetGrid.addItem(this, col, row, false);

        this.isDragging = false;
        this.hasMoved = false;
        return;
      }
    }

    // 4. 无法放置，返回原位置
    console.log(`[Item] 无法放置 ${this.name}，返回原位置`);
    if (this.dragStartParentContainer && this.parentGrid) {
      this.container.position.copyFrom(this.dragStartItemLocalPosition);
      this.dragStartParentContainer.addChild(this.container);
    }

    this.isDragging = false;
    this.hasMoved = false;
  }

  /**
   * 更新预览指示器
   */
  private updatePreviewIndicator(x: number, y: number): void {
    if (!this.previewIndicator) return;

    this.previewIndicator.clear();

    // 1. 查找目标网格
    const game = (window as any).game;
    const currentPos = this.container.getGlobalPosition();
    const centerX = currentPos.x + (this.cellWidth * 60) / 2;
    const centerY = currentPos.y + (this.cellHeight * 60) / 2;

    const targetGrid = game?.findGrid(centerX, centerY);

    if (!targetGrid || !targetGrid.enabled) {
      return;
    }

    // 2. 计算吸附位置（网格坐标）
    const gridBounds = targetGrid.container.getBounds();
    const localX = centerX - gridBounds.x;
    const localY = centerY - gridBounds.y;

    const col = Math.floor(localX / (targetGrid.cellSize * targetGrid.aspect));
    const row = Math.floor(localY / targetGrid.cellSize);

    // 3. 检查放置合法性
    const canPlace =
      !targetGrid.checkForOverlap(this, col, row) &&
      targetGrid.checkBoundary(this, col, row) &&
      targetGrid.checkAccept(this);

    // 4. 绘制预览矩形（绿色/红色）
    const color = canPlace ? 0x00ff00 : 0xff0000;
    const alpha = 0.3;

    const previewX = gridBounds.x + col * targetGrid.cellSize * targetGrid.aspect;
    const previewY = gridBounds.y + row * targetGrid.cellSize;
    const previewWidth = this.cellWidth * targetGrid.cellSize * targetGrid.aspect;
    const previewHeight = this.cellHeight * targetGrid.cellSize;

    this.previewIndicator.beginFill(color, alpha);
    this.previewIndicator.drawRect(previewX, previewY, previewWidth, previewHeight);
    this.previewIndicator.endFill();

    // 绘制边框
    this.previewIndicator.lineStyle(2, color, 0.8);
    this.previewIndicator.drawRect(previewX, previewY, previewWidth, previewHeight);
  }

  /**
   * 键盘事件（旋转功能）
   */
  private onKeyDown(event: KeyboardEvent): void {
    if (event.key.toLowerCase() === 'r') {
      if (this.isDragging) {
        // 交换宽度和高度以实现旋转
        const temp = this.cellWidth;
        this.cellWidth = this.cellHeight;
        this.cellHeight = temp;

        // 刷新UI
        this.refreshUI();
      }
    }
  }

  /**
   * 单击事件
   */
  private onClick(): void {
    console.log(`物品被点击: ${this.name}`);
    // TODO: 实现物品信息面板显示
  }

  /**
   * 双击事件
   */
  private onDoubleClick(): void {
    console.log(`物品被双击: ${this.name}`);
    // TODO: 实现快速转移功能
  }

  // ========== 配件系统 ==========

  /**
   * 初始化配件槽位（武器专用）
   */
  initAccessories(): void {
    // 只有武器类型才需要配件系统
    if (this.info.primaryClass !== 'gun' || !this.accessories || this.accessories.length === 0) {
      return;
    }

    console.log(`[Item] 开始初始化武器 ${this.name} 的配件槽，共 ${this.accessories.length} 个槽位`);

    // 获取DataManager（通过全局game实例）
    const dataManager = (window as any).game?.dataManager;
    if (!dataManager) {
      console.warn('[Item] DataManager 未找到，无法初始化配件槽位');
      return;
    }

    const weaponID = this.info.objectID;

    for (const accessoryInfo of this.accessories) {
      const slotId = accessoryInfo.slotID;
      const slotName = accessoryInfo.slotName || `槽位_${slotId}`;

      // 使用DataManager获取槽位信息（包括可接受的配件objectID列表）
      const slotInfo = dataManager.getSlotInfo(weaponID, slotId);

      if (!slotInfo) {
        console.warn(`[Item] 未找到槽位信息: weaponID=${weaponID}, slotID=${slotId}`);
        continue;
      }

      console.log(
        `[Item] 创建配件槽位: ${slotInfo.slotName} (${slotId}), ` +
        `可接受 ${slotInfo.acceptedObjectIDs.length} 种配件`
      );

      // 创建配件槽位（1x1的填充格子，使用acceptObjectIDs限制）
      const subgrid = new Subgrid({
        size: { width: 1, height: 1 },
        cellSize: 72,
        aspect: 1,
        fullfill: true,
        countable: false,
        acceptObjectIDs: slotInfo.acceptedObjectIDs, // 使用DataManager提供的限制列表
        title: slotInfo.slotName
      });

      subgrid.parentRegion = this;
      this.subgrids[slotInfo.slotName] = subgrid;

      // 绑定配件添加/移除回调
      subgrid.onItemDraggedIn = this.onAccessoryAdded.bind(this);
      subgrid.onItemDraggedOut = this.onAccessoryRemoved.bind(this);

      // 默认禁用（需要在UI中手动激活）
      subgrid.setEnabled(false);
    }

    console.log(`[Item] 武器 ${this.name} 配件初始化完成，创建了 ${Object.keys(this.subgrids).length} 个槽位`);
  }

  /**
   * 配件添加回调
   */
  private onAccessoryAdded(item: Item, col: number, row: number, originalGrid: Subgrid | null): void {
    console.log(`[Item] 配件添加: ${item.name} -> ${this.name}`);

    // 检查配件本身是否也有槽位（二级配件系统）
    if (item.info.primaryClass === 'accessory' && item.accessories && item.accessories.length > 0) {
      console.log(`[Item] 配件 ${item.name} 包含 ${item.accessories.length} 个二级槽位`);
      // 初始化配件的二级槽位
      item.initAccessories();
    }

    // 刷新UI
    this.refreshUI();

    // 触发价值更新
    this.updateTotalValue();
  }

  /**
   * 配件移除回调
   */
  private onAccessoryRemoved(item: Item, _originalGrid: Subgrid | null): void {
    console.log(`[Item] 配件移除: ${item.name} <- ${this.name}`);

    // 清理配件的二级槽位
    if (item.subgrids && Object.keys(item.subgrids).length > 0) {
      console.log(`[Item] 清理配件 ${item.name} 的二级槽位`);
      for (const subgrid of Object.values(item.subgrids)) {
        // 移除二级槽位中的所有物品
        const items = subgrid.getAllItems();
        for (const subItem of items) {
          subgrid.removeItem(subItem);
        }
        // 销毁subgrid
        subgrid.destroy();
      }
      item.subgrids = {};
    }

    // 刷新UI
    this.refreshUI();

    // 触发价值更新
    this.updateTotalValue();
  }

  /**
   * 更新总价值（通知父级更新）
   */
  private updateTotalValue(): void {
    // 触发全局价值更新事件（如果存在的话）
    if ((window as any).game?.updateTotalValue) {
      (window as any).game.updateTotalValue();
    }
  }

  /**
   * 获取配件总价值
   */
  getAccessoriesValue(): number {
    let totalValue = 0;
    for (const subgrid of Object.values(this.subgrids)) {
      for (const item of subgrid.getAllItems()) {
        totalValue += item.baseValue;
      }
    }
    return totalValue;
  }

  /**
   * 获取物品总价值（包括配件和子弹）
   */
  getValue(): number {
    let totalValue = this.baseValue * this.currentStactCount;

    // 添加配件价值
    totalValue += this.getAccessoriesValue();

    // TODO: 添加子弹价值（需要 DataManager 支持）

    return totalValue;
  }

  // ========== 工具方法 ==========

  /**
   * 克隆物品
   */
  clone(): Item {
    return new Item({ ...this.info });
  }

  /**
   * 销毁物品
   */
  destroy(): void {
    if (this.parentGrid) {
      this.parentGrid.removeItem(this);
    }

    this.container.destroy({ children: true });
  }
}
