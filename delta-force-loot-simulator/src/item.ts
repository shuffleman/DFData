import * as PIXI from "pixi.js";
// import * as text from '@pixi/text';

import { Subgrid } from "./subgrid";
import { GAME_WIDTH, GAME_HEIGHT } from "./config";
import { updateTotalValueDisplay } from "./utils";
import { Region } from "./region";
import { RARITY_COLORS } from "./config";
// import type { Grid, Inventory } from "./types";

export class Item {
    parentGrid: Subgrid | null = null;
    col: number = 0;
    row: number = 0;
    // itemType: any;
    cellWidth: number;
    cellHeight: number;
    baseValue: number = 1;
    name: string;
    type: string;
    container: PIXI.Container;
    graphicsBg: PIXI.Graphics;
    graphicsText: PIXI.Container | null;
    itemSprite: PIXI.Sprite | null = null;
    subgridLayout: Array<[number, number, number, number]> = [];
    subgrids: { [key: string]: Subgrid } = {};
    accessories: any[] = [];
    maxStackCount: number = 1;
    currentStactCount: number = 1;
    ammoType: string = '';
    caliber: string = '';
    ammo: { [key: number]: number } = {};
    capacity: number | null = 30;
    conflicts: { [key: string]: string[] } = {};
    parentRegion: Region | Item | null = null;
    grade: number=0;

    /** 拖动相关 */
    dragStartParentContainer: PIXI.Container;
    dragStartItemLocalPosition: PIXI.Point;
    dragStartItemGlobalPosition: PIXI.Point;
    dragStartMouseGlobalPoint: PIXI.Point;
    isDragging: boolean;
    hasMoved: boolean;
    dragOverlay: PIXI.Graphics | null;
    previewIndicator: PIXI.Graphics | null;

    /** 单双击相关 */
    clickTimeout: number | null;
    clickCount: number;

    /** 搜索 */
    search: number;
    searched: boolean;
    searchTime: number;
    searchMask: PIXI.Graphics;

    /** 保存用于生成 Item 的 Info */
    info: any;

    enabled: boolean = true;

    constructor(itemInfo: any) {
        // this.itemType = itemType;
        // console.log(itemInfo)
        this.cellWidth = itemInfo.length;
        this.cellHeight = itemInfo.width;
        this.baseValue = itemInfo.baseValue;
        this.name = itemInfo.objectName;
        this.type = itemInfo.secondClass || "collection";
        this.search = 1.2;
        this.subgridLayout = itemInfo.subgridLayout;
        // this.accessories = itemType.accessories ? JSON.parse(JSON.stringify(itemType.accessories)) : [];
        this.maxStackCount = itemInfo.maxStack || 1;
        this.currentStactCount = itemInfo.stack || 1;
        // this.ammoType = itemType.ammo;
        this.caliber = itemInfo.gunDetail?.caliber;
        this.capacity = itemInfo.gunDetail?.capacity;
        // 优先使用 accessory，如果不存在则使用 allAccessory
        this.accessories = itemInfo.gunDetail ? (itemInfo.gunDetail.accessory || itemInfo.gunDetail.allAccessory || []) : [];

        // 调试日志
        if (itemInfo.primaryClass === 'gun') {
            console.log(`[Item] 构造武器: ${itemInfo.objectName}, gunDetail:`, itemInfo.gunDetail);
            console.log(`[Item] this.accessories 数量: ${this.accessories.length}`, this.accessories);
        }

        this.grade = itemInfo.grade;

        this.container = new PIXI.Container();
        this.graphicsBg = new PIXI.Graphics();
        this.graphicsText = null;

        this.dragStartParentContainer = this.container.parent;
        this.dragStartItemLocalPosition = new PIXI.Point(0, 0);
        this.dragStartItemGlobalPosition = new PIXI.Point(0, 0);
        this.dragStartMouseGlobalPoint = new PIXI.Point(0, 0);
        this.isDragging = false;
        this.hasMoved = false;
        this.dragOverlay = null;
        this.previewIndicator = null;

        // 必须在 initAccessories() 之前设置 this.info，否则 initAccessories 中无法访问 objectID
        this.info = itemInfo;

        this.subgrids = {};
        this.initAccessories();

        this.addEventListeners();

        this.clickTimeout = null;
        this.clickCount = 0;

        this.searchTime = 1;
        this.searched = false;
        this.searchMask = new PIXI.Graphics();

        // if (itemInfo.primaryClass === 'gun') {
        //     console.log(itemInfo)
        // }

        this.initUI();
        this.refreshUI();

        // 在理好新代码逻辑之前，忽略掉配件的冲突
        // if (itemType.conflict) {
        //     // 将冲突列表转换为字典形式
        //     for (const [type1, type2] of itemType.conflict) {
        //         // 添加双向冲突
        //         if (!this.conflicts[type1]) {
        //             this.conflicts[type1] = [];
        //         }
        //         if (!this.conflicts[type2]) {
        //             this.conflicts[type2] = [];
        //         }
        //         this.conflicts[type1].push(type2);
        //         this.conflicts[type2].push(type1);
        //     }
        // }
    }


    initUI() {
        // 清空之前的图形内容（避免重复绘制）
        if (this.graphicsBg) {
            this.container.removeChild(this.graphicsBg);
        }
        if (this.graphicsText) {
            this.container.removeChild(this.graphicsText);
        }

        // 创建背景图形
        this.graphicsBg = new PIXI.Graphics();

        // 确保颜色是有效的十六进制值
        const color = RARITY_COLORS[this.grade];

        const pixelWidth = this.parentGrid ?
            this.parentGrid.fullfill ?
                this.parentGrid.cellSize * this.parentGrid.aspect :
                this.cellWidth * this.parentGrid.cellSize * this.parentGrid.aspect :
                this.cellWidth * 72;
        const pixelHeight = this.parentGrid ?
            this.parentGrid.fullfill ?
                this.parentGrid.cellSize :
                this.cellHeight * this.parentGrid.cellSize :
                this.cellHeight * 72;
        this.graphicsBg.rect(
            2,
            2,
            pixelWidth - 4, // 减去边框宽度
            pixelHeight - 4,
        );
        // console.log(color, this.grade, RARITY_COLORS[this.grade])
        this.graphicsBg.fill({ color: color });
        this.graphicsBg.stroke({ width: 3, color: 0x666666, alpha: 0.8 });

        // 添加背景到容器
        this.container.addChild(this.graphicsBg);

        // 创建文字容器
        this.graphicsText = new PIXI.Container();

        // 如果有图片URL，加载并显示图片
        if (this.info.pic) {
            // 直接使用PIXI.Texture.from加载，会自动缓存纹理，避免重复加载相同图片
            const imageUrl = this.info.pic;

            try {
                // PIXI.Texture.from 会自动管理纹理缓存，相同URL只会加载一次
                const texture = PIXI.Texture.from(imageUrl);

                // 创建 sprite
                const sprite = new PIXI.Sprite(texture);
                sprite.anchor.set(0.5);
                sprite.position.set(pixelWidth / 2, pixelHeight / 2);

                // 如果纹理已加载，立即缩放，否则等待加载完成
                if (texture.source && (texture.source as any).valid) {
                    this.scaleSprite(sprite, texture, pixelWidth, pixelHeight);
                } else {
                    // 等待纹理加载完成
                    const checkLoaded = () => {
                        if (texture.source && (texture.source as any).valid) {
                            this.scaleSprite(sprite, texture, pixelWidth, pixelHeight);
                        } else {
                            setTimeout(checkLoaded, 50);
                        }
                    };
                    checkLoaded();
                }

                // 保存 sprite 引用以便后续更新
                this.itemSprite = sprite;

                // 将图片添加到背景之后
                this.container.addChildAt(sprite, 1);

                // 即使有图片也显示名称（在左上角）
                this.addItemName(pixelWidth, pixelHeight);
            } catch (error) {
                console.warn(`创建图片精灵失败: ${this.info.pic}`, error);
                // 图片创建失败，显示物品名称
                this.addItemName(pixelWidth, pixelHeight);
            }
        } else {
            // 没有图片时显示物品名称
            this.addItemName(pixelWidth, pixelHeight);
        }

        // 添加堆叠数量和子弹信息
        this.addItemOverlays(pixelWidth, pixelHeight);

        // 添加搜索遮罩
        this.searchMask.rect(
            2,
            2,
            pixelWidth - 4,
            pixelHeight - 4,
        );
        this.searchMask.fill({ color: 0x040404 });
        this.searchMask.stroke({ width: 3, color: 0x666666, alpha: 0.8 });
        this.container.addChild(this.searchMask);

        if (this.searched) {
            this.searchMask.visible = false;
        }
    }

