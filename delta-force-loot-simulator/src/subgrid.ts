import * as PIXI from "pixi.js";
import { Item } from "./item";
import { DEFAULT_CELL_SIZE } from "./config";
import { ItemType } from "./types";
import { Region } from "./region";
import { updateTotalValueDisplay } from "./utils";

interface ItemPlace {
    col: number;
    row: number;
    cellWidth: number;
    cellHeight: number;
}


/**
 * This class represents a grid in the game.
 * @param {Game} game - The game instance
 * @param {PIXI.Container} stage - The stage to add the grid to
 */
export class Subgrid {
    width: number;
    height: number;
    cellSize: number;
    aspect: number;
    fullfill: boolean;
    countable: boolean;
    acceptedTypes: string[];
    rejectedTypes: string[]; // 拒绝的物品类型（黑名单）
    acceptedObjectIDs: number[]; // 接受的物品 objectID 列表（用于配件槽位）
    container: PIXI.Container;
    title: string;

    blocks: Item[] = [];
    parentRegion: Region | Item | null = null;
    enabled: boolean = true;

    onItemDraggedIn?: (item: Item, col: number, row: number, grid: Subgrid | null) => void;
    onItemDraggedOut?: (item: Item, grid: Subgrid | null) => void;

    // 用于防止出现大小的bug
    additiveSize: { x: number; y: number };

    // 保存初始化 grid 的信息
    info: any = null;

    constructor(info: any) {
        this.width = info.size.width || 1;
        this.height = info.size.height || 1;
        this.cellSize = info.cellSize || DEFAULT_CELL_SIZE;
        this.aspect = info.aspect || 1.0;
        this.fullfill = info.fullfill || false;
        this.countable = info.countable || false;
        this.acceptedTypes = info.accept || []; // 默认接受所有类型
        this.rejectedTypes = info.reject || []; // 默认不拒绝任何类型
        this.acceptedObjectIDs = info.acceptObjectIDs || []; // 接受的 objectID 列表（用于配件槽位）
        this.title = info.title || '';

        this.container = new PIXI.Container();

        this.initUI();
        this.refreshUI();
        window.game.grids.push(this);
        this.additiveSize = { x: this.container.width, y: this.container.height };

        this.info = info;
        // console.log(this)
    }

    /**
     * 初始化 UI。此函数仅在构造时调用。
     */
    private initUI() {
        // 创建网格背景
        const graphics = new PIXI.Graphics();

        graphics.rect(
            0,
            0,
            this.width * this.cellSize * this.aspect,
            this.height * this.cellSize,
        );
        graphics.fill({ color: 0x1f2121, alpha: 0.3 });

        // 水平线
        for (let row = 0; row <= this.height; row++) {
            graphics.moveTo(0, row * this.cellSize);
            graphics.lineTo(
                this.width * this.cellSize * this.aspect,
                row * this.cellSize,
            );
            graphics.stroke({ width: 2, color: 0x333333 });
        }

        // 垂直线
        for (let col = 0; col <= this.width; col++) {
            graphics.moveTo(col * this.cellSize * this.aspect, 0);
            graphics.lineTo(
                col * this.cellSize * this.aspect,
                this.height * this.cellSize,
            );
            graphics.stroke({ width: 2, color: 0x333333 });
        }

        // 外围边框
        graphics.rect(
            0,
            0,
            this.width * this.cellSize * this.aspect,
            this.height * this.cellSize,
        );
        graphics.stroke({ width: 3, color: 0x666666 });

        this.container.addChild(graphics);

        const titleText = new PIXI.Text({
            text: this.title,
            style: {
                fontFamily: "Arial",
                fontSize: 20,
                fill: { color: 0xffffff, alpha: 0.3 },
            },
        });
        titleText.anchor.set(0);
        titleText.position.set(4, 4);
        this.container.addChild(titleText);
    }

    /**
     * 刷新 UI
     */
    public refreshUI() {
        const titleText = this.container.children[1] as PIXI.Text;
        if (window.game.config.displayGridTitle) {
            titleText.visible = true;
        } else {
            titleText.visible = false;
        }
    }

    public refreshUIRecursive() {
        this.refreshUI();
        for(const item of this.blocks) {
            item.refreshUI();
        }
    }

