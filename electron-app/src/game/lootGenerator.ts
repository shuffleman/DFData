/**
 * 本地战利品生成器
 * 替代 /api/public/gameitem/generate-loot API
 */

/**
 * 生成随机战利品配置
 * @param spoilsCount 战利品箱数量
 * @param playerCount 玩家箱数量
 * @returns 战利品配置数据
 */
export function generateLocalLoot(spoilsCount: number = 3, playerCount: number = 3) {
    const lootData = {
        data: [] as any[]
    };

    // 生成战利品箱（普通容器）
    for (let i = 0; i < spoilsCount; i++) {
        lootData.data.push({
            type: 'spoilsContainer',
            title: `战利品箱 ${i + 1}`,
            content: [
                {
                    title: 'spoilsBox',
                    content: generateRandomItems(15, 30) // 随机15-30个物品（增加数量）
                }
            ]
        });
    }

    // 生成玩家箱（带装备的容器）
    for (let i = 0; i < playerCount; i++) {
        lootData.data.push({
            type: 'playerContainer',
            title: `玩家 ${i + 1}`,
            content: generatePlayerInventory()
        });
    }

    return lootData;
}

/**
 * 生成随机物品列表
 */
function generateRandomItems(minCount: number, maxCount: number) {
    const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
    const items = [];

    const itemTypes = [
        { type: 'collection', weight: 0.25 },
        { type: 'consume', weight: 0.12 },
        { type: 'ammo', weight: 0.18 },
        { type: 'primaryWeapon', weight: 0.08 }, // 添加主武器
        { type: 'secondaryWeapon', weight: 0.03 }, // 添加副武器
        { type: 'accScope', weight: 0.05 },
        { type: 'accMuzzle', weight: 0.05 },
        { type: 'accStock', weight: 0.04 },
        { type: 'accMagazine', weight: 0.04 },
        { type: 'accBarrel', weight: 0.04 },
        { type: 'accForeGrip', weight: 0.03 },
        { type: 'armor', weight: 0.03 },
        { type: 'helmet', weight: 0.03 },
        { type: 'backpack', weight: 0.02 },
        { type: 'chestRigs', weight: 0.02 }
    ];

    for (let i = 0; i < count; i++) {
        const itemType = weightedRandomSelect(itemTypes);

        // 如果是武器类型，使用 generateWeapon 生成带配件的武器
        if (itemType === 'primaryWeapon' || itemType === 'secondaryWeapon') {
            const weapon = generateWeapon(itemType, true); // 带配件
            if (weapon) {
                items.push(weapon);
            }
        } else {
            // 其他物品类型，正常生成
            const itemInfo = window.game.itemManager.itemInfos[itemType];

            if (itemInfo && itemInfo.length > 0) {
                const randomItem = itemInfo[Math.floor(Math.random() * itemInfo.length)];
                items.push({
                    name: randomItem.objectName,
                    objectID: randomItem.objectID,
                    position: null, // 自动放置
                    stack: randomItem.primaryClass === 'ammo' ? Math.floor(Math.random() * 60) + 1 : 1
                });
            }
        }
    }

    return items;
}

/**
 * 生成玩家装备清单
 */
function generatePlayerInventory() {
    const inventory = [];

    // 头盔槽
    inventory.push({
        title: 'Helmet',
        content: Math.random() > 0.3 ? [generateEquipment('helmet')] : []
    });

    // 护甲槽
    inventory.push({
        title: 'Armor',
        content: Math.random() > 0.1 ? [generateEquipment('armor')] : []
    });

    // 主武器1
    inventory.push({
        title: 'PrimaryWeapon1',
        content: Math.random() > 0.1 ? [generateWeapon('primaryWeapon', true)] : []
    });

    // 副武器
    inventory.push({
        title: 'Secondary',
        content: Math.random() > 0.7 ? [generateWeapon('secondaryWeapon', true)] : []
    });

    // 主武器2
    inventory.push({
        title: 'PrimaryWeapon2',
        content: Math.random() > 0.4 ? [generateWeapon('primaryWeapon', true)] : []
    });

    // 刀
    inventory.push({
        title: 'Knife',
        content: []
    });

    // 胸挂
    const chestRig = generateEquipment('chestRigs');
    inventory.push({
        title: 'ChestRig',
        content: [chestRig]
    });

    // 胸挂内容
    inventory.push({
        title: 'ContainerChestRigs',
        content: generateRandomItems(5, 12)  // 增加到5-12个物品
    });

    // 口袋
    inventory.push({
        title: 'pocket',
        content: generateRandomItems(3, 5)  // 增加到3-5个物品
    });

    // 背包
    const backpack = generateEquipment('backpack');
    inventory.push({
        title: 'Backpack',
        content: [backpack]
    });

    // 背包内容
    inventory.push({
        title: 'ContainerBackpack',
        content: generateRandomItems(10, 25)  // 增加到10-25个物品
    });

    // 安全箱
    inventory.push({
        title: 'ContainerSecure',
        content: generateRandomItems(2, 6).filter(item => {  // 增加到2-6个物品
            // 过滤掉武器和装备
            const info = window.game.itemManager.getItemInfoById(item.objectID);
            return info && !['gun', 'protect', 'acc'].includes(info.primaryClass);
        })
    });

    return inventory;
}