    // 缩放 sprite 以适应格子大小
    private scaleSprite(sprite: PIXI.Sprite, texture: PIXI.Texture, pixelWidth: number, pixelHeight: number) {
        const padding = 8;
        const maxWidth = pixelWidth - padding * 2;
        const maxHeight = pixelHeight - padding * 2;

        // 配件装配到武器插槽时（fullfill 格子），不旋转图片
        const isAccessorySlot = this.parentGrid && this.parentGrid.fullfill;

        // 判断图片的长边和短边
        const imageIsWide = texture.width > texture.height; // 图片是横向的

        // 判断格子的长边和短边
        const cellIsWide = pixelWidth > pixelHeight; // 格子是横向的

        // 如果图片方向和格子方向不一致，需要旋转图片（但配件槽除外）
        if (!isAccessorySlot && imageIsWide !== cellIsWide) {
            // 旋转90度
            sprite.rotation = Math.PI / 2;

            // 旋转后，宽高对调来计算缩放
            const scaleX = maxWidth / texture.height;
            const scaleY = maxHeight / texture.width;
            const scale = Math.min(scaleX, scaleY);
            sprite.scale.set(scale);
        } else {
            // 不旋转
            sprite.rotation = 0;

            const scaleX = maxWidth / texture.width;
            const scaleY = maxHeight / texture.height;
            const scale = Math.min(scaleX, scaleY);
            sprite.scale.set(scale);
        }
    }

    // 添加物品名称的辅助方法
    private addItemName(_pixelWidth: number, _pixelHeight: number) {
        const nameText = new PIXI.Text({
            text: this.name || "未知",
            style: {
                fontFamily: "Arial",
                fontSize: 12,
                fill: 0xffffff,
                fontWeight: "bold",
                stroke: { color: "black", width: 2 },
            },
        });
        nameText.anchor.set(0, 0); // 左上角对齐
        nameText.position.set(4, 4); // 左上角留4px边距
        if (this.graphicsText) {
            this.graphicsText.addChild(nameText);
        }
    }

    // 添加堆叠数量和子弹信息的辅助方法
    private addItemOverlays(pixelWidth: number, pixelHeight: number) {
        if (!this.graphicsText) return;

        // 如果物品可堆叠，添加堆叠数量显示
        if (this.maxStackCount > 1) {
            const stackText = new PIXI.Text({
                text: `x${this.currentStactCount}`,
                style: {
                    fontFamily: "Arial",
                    fontSize: 16,
                    fill: 0xffffff,
                    fontWeight: "bold",
                    stroke: { color: "black", width: 3 },
                },
            });
            stackText.anchor.set(1, 1); // 右下角对齐
            stackText.position.set(
                pixelWidth - 5,  // 右边缘留5像素边距
                pixelHeight - 5   // 下边缘留5像素边距
            );
            this.graphicsText.addChild(stackText);
        }

        // 有子弹，需要显示子弹数量
        if (this.caliber) {
            const stackText = new PIXI.Text({
                text: `${this.getTotalAmmo()}/${this.capacity}`,
                style: {
                    fontFamily: "Arial",
                    fontSize: 16,
                    fill: 0xffffff,
                    fontWeight: "bold",
                    stroke: { color: "black", width: 3 },
                },
            });
            stackText.anchor.set(1, 1); // 右下角对齐
            stackText.position.set(
                pixelWidth - 5,  // 右边缘留5像素边距
                pixelHeight - 5   // 下边缘留5像素边距
            );
            this.graphicsText.addChild(stackText);
        }

        // 设置文字容器的位置
        this.graphicsText.position.set(0, 0);

        // 添加文字到容器（如果还没有添加）
        if (!this.container.children.includes(this.graphicsText)) {
            this.container.addChild(this.graphicsText);
        }
    }

    refreshUI() {
        if (!this.graphicsText) return;

        // 更新名称、数量位置
        const pixelWidth = this.parentGrid ?
            this.parentGrid.fullfill ?
                this.parentGrid.cellSize * this.parentGrid.aspect :
                this.cellWidth * this.parentGrid.cellSize * this.parentGrid.aspect :
                this.cellWidth * 72;
        const pixelHeight = this.parentGrid ?
            this.parentGrid.fullfill ?
                this.parentGrid.cellSize :
                this.cellHeight * this.parentGrid.cellSize :
                this.cellHeight * 72;

        // 更新图片 sprite 的位置和大小（如果存在）
        if (this.itemSprite && this.itemSprite.texture) {
            this.itemSprite.position.set(pixelWidth / 2, pixelHeight / 2);
            this.scaleSprite(this.itemSprite, this.itemSprite.texture, pixelWidth, pixelHeight);
        }

        // 更新名称位置（如果存在）
        if (this.graphicsText.children.length > 0) {
            const firstChild = this.graphicsText.children[0];
            if (firstChild instanceof PIXI.Text && !firstChild.text.startsWith('x') && !firstChild.text.includes('/')) {
                // 这是物品名称（不是数量或子弹数），更新到左上角
                firstChild.position.set(4, 4);
            }
        }

        // 更新堆叠数量显示
        if (this.maxStackCount > 1 && this.currentStactCount > 1) {
            // 遍历查找堆叠数量文本
            for (const child of this.graphicsText.children) {
                if (child instanceof PIXI.Text && child.text.startsWith('x')) {
                    child.text = `x${this.currentStactCount}`;
                    child.position.set(pixelWidth - 5, pixelHeight - 5);
                    break;
                }
            }
        }

        // 更新子弹数量显示
        if (this.caliber) {
            // 遍历查找子弹数量文本
            for (const child of this.graphicsText.children) {
                if (child instanceof PIXI.Text && child.text.includes('/')) {
                    const totalAmmo = this.getTotalAmmo();
                    child.text = `${totalAmmo}/${this.capacity || 0}`;
                    child.position.set(pixelWidth - 5, pixelHeight - 5);
                    break;
                }
            }
        }

        // 添加 searchMask
        // 先写在这吧，在 fullfill 的情况下一般是不需要搜索的
        if (this.parentGrid && this.parentGrid.fullfill) {
            this.searched = true;
        }
        this.searchMask.clear();
        this.searchMask.rect(
            2,
            2,
            pixelWidth - 4, // 减去边框宽度
            pixelHeight - 4,
        );
        this.searchMask.fill({ color: 0x040404 });
        this.searchMask.stroke({ width: 3, color: 0x666666, alpha: 0.8 });
        this.container.addChild(this.searchMask);
        if (window.game.config.needSearch && !this.searched) {
            this.graphicsText.visible = false;
            this.searchMask.visible = true;
        } else {
            this.graphicsText.visible = true;
            this.searchMask.visible = false;
        }

        // refresh active item panel if exists
        if (window.game.activeItemInfoPanel && window.game.activeItemInfoPanel.item === this) {
            const pos = window.game.activeItemInfoPanel.getPosition();
            window.game.activeItemInfoPanel.close();
            window.game.createItemInfoPanel(this);
            if (window.game.activeItemInfoPanel) {
                window.game.activeItemInfoPanel.setPosition(pos);
            }
        }
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.refreshUI();
    }