    /**
     * 获取 Container 左上角的全局坐标
     * @returns {PIXI.Point} - The global position of the grid
     **/
    getGlobalPosition(): PIXI.Point {
        return this.container.getGlobalPosition();
    }

    /**
     * Get the grid position from the global coordinates
     * @param {number} globalX - The global X coordinate
     * @param {number} globalY - The global Y coordinate
     * @param {Item} item - The block item to check
     * @returns {object} - Returns an object containing the clamped column, clamped row, snap X, and snap Y
     */
    getGridPositionFromGlobal(
        globalX: number,
        globalY: number,
        item: Item | null,
    ): {
        clampedCol: number;
        clampedRow: number;
        snapX: number;
        snapY: number;
    } {
        // 获取容器的全局位置
        const globalPosition = this.getGlobalPosition();

        const cellWidth = item ? item.cellWidth : 1;
        const cellHeight = item ? item.cellHeight : 1;

        // 计算网格位置
        const col = Math.round(
            (globalX -
                globalPosition.x -
                (cellWidth * this.cellSize * this.aspect) / 2) /
                this.cellSize,
        );
        const row = Math.round(
            (globalY - globalPosition.y - (cellHeight * this.cellSize) / 2) /
                this.cellSize,
        );

        // 限制在网格范围内
        const clampedCol = Math.max(0, Math.min(col, this.width));
        const clampedRow = Math.max(0, Math.min(row, this.height));

        // 计算对齐后的位置
        const snapX =
            (clampedCol + cellWidth / 2) * this.cellSize * this.aspect;
        const snapY = (clampedRow + cellHeight / 2) * this.cellSize;

        // console.log(globalPosition, clampedCol, clampedRow, snapX, snapY)
        return { clampedCol, clampedRow, snapX, snapY };
    }

    getGridGlobalPosition(position: {col: number, row: number}) {
        const globalPosition = this.getGlobalPosition();
        return {
            x: globalPosition.x + position.col * this.cellSize * this.aspect,
            y: globalPosition.y + position.row * this.cellSize
        }
    }

    /**
     * 获取与指定位置重叠的所有物品
     * @param {Item} item - 要检查的物品
     * @param {number} col - 列位置
     * @param {number} row - 行位置
     * @returns {Item[]} - 返回所有重叠的物品数组
     */
    getOverlappingItems(
        item: Item | ItemType | ItemPlace,
        col: number,
        row: number,
        rotated: boolean=false
    ): Item[] {
        const overlappingItems: Item[] = [];
        
        for (const block of this.blocks) {
            // 如果是同一个物品，跳过
            if (block === item) continue;

            // 检查是否有重叠
            const itemRight = rotated ? col + (item.cellHeight || 1) : col + (item.cellWidth || 1);
            const itemBottom = rotated ? row + (item.cellWidth || 1) : row + (item.cellHeight || 1);
            const blockRight = block.col + block.cellWidth;
            const blockBottom = block.row + block.cellHeight;

            if (
                col < blockRight &&
                itemRight > block.col &&
                row < blockBottom &&
                itemBottom > block.row
            ) {
                overlappingItems.push(block);
            }
        }
        return overlappingItems;
    }

    /**
     * 检查是否有重叠（保留此方法以保持向后兼容）
     */
    checkForOverlap(
        item: Item | ItemType | ItemPlace,
        col: number,
        row: number
    ): boolean {
        return this.getOverlappingItems(item, col, row).length > 0;
    }

    /**
     * Check if the item is within the boundary of the grid.
     * @param {Item} item - The block item to check
     * @param {number} col - The column position of the item
     * @param {number} row - The row position of the item
     * @returns {boolean} - Returns true if the item is within the boundary, false otherwise
     * */
    checkBoundary(item: Item | ItemType | ItemPlace, col: number, row: number, rotated: boolean=false): boolean {
        if (this.fullfill) {
            return col === 0 && row === 0;
        }
        // 获取网格的宽度和高度
        const gridWidth = this.width;
        const gridHeight = this.height;

        // 计算方块的右边界和下边界
        const blockRight = rotated ? col + item.cellHeight : col + item.cellWidth;
        const blockBottom = rotated ? row + item.cellWidth : row + item.cellHeight;

        // 检查是否在网格范围内
        return (
            col >= 0 &&
            row >= 0 &&
            blockRight <= gridWidth &&
            blockBottom <= gridHeight
        );
    }