/**
 * 生成装备物品
 */
function generateEquipment(type: string) {
    const itemList = window.game.itemManager.itemInfos[type];
    if (!itemList || itemList.length === 0) {
        return null;
    }

    // 根据品质权重选择
    const gradeWeights = [0, 0.1, 0.2, 0.3, 0.25, 0.1, 0.05];
    const totalWeight = gradeWeights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    let selectedGrade = 0;
    for (let i = 0; i < gradeWeights.length; i++) {
        random -= gradeWeights[i];
        if (random <= 0) {
            selectedGrade = i;
            break;
        }
    }

    const itemsOfGrade = itemList.filter((item: any) => item.grade === selectedGrade);
    const items = itemsOfGrade.length > 0 ? itemsOfGrade : itemList;
    const randomItem = items[Math.floor(Math.random() * items.length)];

    return {
        name: randomItem.objectName,
        objectID: randomItem.objectID,
        position: [0, 0, 0, 0] // [subgrid_index, col, row, rotated]
    };
}

/**
 * 生成武器（带配件）
 */
function generateWeapon(type: string, withAccessories: boolean = true) {
    const weaponList = window.game.itemManager.itemInfos[type];
    if (!weaponList || weaponList.length === 0) {
        return null;
    }

    const randomWeapon = weaponList[Math.floor(Math.random() * weaponList.length)];

    const weapon: any = {
        name: randomWeapon.objectName,
        objectID: randomWeapon.objectID,
        position: [0, 0, 0, 0],
        ammo: []
    };

    // 添加弹药
    if (randomWeapon.gunDetail && randomWeapon.gunDetail.caliber) {
        const ammoList = window.game.itemManager.itemInfos['ammo'];
        if (ammoList) {
            const compatibleAmmo = ammoList.filter((ammo: any) =>
                ammo.secondClass === randomWeapon.gunDetail.caliber
            );
            if (compatibleAmmo.length > 0) {
                const randomAmmo = compatibleAmmo[Math.floor(Math.random() * compatibleAmmo.length)];
                weapon.ammo.push({
                    name: randomAmmo.objectName,
                    stack: Math.floor(Math.random() * (randomWeapon.gunDetail.capacity || 30)) + 1
                });
            }
        }
    }

    // 添加配件（根据参数决定）
    if (withAccessories) {
        weapon.accessories = generateWeaponAccessories(randomWeapon);
    }

    return weapon;
}

/**
 * 生成武器配件
 */
function generateWeaponAccessories(weapon: any): any[] {
    const accessories: any[] = [];

    // 使用新架构：从 data.json 获取武器槽位
    const weaponSlots = window.game.itemManager.getWeaponSlots(weapon.objectID);

    if (!weaponSlots || weaponSlots.length === 0) {
        return accessories;
    }

    // 为每个槽位生成配件
    for (const slot of weaponSlots) {
        // 70%概率为这个槽位添加配件（提高概率）
        if (Math.random() > 0.3) {
            // 获取这个槽位的配件信息
            const slotInfo = window.game.itemManager.getSlotInfo(weapon.objectID, slot.slotID);

            if (slotInfo && slotInfo.acceptedObjectIDs && slotInfo.acceptedObjectIDs.length > 0) {
                // 从兼容的配件中随机选择一个
                const randomAccObjectID = slotInfo.acceptedObjectIDs[
                    Math.floor(Math.random() * slotInfo.acceptedObjectIDs.length)
                ];

                // 获取配件信息
                const accInfo = window.game.itemManager.getItemInfoById(randomAccObjectID);

                if (accInfo) {
                    accessories.push({
                        name: accInfo.objectName,
                        objectID: accInfo.objectID,
                        slotID: slot.slotID  // 设置正确的槽位ID
                    });
                }
            }
        }
    }

    return accessories;
}

/**
 * 加权随机选择
 */
function weightedRandomSelect(items: { type: string, weight: number }[]) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
        random -= item.weight;
        if (random <= 0) {
            return item.type;
        }
    }

    return items[0].type;
}