    addEventListeners() {
        this.container.eventMode = "static";

        // 添加鼠标悬停显示tooltip
        this.container.on('pointerover', () => {
            if (!this.searched) return;
            this.showTooltip();
        });

        this.container.on('pointerout', () => {
            this.hideTooltip();
        });

        this.container.on('pointerdown', (event) => {
            if(!this.searched) {
                return;
            }
            // 隐藏tooltip，因为开始拖动了
            this.hideTooltip();

            if (window.game.isGameStarted) {
                // 增加点击数量
                this.clickCount++;

                // 进行拖动相关判定
                this.isDragging = false;
                this.hasMoved = false;

                // 记录初始位置
                this.dragStartParentContainer = this.container.parent;
                this.dragStartItemLocalPosition = this.container.position.clone();
                this.dragStartItemGlobalPosition = this.container.getGlobalPosition();
                this.dragStartMouseGlobalPoint = event.global.clone();
        
                // 绑定移动事件
                this.container.on("pointermove", this.onDragMove.bind(this));
                this.container.on("wheel", (event) => {
                    // console.log(event)
                    const globalMousePosition = event.global;
                    if (window.game.playerRegion) {
                        const playerInventoryBounds = window.game.playerRegion.inventories[0].container.getBounds();
                        if (globalMousePosition.x > playerInventoryBounds.x &&
                            globalMousePosition.x < playerInventoryBounds.x + playerInventoryBounds.width &&
                            globalMousePosition.y > playerInventoryBounds.y &&
                            globalMousePosition.y < playerInventoryBounds.y + playerInventoryBounds.height) {
                                window.game.playerRegion.inventories[0].onScroll(event);
                                return;
                        }
                    }
                    if (window.game.spoilsRegion) {
                        const currentSpoilsInventoryIndex = window.game.spoilsRegion.currentInventoryId;
                        if (currentSpoilsInventoryIndex >= window.game.spoilsRegion.inventories.length) {
                            return;
                        }
                        const spoilsInventoryBounds = window.game.spoilsRegion.inventories[currentSpoilsInventoryIndex].container.getBounds();
                        if (globalMousePosition.x > spoilsInventoryBounds.x &&
                            globalMousePosition.x < spoilsInventoryBounds.x + spoilsInventoryBounds.width &&
                            globalMousePosition.y > spoilsInventoryBounds.y &&
                            globalMousePosition.y < spoilsInventoryBounds.y + spoilsInventoryBounds.height) {
                                window.game.spoilsRegion.inventories[currentSpoilsInventoryIndex].onScroll(event);
                                return;
                        }
                    }
                });
                this.onDragStart(event);   
            }
        });

        this.container.on("pointerup", () => {
            // 移除拖动时的事件监听
            this.container.off("pointermove");
            if (this.isDragging) {
                // 如果发生拖动，就不再处理单击或双击
                this.clickCount = 0;
                this.onDragEnd();
            } else {
                if (this.clickCount === 1) {
                    // 200ms 内如果没有第二次点击，就认为是单击
                    this.clickTimeout = window.setTimeout(() => {
                        this.clickCount = 0;
                        this.clickTimeout = null;
                        this.onClick();
                    }, 200); 
                } else if (this.clickCount === 2) {
                    // 如果是双击，直接触发双击行为，不再等待三击，清除单击效果
                    if (this.clickTimeout) { 
                        window.clearTimeout(this.clickTimeout);
                    }
                    this.clickCount = 0;
                    this.clickTimeout = null;
                    this.onClick(2);
                }
            }
        });

        // 添加全局键盘事件监听
        window.addEventListener("keydown", this.onKeyDown.bind(this));
    }

    onClick(clickCount=1) {
        if (clickCount === 1) {
            window.game.createItemInfoPanel(this);
        } else if (clickCount === 2) {
            if (!this.parentRegion) {
                return;
            }
            const realParentRegion = this.parentRegion instanceof Region ? 
                this.parentRegion : this.parentRegion.parentRegion;
            if (!realParentRegion) {
                return;
            }
            const targetRegion = realParentRegion === window.game.playerRegion ?
                window.game.spoilsRegion : window.game.playerRegion;
            if (!targetRegion) {
                return;
            }
            targetRegion.addItem(this);
        }
    }

    onDragStart(_: PIXI.FederatedPointerEvent) {

    }