    /**
     * Check if the item is acceptable by the grid.
     * @param {Item} item - The block item to check
     * @returns {boolean} - Returns true if the item is accepted, false otherwise
     * */
    checkAccept(item: Item): boolean {
        // 首先检查黑名单（rejectedTypes）
        if (this.rejectedTypes.length > 0) {
            for (const type of this.rejectedTypes) {
                if (item.type === type) {
                    return false; // 如果在黑名单中，拒绝
                }
            }
        }

        // 如果指定了 acceptedObjectIDs，则优先按 objectID 验证（用于配件槽位）
        if (this.acceptedObjectIDs.length > 0) {
            const itemObjectID = Number(item.info.objectID);
            return this.acceptedObjectIDs.includes(itemObjectID);
        }

        // 然后检查白名单（acceptedTypes）
        if (this.acceptedTypes.length === 0) {
            return true; // 如果没有指定接受的类型，则默认接受所有类型（除了黑名单中的）
        }

        let ret = false;
        // console.log(this)
        this.acceptedTypes.forEach((type) => {
            // console.log(item.type, type, item.type === type)
            if (item.type === type) {
                ret = true;
            }
        });
        // console.log(this.acceptedTypes, item.type, ret);
        return ret;
    }

    rearrange() {
        // TODO
    }

