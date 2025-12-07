import * as PIXI from "pixi.js";
import { Item } from "../item";
import { Subgrid } from "../subgrid";
import { GridContainer } from "../gridContainer";

export class AutoOptimizeButton {
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

        // 创建自动整理按钮
        const button = this.createButton("智能整理", 20, 15, () => {
            this.autoOptimize();
        });

        this.container.addChild(button);
    }

    private createButton(label: string, x: number, y: number, onClick: Function) {
        const button = new PIXI.Container();

        // 按钮背景
        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, 180, 30, 5);
        bg.fill(0xE91E63); // 粉红色

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
            bg.tint = 0xC2185B;
        });
        button.on('pointerout', () => {
            bg.tint = 0xFFFFFF;
        });

        return button;
    }

    private autoOptimize() {
        console.log('开始智能整理...');

        if (!window.game.spoilsRegion || !window.game.playerRegion) {
            alert('游戏区域未初始化');
            return;
        }

        // 1. 扩展地面容器到15x20
        this.expandGroundContainer(15, 20);

        // 2. 收集所有物品并移动到地面容器
        const allItems = this.collectAllItems();
        console.log(`找到 ${allItems.length} 个物品`);

        // 3. 清空个人物资区域
        this.clearPlayerEquipment();

        // 4. 移动所有物品到地面容器
        const groundContainer = this.getGroundContainer();
        if (!groundContainer) {
            alert('找不到地面容器');
            return;
        }
        this.moveAllItemsToGround(allItems, groundContainer);

        // 4.5 卸载所有武器的配件到地面
        const gunsOnGround = groundContainer.blocks.filter(item =>
            ['gunRifle', 'gunSMG', 'gunShotgun', 'gunLMG', 'gunMP', 'gunSniper', 'gunPistol'].includes(item.type)
        );
        this.unloadAllAccessories(gunsOnGround, groundContainer);
        console.log(`已卸载 ${gunsOnGround.length} 把武器的配件`);

        // 5. 优化并装备最好的两把枪（含配件）
        this.optimizeAndEquipBestGuns(gunsOnGround, groundContainer);

        // 7. 装备头盔和护甲（选择最贵的）
        const helmets = allItems.filter(item => item.type === 'helmet');
        const armors = allItems.filter(item => item.type === 'armor');
        this.equipBestArmorAndHelmet(helmets, armors);

        // 8. 选择最大容量的背包和胸挂
        const backpacks = allItems.filter(item => item.type === 'bag');
        const chestRigs = allItems.filter(item => item.type === 'chest');
        this.equipLargestContainers(backpacks, chestRigs);

        // 9. 填充剩余物品到容器中
        this.fillContainersWithRemainingItems();

        console.log('智能整理完成');
    }

    private expandGroundContainer(width: number, height: number) {
        if (!window.game.spoilsRegion) return;

        // 找到地面容器并扩展尺寸
        for (const inventory of window.game.spoilsRegion.inventories) {
            const groundContainer = inventory.contents['groundContainer'];
            if (groundContainer && groundContainer instanceof Subgrid) {
                // 直接更新 Subgrid 的尺寸
                groundContainer.updateSize(width, height);
                console.log(`地面容器已扩展为 ${width}x${height}`);
                return;
            }
        }
    }

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

    private collectAllItems(): Item[] {
        const items: Item[] = [];

        // 收集战利品区域的所有物品
        if (window.game.spoilsRegion) {
            for (const inventory of window.game.spoilsRegion.inventories) {
                for (const content of Object.values(inventory.contents)) {
                    // 处理 Subgrid
                    if (content && 'blocks' in content && Array.isArray(content.blocks)) {
                        items.push(...content.blocks);
                    }

                    // 处理 GridContainer
                    if (content && 'subgrids' in content && Array.isArray(content.subgrids)) {
                        for (const subgrid of content.subgrids) {
                            if (subgrid.blocks) {
                                items.push(...subgrid.blocks);
                            }
                        }
                    }
                }
            }
        }

        // 收集个人物资区域的所有物品
        if (window.game.playerRegion) {
            for (const inventory of window.game.playerRegion.inventories) {
                for (const content of Object.values(inventory.contents)) {
                    // 处理 Subgrid
                    if (content && 'blocks' in content && Array.isArray(content.blocks)) {
                        items.push(...content.blocks);
                    }

                    // 处理 GridContainer
                    if (content && 'subgrids' in content && Array.isArray(content.subgrids)) {
                        for (const subgrid of content.subgrids) {
                            if (subgrid.blocks) {
                                items.push(...subgrid.blocks);
                            }
                        }
                    }
                }
            }
        }

        return items;
    }

    private moveAllItemsToGround(items: Item[], groundContainer: Subgrid) {
        for (const item of items) {
            // 从原位置移除
            if (item.parentGrid) {
                item.parentGrid.removeItem(item);
            }

            // 尝试放到地面容器
            this.tryPlaceItem(item, groundContainer);
        }
    }

    private clearPlayerEquipment() {
        if (!window.game.playerRegion) return;

        const equipmentSlots = [
            'Helmet', 'Armor', 'ChestRig', 'Backpack',
            'PrimaryWeapon1', 'PrimaryWeapon2', 'Secondary'
        ];

        for (const inventory of window.game.playerRegion.inventories) {
            for (const slotName of equipmentSlots) {
                const slot = inventory.contents[slotName];
                if (slot && slot instanceof Subgrid) {
                    // 移除装备槽中的物品
                    const itemsToRemove = [...slot.blocks];
                    for (const item of itemsToRemove) {
                        slot.removeItem(item);
                    }
                }
            }

            // 清空容器
            const containers = ['ContainerChestRigs', 'ContainerBackpack', 'pocket', 'ContainerSecure'];
            for (const containerName of containers) {
                const container = inventory.contents[containerName];
                if (container && 'subgrids' in container) {
                    const gridContainer = container as GridContainer;
                    for (const subgrid of gridContainer.subgrids) {
                        const itemsToRemove = [...subgrid.blocks];
                        for (const item of itemsToRemove) {
                            subgrid.removeItem(item);
                        }
                    }
                }
            }
        }
    }

    private optimizeAndEquipBestGuns(guns: Item[], groundContainer: Subgrid) {
        if (!window.game.playerRegion || guns.length === 0) return;

        const playerInventory = window.game.playerRegion.inventories[0];
        if (!playerInventory) return;

        console.log(`\n========================================`);
        console.log(`🔧 开始智能优化：选择最优武器配置`);
        console.log(`可选枪械数量: ${guns.length}`);
        console.log(`========================================`);

        // 收集所有可用配件
        const allAccessories = [...groundContainer.blocks].filter(item =>
            item.type && item.type.startsWith('acc')
        );
        console.log(`\n📦 配件总数: ${allAccessories.length} 个`);

        // 装备第一把枪
        if (guns.length > 0) {
            console.log(`\n========================================`);
            console.log(`🔧 第一轮：选择主武器1`);
            console.log(`========================================`);

            let bestGun1: Item | null = null;
            let bestValue1 = 0;

            // 评估所有枪，找出最优的
            for (const gun of guns) {
                const value = this.evaluateGunWithAccessories(gun, groundContainer);
                console.log(`  评估 ${gun.name}: ₽${value.toLocaleString()}`);

                if (value > bestValue1) {
                    bestGun1 = gun;
                    bestValue1 = value;
                }
            }

            if (bestGun1) {
                console.log(`\n✅ 选中主武器1: ${bestGun1.name} (₽${bestValue1.toLocaleString()})`);
                const slot1 = playerInventory.contents['PrimaryWeapon1'] as Subgrid;
                if (bestGun1.parentGrid) {
                    bestGun1.parentGrid.removeItem(bestGun1);
                }
                slot1.addItem(bestGun1, 0, 0);
                console.log(`🎯 已装备到主武器槽1`);

                // 实际装配配件
                this.actuallyEquipAccessories(bestGun1, groundContainer);

                // 从列表中移除
                const index = guns.indexOf(bestGun1);
                if (index > -1) {
                    guns.splice(index, 1);
                }
            }
        }

        // 装备第二把枪（使用剩余配件）
        if (guns.length > 0) {
            console.log(`\n========================================`);
            console.log(`🔧 第二轮：选择主武器2`);
            console.log(`========================================`);

            let bestGun2: Item | null = null;
            let bestValue2 = 0;

            // 评估所有剩余的枪
            for (const gun of guns) {
                const value = this.evaluateGunWithAccessories(gun, groundContainer);
                console.log(`  评估 ${gun.name}: ₽${value.toLocaleString()}`);

                if (value > bestValue2) {
                    bestGun2 = gun;
                    bestValue2 = value;
                }
            }

            if (bestGun2) {
                console.log(`\n✅ 选中主武器2: ${bestGun2.name} (₽${bestValue2.toLocaleString()})`);
                const slot2 = playerInventory.contents['PrimaryWeapon2'] as Subgrid;
                if (bestGun2.parentGrid) {
                    bestGun2.parentGrid.removeItem(bestGun2);
                }
                slot2.addItem(bestGun2, 0, 0);
                console.log(`🎯 已装备到主武器槽2`);

                // 实际装配配件
                this.actuallyEquipAccessories(bestGun2, groundContainer);
            }
        }

        console.log(`\n========================================`);
        console.log(`✅ 枪械优化完成`);
        console.log(`========================================\n`);
    }

    /**
     * 🆕 评估枪械装配最优配件后的总价值（模拟评估，不实际装配）
     */
    private evaluateGunWithAccessories(gun: Item, groundContainer: Subgrid): number {
        // 确保枪的配件槽已经初始化
        if (Object.keys(gun.subgrids).length === 0) {
            gun.initAccessories();
        }

        let totalValue = gun.getValue();

        if (!gun.accessories || gun.accessories.length === 0) {
            return totalValue;
        }

        // 获取武器ID
        const weaponID = gun.info?.objectID;
        if (!weaponID) {
            return totalValue;
        }

        // 从地面容器中找配件，但不实际装配（模拟评估）
        const groundItems = [...groundContainer.blocks];
        const usedAccessories = new Set<Item>(); // 记录本次评估中使用的配件

        for (const accessory of gun.accessories) {
            const slotId = accessory.slotID;
            // 使用新架构：从 data.json 获取槽位信息
            const slotInfo = window.game.itemManager.getSlotInfo(weaponID, slotId);
            if (!slotInfo) continue;

            const acceptedObjectIDs = slotInfo.acceptedObjectIDs;

            // 找到兼容的配件，按价值排序
            const compatibleAccessories = groundItems
                .filter(item => {
                    if (!item.info || !item.info.objectID) return false;
                    return acceptedObjectIDs.includes(item.info.objectID) &&
                        !usedAccessories.has(item); // 排除本次评估中已使用的配件
                })
                .sort((a, b) => b.getValue() - a.getValue());

            if (compatibleAccessories.length > 0) {
                const bestAccessory = compatibleAccessories[0];
                totalValue += bestAccessory.getValue();
                usedAccessories.add(bestAccessory); // 标记为已使用
            }
        }

        return totalValue;
    }

    /**
     * 实际装配枪械配件（在选定枪后调用）
     */
    private actuallyEquipAccessories(gun: Item, groundContainer: Subgrid): void {
        // 确保枪的配件槽已经初始化
        if (Object.keys(gun.subgrids).length === 0) {
            gun.initAccessories();
        }

        if (!gun.accessories || gun.accessories.length === 0) {
            return;
        }

        // 获取武器ID
        const weaponID = gun.info?.objectID;
        if (!weaponID) {
            console.warn('[AutoOptimize] actuallyEquipAccessories: 武器缺少 objectID');
            return;
        }

        const groundItems = [...groundContainer.blocks];
        let equippedCount = 0;

        for (const accessory of gun.accessories) {
            const slotId = accessory.slotID;
            // 使用新架构：从 data.json 获取槽位信息
            const slotInfo = window.game.itemManager.getSlotInfo(weaponID, slotId);

            if (!slotInfo) {
                console.warn(`[AutoOptimize] 未找到槽位信息，weaponID: ${weaponID}, slotID: ${slotId}`);
                continue;
            }

            const slotTitle = slotInfo.slotName;
            const slotSubgrid = gun.subgrids[slotTitle];

            if (!slotSubgrid) {
                console.warn(`[AutoOptimize] 未找到配件槽，slotTitle: ${slotTitle}`);
                continue;
            }

            // 找到兼容的配件，按价值排序
            // 使用新架构：直接使用 acceptedObjectIDs 判断兼容性
            const acceptedObjectIDs = slotInfo.acceptedObjectIDs;
            const compatibleAccessories = groundItems
                .filter(item => {
                    if (!item.info || !item.info.objectID) return false;
                    return acceptedObjectIDs.includes(item.info.objectID);
                })
                .sort((a, b) => b.getValue() - a.getValue());

            if (compatibleAccessories.length > 0) {
                const bestAccessory = compatibleAccessories[0];

                // 从地面移除
                groundContainer.removeItem(bestAccessory);

                // 装到枪上
                slotSubgrid.addItem(bestAccessory, 0, 0);

                equippedCount++;
                console.log(`    ✓ [${slotTitle}] ${bestAccessory.name} (₽${bestAccessory.getValue().toLocaleString()})`);

                // 从待选列表中移除
                const index = groundItems.indexOf(bestAccessory);
                if (index > -1) {
                    groundItems.splice(index, 1);
                }
            }
        }

        if (equippedCount > 0) {
            console.log(`    装配完成: ${equippedCount}/${gun.accessories.length} 个配件`);
        }
    }


    private equipBestArmorAndHelmet(helmets: Item[], armors: Item[]) {
        if (!window.game.playerRegion) return;

        const playerInventory = window.game.playerRegion.inventories[0];
        if (!playerInventory) return;

        // 装备最贵的头盔
        if (helmets.length > 0) {
            helmets.sort((a, b) => b.getValue() - a.getValue());
            const bestHelmet = helmets[0];

            if (bestHelmet.parentGrid) {
                bestHelmet.parentGrid.removeItem(bestHelmet);
            }

            const helmetSlot = playerInventory.contents['Helmet'] as Subgrid;
            helmetSlot.addItem(bestHelmet, 0, 0);
            console.log(`装备头盔: ${bestHelmet.name} (价值: ${bestHelmet.getValue()})`);
        }

        // 装备最贵的护甲
        if (armors.length > 0) {
            armors.sort((a, b) => b.getValue() - a.getValue());
            const bestArmor = armors[0];

            if (bestArmor.parentGrid) {
                bestArmor.parentGrid.removeItem(bestArmor);
            }

            const armorSlot = playerInventory.contents['Armor'] as Subgrid;
            armorSlot.addItem(bestArmor, 0, 0);
            console.log(`装备护甲: ${bestArmor.name} (价值: ${bestArmor.getValue()})`);
        }
    }

    private equipLargestContainers(backpacks: Item[], chestRigs: Item[]) {
        if (!window.game.playerRegion) return;

        const playerInventory = window.game.playerRegion.inventories[0];
        if (!playerInventory) return;

        // 选择最大容量的背包
        if (backpacks.length > 0) {
            backpacks.sort((a, b) => this.getContainerCapacity(b) - this.getContainerCapacity(a));
            const largestBackpack = backpacks[0];

            if (largestBackpack.parentGrid) {
                largestBackpack.parentGrid.removeItem(largestBackpack);
            }

            const backpackSlot = playerInventory.contents['Backpack'] as Subgrid;
            backpackSlot.addItem(largestBackpack, 0, 0);

            // 设置背包容器
            if (largestBackpack.subgridLayout && largestBackpack.subgridLayout.length > 0) {
                const backpackContainer = playerInventory.contents['ContainerBackpack'] as GridContainer;
                backpackContainer.layout = largestBackpack.subgridLayout;
                backpackContainer.initSubgrids();
            }

            console.log(`装备最大背包: ${largestBackpack.name} (容量: ${this.getContainerCapacity(largestBackpack)})`);
        }

        // 选择最大容量的胸挂
        if (chestRigs.length > 0) {
            chestRigs.sort((a, b) => this.getContainerCapacity(b) - this.getContainerCapacity(a));
            const largestChestRig = chestRigs[0];

            if (largestChestRig.parentGrid) {
                largestChestRig.parentGrid.removeItem(largestChestRig);
            }

            const chestRigSlot = playerInventory.contents['ChestRig'] as Subgrid;
            chestRigSlot.addItem(largestChestRig, 0, 0);

            // 设置胸挂容器
            if (largestChestRig.subgridLayout && largestChestRig.subgridLayout.length > 0) {
                const chestRigContainer = playerInventory.contents['ContainerChestRigs'] as GridContainer;
                chestRigContainer.layout = largestChestRig.subgridLayout;
                chestRigContainer.initSubgrids();
            }

            console.log(`装备最大胸挂: ${largestChestRig.name} (容量: ${this.getContainerCapacity(largestChestRig)})`);
        }
    }

    private getContainerCapacity(container: Item): number {
        if (!container.subgridLayout || container.subgridLayout.length === 0) {
            return 0;
        }

        let totalCapacity = 0;
        for (const layout of container.subgridLayout) {
            // layout是 [width, height, x, y] 元组
            totalCapacity += layout[0] * layout[1];
        }
        return totalCapacity;
    }

    private fillContainersWithRemainingItems() {
        if (!window.game.playerRegion) return;

        const playerInventory = window.game.playerRegion.inventories[0];
        if (!playerInventory) return;

        const groundContainer = this.getGroundContainer();
        if (!groundContainer) return;

        // 获取地面剩余物品
        const remainingItems = [...groundContainer.blocks];

        // 🆕 按优先级和价值综合排序
        const sortedItems = this.sortItemsByPriority(remainingItems);

        console.log(`\n📦 开始填充容器，共 ${sortedItems.length} 个物品`);

        // 获取所有可用容器（按优先级排序）
        const containers: {container: Subgrid, priority: number}[] = [];

        // 1. 安全箱（最高优先级）
        const secureContainer = playerInventory.contents['ContainerSecure'] as GridContainer;
        if (secureContainer && secureContainer.subgrids) {
            secureContainer.subgrids.forEach(sg =>
                containers.push({container: sg, priority: 4})
            );
        }

        // 2. 口袋（中高优先级）
        const pocketContainer = playerInventory.contents['pocket'] as GridContainer;
        if (pocketContainer && pocketContainer.subgrids) {
            pocketContainer.subgrids.forEach(sg =>
                containers.push({container: sg, priority: 3})
            );
        }

        // 3. 胸挂容器（中等优先级）
        const chestRigContainer = playerInventory.contents['ContainerChestRigs'] as GridContainer;
        if (chestRigContainer && chestRigContainer.subgrids) {
            chestRigContainer.subgrids.forEach(sg =>
                containers.push({container: sg, priority: 2})
            );
        }

        // 4. 背包容器（低优先级，空间大）
        const backpackContainer = playerInventory.contents['ContainerBackpack'] as GridContainer;
        if (backpackContainer && backpackContainer.subgrids) {
            backpackContainer.subgrids.forEach(sg =>
                containers.push({container: sg, priority: 1})
            );
        }

        // 按优先级排序容器
        containers.sort((a, b) => b.priority - a.priority);

        let placedCount = 0;
        let totalValue = 0;

        // 尝试将物品放入容器
        for (const item of sortedItems) {
            let placed = false;

            // 高优先级物品优先放入高优先级容器
            const itemPriority = this.getItemPriority(item);

            // 为高优先级物品选择合适的容器
            const targetContainers = itemPriority >= 3
                ? containers.filter(c => c.priority >= 2)  // 高优先级物品放安全箱/口袋/胸挂
                : containers;  // 普通物品放所有容器

            for (const {container} of targetContainers) {
                // 从地面移除
                if (item.parentGrid) {
                    item.parentGrid.removeItem(item);
                }

                // 尝试放置物品
                if (this.tryPlaceItem(item, container)) {
                    placed = true;
                    placedCount++;
                    totalValue += item.getValue();
                    break;
                }
            }

            if (!placed) {
                // 如果高优先级容器放不下，尝试所有容器
                if (itemPriority >= 3) {
                    for (const {container} of containers) {
                        if (this.tryPlaceItem(item, container)) {
                            placed = true;
                            placedCount++;
                            totalValue += item.getValue();
                            break;
                        }
                    }
                }

                if (!placed) {
                    // 放回地面
                    this.tryPlaceItem(item, groundContainer);
                }
            }
        }

        console.log(`✅ 容器填充完成: ${placedCount}/${sortedItems.length} 个物品 (总价值: ₽${totalValue.toLocaleString()})`);

        // 刷新UI
        playerInventory.refreshUI();
    }

    /**
     * 🆕 按优先级和价值排序物品
     */
    private sortItemsByPriority(items: Item[]): Item[] {
        return items.sort((a, b) => {
            // 首先按优先级排序
            const priorityA = this.getItemPriority(a);
            const priorityB = this.getItemPriority(b);

            if (priorityA !== priorityB) {
                return priorityB - priorityA;  // 高优先级在前
            }

            // 优先级相同，按价值排序
            return b.getValue() - a.getValue();
        });
    }

    /**
     * 🆕 获取物品优先级
     * 5 = 最高（钥匙、贵重物品）
     * 4 = 高（弹药）
     * 3 = 中高（医疗用品）
     * 2 = 中（投掷物、消耗品）
     * 1 = 低（一般物品）
     */
    private getItemPriority(item: Item): number {
        // 钥匙和贵重收藏品
        if (item.type === 'key' || item.type === 'valuable') {
            return 5;
        }

        // 弹药（高优先级，战斗必需）
        if (item.type && item.type.includes('Ammo')) {
            return 4;
        }

        // 医疗用品（中高优先级）
        if (item.type === 'medical' || item.type === 'medicine' || item.type === 'healing') {
            return 3;
        }

        // 投掷物（中等优先级）
        if (item.type === 'grenade' || item.type === 'throwable') {
            return 2;
        }

        // 高价值物品也提升优先级
        const value = item.getValue();
        if (value > 50000) {
            return 3;  // 5万以上的物品视为中高优先级
        } else if (value > 20000) {
            return 2;  // 2-5万的物品视为中等优先级
        }

        // 其他物品
        return 1;
    }

    private tryPlaceItem(item: Item, container: Subgrid): boolean {
        // 遍历容器的所有位置
        for (let row = 0; row < container.height; row++) {
            for (let col = 0; col < container.width; col++) {
                // 检查是否可以放置
                const canPlace =
                    container.checkBoundary(item, col, row) &&
                    !container.checkForOverlap(item, col, row);

                if (canPlace) {
                    // 从原位置移除
                    if (item.parentGrid) {
                        item.parentGrid.removeItem(item);
                    }

                    // 放置到新位置
                    container.addItem(item, col, row);
                    return true;
                }

                // 尝试旋转
                const originalWidth = item.cellWidth;
                const originalHeight = item.cellHeight;
                item.cellWidth = originalHeight;
                item.cellHeight = originalWidth;

                const canPlaceRotated =
                    container.checkBoundary(item, col, row) &&
                    !container.checkForOverlap(item, col, row);

                if (canPlaceRotated) {
                    // 从原位置移除
                    if (item.parentGrid) {
                        item.parentGrid.removeItem(item);
                    }

                    // 放置到新位置
                    container.addItem(item, col, row);
                    return true;
                }

                // 恢复原始尺寸
                item.cellWidth = originalWidth;
                item.cellHeight = originalHeight;
            }
        }

        return false;
    }

    private unloadAllAccessories(guns: Item[], groundContainer: Subgrid) {
        for (const gun of guns) {
            if (!gun.subgrids || Object.keys(gun.subgrids).length === 0) {
                continue;
            }

            // 遍历武器的所有配件槽
            for (const slotName in gun.subgrids) {
                const subgrid = gun.subgrids[slotName];
                if (!subgrid || !subgrid.blocks || subgrid.blocks.length === 0) {
                    continue;
                }

                // 卸载配件到地面
                const accessories = [...subgrid.blocks];
                for (const accessory of accessories) {
                    subgrid.removeItem(accessory);
                    this.tryPlaceItem(accessory, groundContainer);
                    console.log(`卸载配件: ${accessory.name} 从 ${gun.name} 的 ${slotName}`);
                }
            }
        }
    }
}