    /**
     * 结束拖动事件
     */
    onDragEnd() {
        this.container.alpha = 1;

        if (!this.isDragging) return;

        // 移除预览指示器 & 移除拖动覆盖层
        if (this.previewIndicator) {
            window.game.app.stage.removeChild(this.previewIndicator);
            this.previewIndicator = null;
        }
        if (this.dragOverlay) {
            this.container.removeChild(this.dragOverlay);
            this.dragOverlay = null;
        }

        // 获取当前鼠标位置对应的网格
        const mousePosition = window.game.app.renderer.events.pointer.global;
        const targetGrid = window.game.findGrid(mousePosition.x, mousePosition.y);

        // 位置不合法或不可交互，返回原位置
        let bReturnToOriginalPosition = false;

        // 如果找到了目标网格
        if (targetGrid) {
            // 获取网格中的位置
            const gridPosition = targetGrid.getGridPositionFromGlobal(
                mousePosition.x,
                mousePosition.y,
                this,
            );

            // 获取重叠的物品
            const overlappingItems = targetGrid.getOverlappingItems(this, gridPosition.clampedCol, gridPosition.clampedRow);
            const overlappingItemsRotated = targetGrid.getOverlappingItems(this, gridPosition.clampedCol, gridPosition.clampedRow, true);
            
            if (overlappingItems.length === 0 || overlappingItemsRotated.length === 0) {
                // 无重叠物品，检查边界和类型
                const isPositionValid = 
                    targetGrid.checkBoundary(this, gridPosition.clampedCol, gridPosition.clampedRow) &&
                    targetGrid.checkAccept(this); //
                if (!isPositionValid) {
                    // 如果位置不合法，检查旋转
                    const isPositionValidRotated = 
                        targetGrid.checkBoundary(this, gridPosition.clampedCol, gridPosition.clampedRow, true) &&
                        targetGrid.checkAccept(this);
                    if (!isPositionValidRotated) {
                        bReturnToOriginalPosition = true;
                    } else {
                        const temp = this.cellWidth;
                        this.cellWidth = this.cellHeight;
                        this.cellHeight = temp;
                        // 在添加到新位置前，检查是否需要清空容器
                        this.checkAndEmptyContainer(targetGrid);
                        targetGrid.addItem(this, gridPosition.clampedCol, gridPosition.clampedRow);
                    }
                } else {
                    // console.log(gridPosition)
                    // 在添加到新位置前，检查是否需要清空容器
                    this.checkAndEmptyContainer(targetGrid);
                    targetGrid.addItem(this, gridPosition.clampedCol, gridPosition.clampedRow);
                }
            } else {
                // 先检查是否可以交互
                // 有重叠的物品，尝试触发交互
                let bCanInteract = true;
                for (const overlappingItem of overlappingItems) {
                    bCanInteract = bCanInteract && overlappingItem.onItemInteractPreview(this, {
                        col: gridPosition.clampedCol,
                        row: gridPosition.clampedRow
                    }, overlappingItems);
                    if (bCanInteract === false) {
                        break;
                    }
                }
                // 可以交互，进行交互
                if (bCanInteract) {
                    let interactionHandled = false;
                    for (const overlappingItem of overlappingItems) {
                        // console.log(333, overlappingItem.name)
                        const handled = overlappingItem.onItemInteract(this, {
                            col: gridPosition.clampedCol,
                            row: gridPosition.clampedRow
                        }, overlappingItems);
                        if (handled) {
                            interactionHandled = true;
                            break; // 交互成功处理，停止循环
                        }
                    }
                    // 如果交互被成功处理，不返回原位置
                    if (!interactionHandled) {
                        bReturnToOriginalPosition = true;
                    }
                } else {
                    let bCanInteractRotated = true;
                    for (const overlappingItem of overlappingItemsRotated) {
                        bCanInteractRotated = bCanInteractRotated && overlappingItem.onItemInteractPreview(this, {
                            col: gridPosition.clampedCol,
                            row: gridPosition.clampedRow
                        }, overlappingItemsRotated);
                    }
                    if(bCanInteractRotated) {
                        let interactionHandled = false;
                        for (const overlappingItem of overlappingItemsRotated) {
                            const handled = overlappingItem.onItemInteract(this, {
                                col: gridPosition.clampedCol,
                                row: gridPosition.clampedRow
                            }, overlappingItemsRotated);
                            if (handled) {
                                interactionHandled = true;
                                break; // 交互成功处理，停止循环
                            }
                        }
                        if (!interactionHandled) {
                            bReturnToOriginalPosition = true;
                        }
                    } else {
                        bReturnToOriginalPosition = true;
                    }
                }
            }
        } else {
            // 如果没有找到目标网格，检查是否在控制面板区域
            const isOverControlPanel = this.checkIfOverControlPanel(mousePosition.x, mousePosition.y);

            if (isOverControlPanel) {
                // 拖到控制面板视为丢弃，添加到地面容器
                this.discardToGround();
                bReturnToOriginalPosition = false;
            } else {
                // 返回原位置
                bReturnToOriginalPosition = true;
            }
        }

        if (bReturnToOriginalPosition) {
            if (this.parentGrid) {
                this.container.position.copyFrom(this.dragStartItemLocalPosition);
                this.dragStartParentContainer.addChild(this.container);
            }
        }

        // 更新总价值显示
        updateTotalValueDisplay();
        
        this.isDragging = false;
        this.hasMoved = false;
    }