    /**
     * Add a block to the grid.
     * @param {Item} obj - The block to add
     * @param {number} col - The column position of the block
     * @param {number} row - The row position of the block
     * */
    addItem(obj: Item, col: number = -1, row: number = -1, removeFromOriginalGrid: boolean=true): boolean {
        // 检查容器是否尝试放入自身
        if ((obj.type === 'bag' || obj.type === 'chest') && this.isInsideContainer(obj)) {
            console.log(`[Subgrid] 拒绝：容器不能放入自身`);
            return false;
        }

        // 检查是否是背包或胸挂的子网格，且背包/胸挂不在装备槽中
        if (this.parentRegion && 'type' in this.parentRegion) {
            const parentItem = this.parentRegion as Item;
            const isContainer = parentItem.type === 'bag' || parentItem.type === 'chest';

            if (isContainer && !this.isParentItemInEquipmentSlot(parentItem)) {
                // 背包/胸挂不在装备槽中，不能添加物品
                console.log(`[Subgrid] 拒绝向未装备的${parentItem.type === 'bag' ? '背包' : '胸挂'}添加物品`);
                return false;
            }
        }

        // 检查是否将背包/胸挂放到地面容器
        if ((obj.type === 'bag' || obj.type === 'chest') && this.isGroundContainer()) {
            console.log(`[Subgrid] 检测到将${obj.type === 'bag' ? '背包' : '胸挂'}放到地面，清空其内部物品`);
            this.emptyNestedContainerToGround(obj);
        }

        // 检查是否在容器内嵌套放置背包/胸挂
        if ((obj.type === 'bag' || obj.type === 'chest')) {
            // 检查 parentRegion 是否是容器 Item
            let parentContainer: Item | null = null;

            if (this.parentRegion && 'type' in this.parentRegion) {
                // parentRegion 是 Item
                const parentItem = this.parentRegion as Item;
                if (parentItem.type === 'bag' || parentItem.type === 'chest') {
                    parentContainer = parentItem;
                }
            } else if (this.parentRegion && 'associatedItem' in this.parentRegion) {
                // parentRegion 是 GridContainer，获取关联的容器 Item
                const gridContainer = this.parentRegion as any;
                if (gridContainer.associatedItem) {
                    parentContainer = gridContainer.associatedItem;
                }
            }

            if (parentContainer) {
                // 在背包/胸挂内放置另一个背包/胸挂，清空被放置容器的内部物品
                console.log(`[Subgrid] 检测到嵌套容器：在${parentContainer.type === 'bag' ? '背包' : '胸挂'}内放置${obj.type === 'bag' ? '背包' : '胸挂'}，清空其内部物品`);
                this.emptyNestedContainerToGround(obj);
            }
        }

        // Check accept first
        // if(obj.type === 'primaryWeapon') {
        //     console.log('bbb')
        // }
        const bIsAccepted = this.checkAccept(obj);
        if (!bIsAccepted) {
            return false;
        }
        const objOriginalParentGrid = obj.parentGrid;
        let bFound = false;

        // 如果指定了坐标，先检查该位置是否合法
        if (col >= 0 && row >= 0) {
            const bOverlap = this.checkForOverlap(obj, col, row);
            const bBoundary = this.checkBoundary(obj, col, row);
            if (!bOverlap && bBoundary) {
                bFound = true;
            } else {
                // 指定位置不合法，尝试自动寻找位置
                console.log(`[Subgrid] 警告：指定位置 (${col}, ${row}) 不可用（重叠或越界），尝试自动寻找位置`);
                col = -1;
                row = -1;
            }
        }

        // 如果没有指定坐标或指定坐标不合法，自动寻找位置
        if (!bFound) {
            // need to find pos annually
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    const bOverlap = this.checkForOverlap(obj, c, r);
                    const bBoundary = this.checkBoundary(obj, c, r);
                    if(!bOverlap && bBoundary) {
                        bFound = true;
                        col = c;
                        row = r;
                        break;
                    }
                }
                if(bFound) {
                    break;
                }
            }
        }
        // console.log('bFound', bFound, col, row)
        // TODO: this.rearrange();
        if (!bFound) {
            return false;
        }

        const originalParentGrid = obj.parentGrid;
        if (removeFromOriginalGrid && originalParentGrid) {
            originalParentGrid.removeItem(obj);
        }
        this.blocks.push(obj);
        this.container.addChild(obj.container);
        obj.parentGrid = this; // 设置父级网格

        if (this.fullfill) {
            obj.resize(this.cellSize * this.aspect, this.cellSize);
        } else {
            obj.resize(
                this.cellSize * this.aspect * obj.cellWidth,
                this.cellSize * obj.cellHeight,
            );
        }

        if (this.fullfill) {
            // obj.setGridPosition(
            //     -(obj.cellWidth - 1) / 2,
            //     -(obj.cellHeight - 1) / 2,
            // ); // 设置网格位置
            obj.setGridPosition(0, 0)
        } else {
            obj.setGridPosition(col, row); // 设置网格位置
            // console.log(obj.col, obj.row);
        }

        obj.parentRegion = this.parentRegion;

        if (this.onItemDraggedIn) {
            this.onItemDraggedIn(obj, col, row, objOriginalParentGrid);
        }

        obj.refreshUI();
        updateTotalValueDisplay();
        return true;
    }

    /**
     * Remove a block from the grid.
     * @param {Item} obj - The block to remove
     * */
    removeItem(obj: Item, destroy: boolean=false) {
        const index = this.blocks.indexOf(obj);
        if (index !== -1) {
            this.blocks.splice(index, 1);
            this.container.removeChild(obj.container);
            obj.parentGrid = null; // 清除父级网格引用
            if (this.onItemDraggedOut) {
                this.onItemDraggedOut(obj, this);
            }
            if (destroy) {
                obj.container.destroy();
            }
        }
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.container.visible = enabled;
        for(const item of this.blocks) {
            item.setEnabled(enabled);
        }
        this.refreshUI();
    }

    clearItem() {
        for (const item of this.blocks) {
            this.container.removeChild(item.container);
            if (this.onItemDraggedOut) {
                this.onItemDraggedOut(item, this);
            }
        }
        this.blocks = [];
    }

    tryPlaceItem(item: Item, ignores: (Item | ItemPlace)[], blocks: (Item | ItemPlace)[]): { col: number, row: number } | null {
        // console.log('======')
        if (!this.checkAccept(item)) {
            return null;
        }
        for (let row = 0; row < this.height; row+=1) {
            for (let col = 0; col < this.width; col+=1) {
                // 检查是否在边界内
                if (!this.checkBoundary(item, col, row)) {
                    continue;
                }

                // 检查是否与blocks重叠
                let hasOverlap = false;
                for (const blockedItem of blocks) {
                    const blockedItemRight = blockedItem.col + blockedItem.cellWidth;
                    const blockedItemBottom = blockedItem.row + blockedItem.cellHeight;
                    const itemRight = col + item.cellWidth;
                    const itemBottom = row + item.cellHeight;
                    // if(col === 0 && row === 0 ) {
                    //     console.log('ffff')
                    //     console.log(col, row, itemRight, itemBottom, blockedItem)
                    // }

                    if (
                        col < blockedItemRight &&
                        itemRight > blockedItem.col &&
                        row < blockedItemBottom &&
                        itemBottom > blockedItem.row
                    ) {
                        // if(col === 0 && row === 0 ) {
                        //     console.log('gggg')
                        //     console.log(col, row, itemRight, itemBottom, blockedItem)
                        // }
                        hasOverlap = true;
                        break;
                    }
                }
                if (hasOverlap) {
                    // console.log(col, row, 'hhhh')
                    continue;
                }
                // console.log(col, row, 'iiii')
                hasOverlap = false;
                for (const originalItem of this.blocks) {
                    if (ignores.includes(originalItem)) {
                        continue;
                    }
                    // console.log(333, ignores)
                    const blockRight = originalItem.col + originalItem.cellWidth;
                    const blockBottom = originalItem.row + originalItem.cellHeight;
                    const itemRight = col + item.cellWidth;
                    const itemBottom = row + item.cellHeight;

                    if (
                        col < blockRight &&
                        itemRight > originalItem.col &&
                        row < blockBottom &&
                        itemBottom > originalItem.row
                    ) {
                        hasOverlap = true;
                        break;
                    }
                }
                if (hasOverlap) {
                    continue;
                }
                return { col, row };
            }
        }
        // TODO: rearrange
        return null;
    }

    /**
     * 更新 Subgrid 的尺寸（用于响应式布局）
     * @param width 新的宽度（格子数）
     * @param height 新的高度（格子数）
     */
    public updateSize(width: number, height: number) {
        this.width = width;
        this.height = height;

        // 重新绘制整个网格
        const graphics = this.container.children[0] as PIXI.Graphics;
        graphics.clear();

        // 创建网格背景
        graphics.rect(
            0,
            0,
            this.width * this.cellSize * this.aspect,
            this.height * this.cellSize,
        );
        graphics.fill({ color: 0x1f2121, alpha: 0.3 });

        // 水平线
        for (let row = 0; row <= this.height; row++) {
            graphics.moveTo(0, row * this.cellSize);
            graphics.lineTo(
                this.width * this.cellSize * this.aspect,
                row * this.cellSize,
            );
            graphics.stroke({ width: 2, color: 0x333333 });
        }

        // 垂直线
        for (let col = 0; col <= this.width; col++) {
            graphics.moveTo(col * this.cellSize * this.aspect, 0);
            graphics.lineTo(
                col * this.cellSize * this.aspect,
                this.height * this.cellSize,
            );
            graphics.stroke({ width: 2, color: 0x333333 });
        }

        // 外围边框
        graphics.rect(
            0,
            0,
            this.width * this.cellSize * this.aspect,
            this.height * this.cellSize,
        );
        graphics.stroke({ width: 3, color: 0x666666 });

        // 更新 additiveSize
        this.additiveSize = { x: this.container.width, y: this.container.height };

        // 重新定位所有物品
        for (const item of this.blocks) {
            if (this.fullfill) {
                item.resize(this.cellSize * this.aspect, this.cellSize);
            } else {
                item.resize(
                    this.cellSize * this.aspect * item.cellWidth,
                    this.cellSize * item.cellHeight,
                );
            }
            item.refreshUI();
        }
    }

    /**
     * 判断父级物品（背包/胸挂）是否在装备槽中
     */
    private isParentItemInEquipmentSlot(parentItem: Item): boolean {
        if (!parentItem.parentGrid) return false;

        const grid = parentItem.parentGrid;

        // 检查个人物资区域
        if (window.game.playerRegion) {
            for (const inventory of window.game.playerRegion.inventories) {
                const backpackContainer = inventory.contents['ContainerBackpack'];
                const chestRigContainer = inventory.contents['ContainerChestRigs'];

                // 检查是否在背包装备槽中
                if (parentItem.type === 'bag' && backpackContainer && 'subgrids' in backpackContainer) {
                    if (Array.isArray(backpackContainer.subgrids) && backpackContainer.subgrids.includes(grid)) {
                        return true;
                    }
                }

                // 检查是否在胸挂装备槽中
                if (parentItem.type === 'chest' && chestRigContainer && 'subgrids' in chestRigContainer) {
                    if (Array.isArray(chestRigContainer.subgrids) && chestRigContainer.subgrids.includes(grid)) {
                        return true;
                    }
                }
            }
        }

        // 检查战利品区域
        if (window.game.spoilsRegion) {
            for (const inventory of window.game.spoilsRegion.inventories) {
                const backpackContainer = inventory.contents['ContainerBackpack'];
                const chestRigContainer = inventory.contents['ContainerChestRigs'];

                // 检查是否在背包装备槽中
                if (parentItem.type === 'bag' && backpackContainer && 'subgrids' in backpackContainer) {
                    if (Array.isArray(backpackContainer.subgrids) && backpackContainer.subgrids.includes(grid)) {
                        return true;
                    }
                }

                // 检查是否在胸挂装备槽中
                if (parentItem.type === 'chest' && chestRigContainer && 'subgrids' in chestRigContainer) {
                    if (Array.isArray(chestRigContainer.subgrids) && chestRigContainer.subgrids.includes(grid)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * 检查当前子网格是否在给定的容器物品内部
     */
    private isInsideContainer(containerItem: Item): boolean {
        // 首先检查当前 subgrid 是否直接在 containerItem 的 subgrids 中
        if (containerItem.subgrids) {
            for (const subgrid of Object.values(containerItem.subgrids)) {
                if (subgrid === this) {
                    return true;
                }
            }
        }

        // 递归检查 parentRegion
        let currentParent = this.parentRegion;

        while (currentParent) {
            // 如果 parentRegion 是 Item 类型
            if ('type' in currentParent) {
                const parentItem = currentParent as Item;

                // 如果找到了匹配的容器物品，说明当前 subgrid 在这个容器内部
                if (parentItem === containerItem) {
                    return true;
                }

                // 继续向上检查
                if (parentItem.parentGrid) {
                    currentParent = parentItem.parentGrid.parentRegion;
                } else {
                    break;
                }
            } else if ('associatedItem' in currentParent) {
                // 如果 parentRegion 是 GridContainer 类型，检查 associatedItem
                const gridContainer = currentParent as any;
                if (gridContainer.associatedItem === containerItem) {
                    return true;
                }

                // GridContainer 没有 parentGrid，但有 parentRegion
                if (gridContainer.parentRegion) {
                    currentParent = gridContainer.parentRegion;
                } else {
                    break;
                }
            } else {
                // 如果是 Region 类型，不再继续向上
                break;
            }
        }

        return false;
    }

    /**
     * 检查当前 subgrid 是否是地面容器
     */
    private isGroundContainer(): boolean {
        return this.title === 'groundContainer' || this.title.toLowerCase().includes('ground');
    }

    /**
     * 清空嵌套容器（背包/胸挂）的内部物品到地面
     */
    private emptyNestedContainerToGround(containerItem: Item): void {
        if (!containerItem.subgrids) return;

        // 获取地面容器
        const groundGrid = this.getGroundContainer();
        if (!groundGrid) {
            console.warn('[Subgrid] 无法找到地面容器，嵌套容器内物品将保留在容器中（但容器本身被嵌套后将无法访问这些物品）');
            return;
        }

        // 遍历容器的所有子网格
        for (const subgridName in containerItem.subgrids) {
            const subgrid = containerItem.subgrids[subgridName];
            if (!subgrid || !subgrid.blocks) continue;

            // 复制物品数组，避免在遍历时修改
            const items = [...subgrid.blocks];
            for (const item of items) {
                // 先从原容器移除（避免 addItem 重复移除）
                subgrid.removeItem(item);

                // 尝试添加到地面容器（不要自动从原grid移除，因为已经手动移除了）
                const addResult = groundGrid.addItem(item, -1, -1, false);
                if (addResult) {
                    console.log(`[Subgrid] 嵌套容器物品 ${item.name} 已移至地面容器`);
                } else {
                    console.warn(`[Subgrid] 地面容器空间不足，物品 ${item.name} 已丢失`);
                }
            }
        }
    }

    /**
     * 获取地面容器
     */
    private getGroundContainer(): Subgrid | null {
        if (!window.game.spoilsRegion) return null;

        for (const inventory of window.game.spoilsRegion.inventories) {
            const groundContainer = inventory.contents['groundContainer'];
            if (groundContainer && groundContainer instanceof Subgrid) {
                return groundContainer;
            }
        }

        return null;
    }

    destroy() {
        for (const item of this.blocks) {
            item.destroy();
        }

        if (window.game.grids.includes(this)) {
            window.game.grids.splice(window.game.grids.indexOf(this), 1);
        }

        this.clearItem();
        this.container.destroy();
    }
}