    onDragMove(event: PIXI.FederatedPointerEvent) {
        // 检查是否移动超过阈值（3像素）才开始真正的拖动
        const dx = event.global.x - this.dragStartMouseGlobalPoint.x;
        const dy = event.global.y - this.dragStartMouseGlobalPoint.y;
        if (!this.isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
            this.isDragging = true;
            this.container.alpha = 0.7;

            // 创建预览指示器
            if (!this.previewIndicator) {
                this.previewIndicator = new PIXI.Graphics();
                window.game.app.stage.addChild(this.previewIndicator);
            }

            // 创建拖动覆盖层
            if (!this.dragOverlay) {
                this.dragOverlay = new PIXI.Graphics();
                this.dragOverlay.rect(
                    -GAME_WIDTH,
                    -GAME_HEIGHT,
                    GAME_WIDTH * 3,
                    GAME_HEIGHT * 3,
                );
                this.dragOverlay.fill({ color: 0x000000, alpha: 0.1 });
                this.container.addChild(this.dragOverlay);
            }

            // 移动到舞台顶层
            const globalPosition = this.container.getGlobalPosition();
            window.game.app.stage.addChild(this.container);
            this.container.position.set(globalPosition.x, globalPosition.y);
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

    onKeyDown(event: any) {
        if (event.key.toLowerCase() === "r") {
            // console.log(this.isDragging)
            if (this.isDragging) {
                // 交换宽度和高度以实现旋转
                const t1 = this.cellWidth;
                this.cellWidth = this.cellHeight;
                this.cellHeight = t1;

                // 更新图形
                // const t2 = this.graphicsBG.width;
                // this.graphicsBg.width = this.graphicsBg.height;
                // this.graphicsBg.height = t2;
                // console.log('方块已旋转');
            }
        }
        if (event.key.toLowerCase() === "f") {
            const bounds = this.container.getBounds();
            const mousePosition = window.game.app.renderer.events.pointer.global;
            if (this.parentGrid && this.parentGrid.enabled &&
                mousePosition.x >= bounds.x && mousePosition.x <= bounds.x + bounds.width &&
                mousePosition.y >= bounds.y && mousePosition.y <= bounds.y + bounds.height) {
                this.onClick(2);
            }
        }
    }

    updatePreviewIndicator(x: number, y: number) {
        if (!this.previewIndicator) return;
        if (!this.parentGrid) return;

        this.previewIndicator.clear();

        // 确定在哪个区域
        let globalPos, baseX, baseY, grid;
        grid = window.game.findGrid(x, y);
        if (!grid) {
            // console.log('没有找到对应的网格');
            return;
        }

        // 获取网格的全局位置和放置位置
        const { clampedCol, clampedRow, snapX, snapY } =
            grid.getGridPositionFromGlobal(x, y, this);

        globalPos = grid.getGlobalPosition();
        baseX = globalPos.x;
        baseY = globalPos.y;

        // 获取重叠的物品
        const overlappingItems = grid.getOverlappingItems(this, clampedCol, clampedRow);
        // console.log(overlappingItems)
        const overlappingItemsRotated = grid.getOverlappingItems(this, clampedCol, clampedRow, true);
        
        // 判断是否可以放置
        let canPlace = false;
        let canPlaceRotated = false;
        let bCanInteract = false;
        let bCanInteractRotated = false;
        if (overlappingItems.length === 0 || overlappingItemsRotated.length === 0) {
            // 无重叠物品，检查边界和类型
            canPlace = overlappingItems.length === 0 &&
                grid.checkBoundary(this, clampedCol, clampedRow) &&
                grid.checkAccept(this);
            if (!canPlace) {
                canPlaceRotated = grid.checkBoundary(this, clampedCol, clampedRow, true) &&
                    grid.checkAccept(this);
            }
        } else {
            // 有重叠物品，检查是否可以交互
            bCanInteract = true;
            for (const overlappingItem of overlappingItems) {
                bCanInteract = bCanInteract && overlappingItem.onItemInteractPreview(this, {
                    col: clampedCol,
                    row: clampedRow
                }, overlappingItems);
                if (bCanInteract === false) {
                    break;
                }
            }
            if (!bCanInteract) {
                bCanInteractRotated = true;
                for (const overlappingItem of overlappingItemsRotated) {
                    bCanInteractRotated = bCanInteractRotated && overlappingItem.onItemInteractPreview(this, {
                        col: clampedCol,
                        row: clampedRow
                    }, overlappingItems);
                    if (bCanInteractRotated === false) {
                        break;
                    }
                }
            }
        }
        // console.log(canPlace, canPlaceRotated, bCanInteract, bCanInteractRotated)

        // 设置预览颜色
        const previewColor = (canPlace || canPlaceRotated || bCanInteract || bCanInteractRotated) ? 0x88ff88 : 0xff8888; // 浅绿色或浅红色

        const globalSnappedPosition = grid.getGridGlobalPosition({col: clampedCol, row: clampedRow});
        const drawX = grid.fullfill ? baseX :
            (bCanInteract || bCanInteractRotated) ? baseX + snapX - (this.cellWidth * this.parentGrid.cellSize) / 2 : // TODO
            // baseX + snapX + (this.cellWidth * this.cellSize) / 2;
            globalSnappedPosition.x;
        const drawY = grid.fullfill ? baseY :
            (bCanInteract || bCanInteractRotated) ? baseY + snapY - (this.cellHeight * this.parentGrid.cellSize) / 2 : // TODO
            globalSnappedPosition.y;
        // console.log(x, baseX, snapX, clampedCol)
        const drawWidth = grid.fullfill ? grid.width * grid.cellSize * grid.aspect :
            bCanInteract ? this.cellWidth * grid.cellSize : // TODO
            bCanInteractRotated ? this.cellHeight * grid.cellSize :
            canPlaceRotated ? this.cellHeight * grid.cellSize :
            this.cellWidth * grid.cellSize;
        const drawHeight = grid.fullfill ? grid.height * grid.cellSize :
            bCanInteract ? this.cellHeight * grid.cellSize : // TODO
            bCanInteractRotated ? this.cellWidth * grid.cellSize :
            canPlaceRotated ? this.cellWidth * grid.cellSize :
            this.cellHeight * grid.cellSize;

        // Draw Preview
        this.previewIndicator.rect(drawX, drawY, drawWidth, drawHeight);
        this.previewIndicator.fill({ color: previewColor, alpha: 0.5 });

        // 绘制预览
        // if (grid.fullfill) {
        //     this.previewIndicator.beginFill(previewColor);
        //     this.previewIndicator.drawRect(
        //         baseX,
        //         baseY,
        //         grid.width * grid.cellSize * grid.aspect,
        //         grid.height * grid.cellSize,
        //     );
        //     this.previewIndicator.endFill();
        // } else {
        //     this.previewIndicator.beginFill(previewColor);
        //     this.previewIndicator.drawRect(
        //         baseX + snapX - (this.cellWidth * this.cellSize) / 2,
        //         baseY + snapY - (this.cellHeight * this.cellSize) / 2,
        //         this.cellWidth * this.cellSize,
        //         this.cellHeight * this.cellSize,
        //     );
        //     this.previewIndicator.endFill();
        // }
    }

    resize(sizeX: number, sizeY: number) {
        this.graphicsBg.width = sizeX - 4;
        this.graphicsBg.height = sizeY - 4;

        // 同时更新精灵的位置和缩放
        if (this.itemSprite && this.itemSprite.texture) {
            this.itemSprite.position.set(sizeX / 2, sizeY / 2);
            this.scaleSprite(this.itemSprite, this.itemSprite.texture, sizeX, sizeY);
        }
    }

    setGridPosition(col: number, row: number) {
        if (!this.parentGrid) {
            return;
        }
        this.col = col;
        this.row = row;
        // this.x =
        //     (col + 0.5 * this.cellWidth) *
        //     this.parentGrid.cellSize *
        //     this.parentGrid.aspect;
        // this.y = (row + 0.5 * this.cellHeight) * this.parentGrid.cellSize;
        this.container.position.set(
            col * this.parentGrid.cellSize * this.parentGrid.aspect, 
            row * this.parentGrid.cellSize
        );
        // console.log(col, row, this.cellHeight, this.parentGrid.cellSize)
    }

    getValue() {
        let ret = this.baseValue * this.currentStactCount;
        // console.log(this.baseValue, this.currentStactCount, ret)
        for (const subgrid of Object.values(this.subgrids)) {
            for (const item of Object.values(subgrid.blocks)) {
                ret += item.getValue();
            }
        }
        for (const [ammoId, ammoCount] of Object.entries(this.ammo)) {
            // console.log(this.ammo, ammoType, ammoCount)
            const ammoInfo = window.game.itemManager.getItemInfoById(Number(ammoId));
            if (ammoInfo && ammoInfo.baseValue) {
                ret += ammoCount * ammoInfo.baseValue;
            }
        }
        return ret;
    }

    onAccessoryAdded(item: Item, _col: number, _row: number, previousGrid: Subgrid | null) {
        // 先检测是否有冲突
        // console.log(this, item)
        let bHasConflict = false;
        if (this.conflicts[item.type]) {
            for (const conflictedTypes of this.conflicts[item.type]) {
                for (const conflictSubgrid of Object.values(this.subgrids)) {
                    if (conflictSubgrid.acceptedTypes.includes(conflictedTypes) && conflictSubgrid.blocks.length > 0) {
                        bHasConflict = true;
                        break;
                    }
                }
            }
        }
        if (bHasConflict) {
            if (previousGrid) {
                previousGrid.addItem(item);
            }
            return false;
        }
        // 新的配件槽位
        if (item.accessories) {
            for (const newInfo of item.accessories) {
                this.accessories.push(newInfo);
                const newSubgrid = new Subgrid({
                    size: {width: 1, height: 1},
                    cellSize: 72,
                    aspect: 1,
                    fullfill: true,
                    countable: false,
                    accept: [newInfo.type],
                    title: newInfo.title
                });
                this.subgrids[newInfo.title] = newSubgrid;
                newSubgrid.onItemDraggedIn = this.onAccessoryAdded.bind(this);
                newSubgrid.onItemDraggedOut = this.onAccessoryRemoved.bind(this);
                newSubgrid.setEnabled(false);
            }
        }
        if (item.capacity && this.capacity) {
            this.capacity += item.capacity;
        }
        this.refreshUI();
    }

    onAccessoryRemoved(item: Item, _previousGrid: Subgrid | null) {
        if (item.accessories) {
            for (const info of item.accessories) {
                if (this.subgrids[info.title]) {
                    delete this.subgrids[info.title];
                }
                if (this.accessories.includes(info)) {
                    this.accessories.splice(this.accessories.indexOf(info), 1);
                }
            }
        }
        if (item.capacity && this.capacity) {
            this.capacity -= item.capacity;
        }
        this.refreshUI();
    }

    /**
     * 初始化配件
     */
    initAccessories() {
        if (!this.accessories) {
            console.log('[Item] initAccessories: this.accessories 为空，武器:', this.info?.objectName);
            return;
        }

        // 如果 objectID 不存在，跳过配件初始化
        if (!this.info || !this.info.objectID) {
            console.warn('[Item] initAccessories: objectID 未定义，跳过配件初始化', this.info);
            return;
        }

        const weaponID = this.info.objectID;
        console.log(`[Item] initAccessories: 开始初始化武器 ${this.info.objectName} (ID: ${weaponID}) 的配件槽，共 ${this.accessories.length} 个槽位`);

        for(const info of this.accessories) {
            const slotId = info.slotID;
            console.log(`[Item] initAccessories: 处理槽位 ${slotId}`);

            // 使用新架构：直接从 data.json 获取槽位信息和可接受的配件列表
            const slotInfo = window.game.itemManager.getSlotInfo(weaponID, slotId);

            if(slotInfo) {
                const slotTitle = slotInfo.slotName;
                const acceptedObjectIDs = slotInfo.acceptedObjectIDs;
                console.log(`[Item] initAccessories: 槽位 ${slotId} 信息获取成功，名称: ${slotTitle}，可接受配件数量: ${acceptedObjectIDs.length}`);

                const subgrid = new Subgrid({
                    size: {width: 1, height: 1},
                    cellSize: 72,
                    aspect: 1,
                    fullfill: true,
                    countable: false,
                    acceptObjectIDs: acceptedObjectIDs, // 使用 objectID 列表验证
                    title: slotTitle
                });
                subgrid.parentRegion = this;
                this.subgrids[slotTitle] = subgrid;
                subgrid.onItemDraggedIn = this.onAccessoryAdded.bind(this);
                subgrid.onItemDraggedOut = this.onAccessoryRemoved.bind(this);
                subgrid.setEnabled(false);
                console.log(`[Item] initAccessories: 槽位 ${slotTitle} 创建成功`);
            } else {
                console.warn(`[Item] initAccessories: 槽位 ${slotId} 信息获取失败，weaponID: ${weaponID}`);
            }
        }
        console.log(`[Item] initAccessories: 武器 ${this.info.objectName} 配件初始化完成，总共创建了 ${Object.keys(this.subgrids).length} 个槽位`);
    }

    /**
     * 获取当前枪中的子弹总数
     * @returns 
     */
    getTotalAmmo(): number {
        let totalAmmoCount = 0;
        for (const ammoCount of Object.values(this.ammo)) {
            totalAmmoCount += ammoCount;
        }
        return totalAmmoCount;
    }

    /**
     * 卸载子弹，根据枪中的子弹类型创建新的 Item，并添加到父网格中
     */
    unloadAmmo() {
        // console.log(this.ammo)
        for (const [ammoId, ammoCount] of Object.entries(this.ammo)) {
            if (ammoCount > 0) {
                // 创建新的弹药物品
                const ammoInfo = window.game.itemManager.getItemInfoById(ammoId);
                const ammoItem = new Item(ammoInfo);
                ammoItem.currentStactCount = ammoCount;
                
                // 将弹药添加到父网格
                if (this.parentGrid && !this.parentGrid.fullfill) {
                    this.parentGrid.addItem(ammoItem);
                    ammoItem.refreshUI();
                } else if (this.parentRegion && this.parentRegion instanceof Region) {
                    this.parentRegion.addItem(ammoItem);
                }
                
                // 清空当前弹药
                this.ammo[Number(ammoId)] = 0;
            }
        }
        this.refreshUI();
        // console.log(this.ammo)
    }

    /** 
     * 交互回调。当把一个item挪到自己身上时，会触发自己的回调。
     * @returns {boolean} 返回 true 表示已处理交互，false 表示未处理
     */
    onItemInteract(draggingItem: Item, pos: {col: number, row: number}, interacting: Item[]) {
        // 如果 objectID 不存在，不处理交互
        if (!this.info || !this.info.objectID) {
            return false;
        }

        // 使用新架构：收集所有可接受的配件 objectID
        const acceptedAccessoryIDs: number[] = [];
        const weaponID = this.info.objectID;

        for (const accessory of this.accessories) {
            const slotInfo = window.game.itemManager.getSlotInfo(weaponID, accessory.slotID);
            if (slotInfo) {
                acceptedAccessoryIDs.push(...slotInfo.acceptedObjectIDs);
            }
        }

        if (this.info.gunDetail && this.info.gunDetail.caliber === draggingItem.info.secondClass) {
            // 添加子弹
            const draggingItemOriginalParentGrid = draggingItem.parentGrid;
            // 获取当前子弹总数
            let totalAmmoCount = this.getTotalAmmo();
            if ((!this.capacity) || totalAmmoCount === this.capacity) {
                if(draggingItemOriginalParentGrid) {
                    // back to original position
                    draggingItemOriginalParentGrid.addItem(draggingItem);
                }
            } else {
                if (draggingItem.currentStactCount <= this.capacity - totalAmmoCount) {
                    const ammoId = draggingItem.info.objectID;
                    if (!this.ammo[ammoId]) {
                        this.ammo[ammoId] = draggingItem.currentStactCount;
                    } else {
                        this.ammo[ammoId] += draggingItem.currentStactCount;
                    }
                    draggingItem.currentStactCount = 0;
                    draggingItem.destroy();
                    // console.log('test', draggingItem, this)
                } else {
                    if (!this.ammo[draggingItem.info.objectID]) {
                        this.ammo[draggingItem.info.objectID] = this.capacity - totalAmmoCount;
                    } else {
                        this.ammo[draggingItem.info.objectID] += this.capacity - totalAmmoCount;
                    }
                    draggingItem.currentStactCount -= this.capacity - totalAmmoCount;
                    if(draggingItemOriginalParentGrid) {
                        // back to original position
                        draggingItemOriginalParentGrid.addItem(draggingItem);
                    }
                }
            }
            this.refreshUI();
            // console.log('ui refreshed!', this)
        } else if (acceptedAccessoryIDs.includes(Number(draggingItem.info.objectID))) {
            // 添加配件（使用 objectID 检查）
            // 先检测是否有冲突（TODO）
            let bHasConflict = false;
            // if (this.conflicts[draggingItem.type]) {
            //     for (const conflictedTypes of this.conflicts[draggingItem.type]) {
            //         for (const subgrid of Object.values(this.subgrids)) {
            //             if (subgrid.acceptedTypes.includes(conflictedTypes) && subgrid.blocks.length > 0) {
            //                 bHasConflict = true;
            //                 break;
            //             }
            //             }
            //         }
            //         console.log(this.conflicts[draggingItem.type], draggingItem.type, bHasConflict)
            // }
            if (bHasConflict) {
                if (draggingItem.parentGrid) {
                    // back to original position
                    draggingItem.parentGrid.addItem(draggingItem, draggingItem.col, draggingItem.row);
                }
                return false;
            }
            // 找到对应的subgrid（使用 objectID 检查）
            let acceptableSubgrid = null;
            for (const subgrid of Object.values(this.subgrids)) {
                if (subgrid.acceptedObjectIDs.length > 0 &&
                    subgrid.acceptedObjectIDs.includes(Number(draggingItem.info.objectID))) {
                    acceptableSubgrid = subgrid;
                    break;
                }
            }
            if (acceptableSubgrid) {
                //  (TODO) 如果格子内已经有配件，应该交换位置，但这里先简单的当作不可以放入处理
                const added = acceptableSubgrid.addItem(draggingItem);
                if (added) {
                    return true;
                }
            }
            // 如果添加失败，将物品返回到原始位置（暂时忽略返回原位置的情况）
            if (draggingItem.parentGrid) {
                draggingItem.parentGrid.addItem(draggingItem, draggingItem.col, draggingItem.row);
            }
            return false;
        } else if (this.maxStackCount > 1 && this.name == draggingItem.name) {
            // 堆叠子弹
            if (this.currentStactCount < this.maxStackCount) {
                const transAmmoCount = Math.min(
                    this.maxStackCount - this.currentStactCount, draggingItem.currentStactCount);
                this.currentStactCount += transAmmoCount;
                draggingItem.currentStactCount -= transAmmoCount;
                
                // 更新显示
                this.refreshUI();
                draggingItem.refreshUI();

                // 如果拖动的物品数量为0，从网格中移除并销毁它
                if (draggingItem.currentStactCount === 0) {
                    if (draggingItem.parentGrid) {
                        draggingItem.destroy();
                    }
                }
            }
            return true;
        } else {
            // 交换位置
            if (!this.parentGrid || !draggingItem.parentGrid) {
                return false;
            }

            const draggingItemOriginalParentGrid = draggingItem.parentGrid;
            const thisItemOriginalParentGrid = this.parentGrid;
            // console.log(111, pos.col, this.col, pos.row, this.row)
            if (
                pos.col <= this.col &&
                pos.col + draggingItem.cellWidth >= this.col + this.cellWidth &&
                pos.row <= this.row &&
                pos.row + draggingItem.cellHeight >= this.row + this.cellHeight
            ) {
                // 如果 this 完全被拖动的 item 覆盖，位置就很好确定了
                let newPos = {
                    col: draggingItem.col + this.col - pos.col,
                    row: draggingItem.row + this.row - pos.row
                }
                // console.log(222, this.name, newPos.col, draggingItem.col, this.col, pos.col)
                if (this.parentGrid === draggingItem.parentGrid) {
                    if (pos.col + draggingItem.cellWidth > draggingItem.col &&
                        pos.col < draggingItem.col
                    ) {
                        newPos.col += draggingItem.col - pos.col;
                    }
                    if (pos.col < draggingItem.col + draggingItem.cellWidth &&
                        pos.col > draggingItem.col
                    ) {
                        newPos.col -= pos.col - draggingItem.col;
                    }
                    if (pos.row + draggingItem.cellHeight > draggingItem.row &&
                        pos.row < draggingItem.row
                    ) {
                        newPos.row += draggingItem.row - pos.row;
                    }
                    if (pos.row < draggingItem.row + draggingItem.cellHeight &&
                        pos.row > draggingItem.row
                    ) {
                        newPos.row -= pos.row - draggingItem.row;
                    }
                }
                // console.log(555, this.name, newPos.col)
                if (draggingItemOriginalParentGrid && this === interacting[0]) {
                    draggingItemOriginalParentGrid.removeItem(draggingItem);
                    // remove item 是为了给 this item 腾位置，但为了方便后面的 item 这里还是把 parent grid 给他赋回去
                    draggingItem.parentGrid = draggingItemOriginalParentGrid;
                }
                if (thisItemOriginalParentGrid) {
                    thisItemOriginalParentGrid.removeItem(this)
                }
                if (draggingItemOriginalParentGrid) {
                    draggingItemOriginalParentGrid.addItem(this, newPos.col, newPos.row);
                }
                if (thisItemOriginalParentGrid && this === interacting[interacting.length-1]) {
                    thisItemOriginalParentGrid.addItem(draggingItem, pos.col, pos.row);
                }
                return true;
            } else {
                // console.log(4444)
                if (thisItemOriginalParentGrid) {
                    thisItemOriginalParentGrid.removeItem(this)
                }
                if (draggingItemOriginalParentGrid && this === interacting[0]) {
                    draggingItemOriginalParentGrid.removeItem(draggingItem);
                }
                if (thisItemOriginalParentGrid && this === interacting[interacting.length-1]) {
                    thisItemOriginalParentGrid.addItem(draggingItem, pos.col, pos.row);
                }
                if (draggingItemOriginalParentGrid) {
                    draggingItemOriginalParentGrid.addItem(this);
                }
                return true;
            }
        }
    }

    /**
     * 交互回调预览
     * @returns {boolean} 返回 true 表示可以交互，false 表示不能交互
     */
    onItemInteractPreview(draggingItem: Item, pos: {col: number, row: number}, _interacting: Item[]): boolean {
        const accessoryTypes = this.accessories.map((accessory) => {
            const slotInfo = window.game.itemManager.getGunSlotInfoByID(accessory.slotID);
            // console.log(slotInfo, slotID)
            return slotInfo.accType;
        });
        if (this.info.gunDetail && this.info.gunDetail.caliber === draggingItem.info.secondClass) {
            return true;
        } else if (accessoryTypes.includes(draggingItem.type)) {
            // 可放入subgrid
            return true;
        } else if (this.maxStackCount > 1 && this.name == draggingItem.name) {
            // 可堆叠
            return true;
        } else {
            // 检查是否可以交换位置
            if (!this.parentGrid || !draggingItem.parentGrid) {
                return false;
            }

            // 双方 grid 必须互相能够接受
            if (!this.parentGrid.checkAccept(draggingItem) || !draggingItem.parentGrid.checkAccept(this)) {
                return false;
            }

            // this 为 fullfill，则必然可以交换位置
            if (this.parentGrid.fullfill) {
                return true;
            }

            // 首先判断二者不同 Parent Grid 的情况
            // if (this.parentGrid !== draggingItem.parentGrid) {
            //     // console.log(111)
            //     // 做完了别的再来看这里好像也没什么难的
            //     if (this.parentGrid.tryPlaceItem(this, [draggingItem], [])) {
            //         // console.log('there')
            //         return true;
            //     } else {
            //         return false;
            //     }
            // }

            if (
                pos.col <= this.col &&
                pos.col + draggingItem.cellWidth >= this.col + this.cellWidth &&
                pos.row <= this.row &&
                pos.row + draggingItem.cellHeight >= this.row + this.cellHeight
            ) {
                // 如果 this 完全被拖动的 item 覆盖，则必然是可以交换位置的
                return true;
            } else if (
                this.col <= pos.col &&
                this.col + this.cellWidth >= pos.col + draggingItem.cellWidth &&
                this.row <= pos.row &&
                this.row + this.cellHeight >= pos.row + draggingItem.cellHeight
            ) {
                // 如果 This Item 比 Dragging Item 大，说明 Dragging Item 必然只覆盖了 This 一个 item，
                // 那么只要 This Item 有新的位置可以放，那就可以交换
                const deaggingItemPlace = {
                    col: pos.col,
                    row: pos.row,
                    cellWidth: draggingItem.cellWidth,
                    cellHeight: draggingItem.cellHeight
                }
                if (this.parentGrid.tryPlaceItem(this, [this, draggingItem], [deaggingItemPlace])) {
                    // console.log(this.parentGrid.tryPlaceItem(this, [this, draggingItem], [deaggingItemPlace]))
                    return true;
                } else {
                    return false;
                }
            } else {
                // 二者互相不能完全覆盖对方，按现在的三角洲的机制，不能交换位置
                return false;
            }

            /*
            if (true) {
                const deaggingItemPlace = {
                    col: pos.col,
                    row: pos.row,
                    cellWidth: draggingItem.cellWidth,
                    cellHeight: draggingItem.cellHeight
                }
                if (this.parentGrid.tryPlaceItem(this, [this, draggingItem], [deaggingItemPlace])) {
                    // console.log(this.parentGrid.tryPlaceItem(this, [this, draggingItem], [deaggingItemPlace]))
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }*/
        }
    }

    /**
     * 
     * @param type 检查配件之间是否有冲突
     * @returns 
     */
    hasConflict(type: string): boolean {
        if (!this.conflicts[type]) return false;
        
        // 检查所有子网格中的物品
        for (const subgrid of Object.values(this.subgrids)) {
            for (const item of subgrid.blocks) {
                if (this.conflicts[type].includes(item.type)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 检查鼠标位置是否在控制面板区域内
     */
    private checkIfOverControlPanel(x: number, y: number): boolean {
        if (!window.game.controlPanelRegion) return false;

        const bounds = (window.game.controlPanelRegion as any).container.getBounds();
        return x >= bounds.x &&
               x <= bounds.x + bounds.width &&
               y >= bounds.y &&
               y <= bounds.y + bounds.height;
    }

    /**
     * 将物品丢弃到地面容器
     */
    private discardToGround(): void {
        if (window.game.spoilsRegion && window.game.spoilsRegion.inventories.length > 0) {
            // 遍历所有 inventory 查找地面容器
            for (const inventory of window.game.spoilsRegion.inventories) {
                const groundGrid = inventory.contents['groundContainer'];

                if (groundGrid && groundGrid instanceof Subgrid) {
                    // 从当前位置移除物品
                    if (this.parentGrid) {
                        this.parentGrid.removeItem(this);
                    }

                    // 添加到地面容器
                    const addResult = groundGrid.addItem(this);
                    if (addResult) {
                        console.log(`[Item] 物品 ${this.name} 已移至地面容器`);
                        return;
                    } else {
                        console.warn(`[Item] 地面容器空间不足，无法放置 ${this.name}`);
                    }
                }
            }

            // 如果没有找到地面容器或放置失败
            console.error(`[Item] 找不到地面容器或空间不足，物品 ${this.name} 将被销毁`);
            this.destroy();
        } else {
            // 如果没有战利品区域
            console.error(`[Item] 没有战利品区域，物品 ${this.name} 将被销毁`);
            this.destroy();
        }
    }

    /**
     * 检查是否需要清空容器（当背包/胸挂不在装备槽时）
     * 背包和胸挂只有在装备槽中才能容纳物品，否则内部物品会散落到地面
     */
    private checkAndEmptyContainer(targetGrid: Subgrid): void {
        // 检查是否是背包或胸挂
        const isBackpack = this.type === 'bag';
        const isChestRig = this.type === 'chest';

        if (!isBackpack && !isChestRig) {
            return; // 不是容器类物品，无需处理
        }

        // 检查目标位置是否在装备槽中
        const isInEquipmentSlot = this.isInEquipmentSlot(targetGrid);

        // 如果不在装备槽中，清空容器
        if (!isInEquipmentSlot) {
            this.emptyContainerToGround();
        }
    }

    /**
     * 判断grid是否是装备槽（Backpack或ChestRig槽本身，或其内部的GridContainer subgrids）
     */
    private isInEquipmentSlot(grid: Subgrid): boolean {
        if (!grid) return false;

        // 检查个人物资区域
        if (window.game.playerRegion) {
            for (const inventory of window.game.playerRegion.inventories) {
                // 检查是否是背包装备槽本身
                if (this.type === 'bag' && inventory.contents['Backpack'] === grid) {
                    return true;
                }

                // 检查是否在背包内部的 GridContainer subgrids 中
                const backpackContainer = inventory.contents['ContainerBackpack'];
                if (this.type === 'bag' && backpackContainer && 'subgrids' in backpackContainer) {
                    if (Array.isArray(backpackContainer.subgrids) && backpackContainer.subgrids.includes(grid)) {
                        return true;
                    }
                }

                // 检查是否是胸挂装备槽本身
                if (this.type === 'chest' && inventory.contents['ChestRig'] === grid) {
                    return true;
                }

                // 检查是否在胸挂内部的 GridContainer subgrids 中
                const chestRigContainer = inventory.contents['ContainerChestRigs'];
                if (this.type === 'chest' && chestRigContainer && 'subgrids' in chestRigContainer) {
                    if (Array.isArray(chestRigContainer.subgrids) && chestRigContainer.subgrids.includes(grid)) {
                        return true;
                    }
                }
            }
        }

        // 检查战利品区域
        if (window.game.spoilsRegion) {
            for (const inventory of window.game.spoilsRegion.inventories) {
                // 检查是否是背包装备槽本身
                if (this.type === 'bag' && inventory.contents['Backpack'] === grid) {
                    return true;
                }

                // 检查是否在背包内部的 GridContainer subgrids 中
                const backpackContainer = inventory.contents['ContainerBackpack'];
                if (this.type === 'bag' && backpackContainer && 'subgrids' in backpackContainer) {
                    if (Array.isArray(backpackContainer.subgrids) && backpackContainer.subgrids.includes(grid)) {
                        return true;
                    }
                }

                // 检查是否是胸挂装备槽本身
                if (this.type === 'chest' && inventory.contents['ChestRig'] === grid) {
                    return true;
                }

                // 检查是否在胸挂内部的 GridContainer subgrids 中
                const chestRigContainer = inventory.contents['ContainerChestRigs'];
                if (this.type === 'chest' && chestRigContainer && 'subgrids' in chestRigContainer) {
                    if (Array.isArray(chestRigContainer.subgrids) && chestRigContainer.subgrids.includes(grid)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }


    /**
     * 将容器内的所有物品丢到地面
     */
    private emptyContainerToGround(): void {
        // 获取对应的容器GridContainer
        let containerName = '';
        if (this.type === 'bag') {
            containerName = 'ContainerBackpack';
        } else if (this.type === 'chest') {
            containerName = 'ContainerChestRigs';
        }

        if (!containerName || !window.game.playerRegion) return;

        // 找到容器
        for (const inventory of window.game.playerRegion.inventories) {
            const container = inventory.contents[containerName];
            if (container && 'subgrids' in container && Array.isArray(container.subgrids)) {
                // 遍历容器中的所有子网格
                for (const subgrid of container.subgrids) {
                    // 将所有物品移到地面
                    const items = [...subgrid.blocks]; // 复制数组，避免在遍历时修改
                    for (const item of items) {
                        item.discardToGround();
                    }
                }
                break;
            }
        }
    }

    /**
     * 显示物品tooltip（名称和价格）
     */
    private showTooltip(): void {
        // 如果已经存在tooltip，先移除
        this.hideTooltip();

        const tooltip = new PIXI.Container();
        (tooltip as any).isTooltip = true; // 标记为tooltip

        // 计算总价值（包含配件）
        const totalValue = this.getValue();

        // 创建背景
        const bg = new PIXI.Graphics();
        const padding = 8;
        const tooltipText = `${this.name}\n价格: ₽${totalValue.toLocaleString()}`;

        // 创建文本
        const text = new PIXI.Text({
            text: tooltipText,
            style: {
                fontFamily: "Arial",
                fontSize: 14,
                fill: 0xffffff,
                fontWeight: "normal",
                align: "left",
            },
        });

        // 绘制背景（带圆角和边框）
        const bgWidth = text.width + padding * 2;
        const bgHeight = text.height + padding * 2;
        bg.roundRect(0, 0, bgWidth, bgHeight, 4);
        bg.fill({ color: 0x000000, alpha: 0.85 });
        bg.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });

        // 设置文本位置
        text.position.set(padding, padding);

        // 组装tooltip
        tooltip.addChild(bg);
        tooltip.addChild(text);

        // 获取鼠标位置
        const mousePos = window.game.app.renderer.events.pointer.global;

        // 设置tooltip位置（在鼠标右下方，留10px间距）
        tooltip.position.set(mousePos.x + 10, mousePos.y + 10);

        // 确保tooltip不超出屏幕边界
        const screenWidth = window.game.app.screen.width;
        const screenHeight = window.game.app.screen.height;

        if (tooltip.position.x + bgWidth > screenWidth) {
            tooltip.position.x = mousePos.x - bgWidth - 10; // 显示在鼠标左侧
        }
        if (tooltip.position.y + bgHeight > screenHeight) {
            tooltip.position.y = mousePos.y - bgHeight - 10; // 显示在鼠标上方
        }

        // 添加到舞台顶层
        window.game.app.stage.addChild(tooltip);

        // 保存tooltip引用到容器，方便移除
        (this.container as any).tooltip = tooltip;
    }

    /**
     * 隐藏tooltip
     */
    private hideTooltip(): void {
        const tooltip = (this.container as any).tooltip;
        if (tooltip) {
            window.game.app.stage.removeChild(tooltip);
            tooltip.destroy();
            (this.container as any).tooltip = null;
        }
    }

    destroy() {
        this.hideTooltip(); // 销毁前先隐藏tooltip
        if (this.parentGrid) {
            this.parentGrid.removeItem(this);
        }
        this.container.destroy();
    }
}
