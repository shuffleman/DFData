/**
 * 工具函数集合 - Updated 2025-10-07
 */

import { GridContainer } from "./gridContainer";
import { Inventory } from "./invntory";
import { Item } from "./item";
import { Region } from "./region";
import { Subgrid } from "./subgrid";
import { TotalValueDisplay } from "./totalValueDisplay";

/**
 * 生成指定范围内的随机整数
 * @param min 最小值
 * @param max 最大值
 * @returns 随机整数
 */
export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * 为一个 inventory 初始化一些物资
 * @param inventory 待初始化的 inventory
 * @param type 0 为普通容器，1 为玩家盒子，2 为地面容器（空）
 * @returns
 */
export const initInventory = (inventory: Inventory, type: number=0, preset_infos: any | null = null) => {
    // 用于记录需要自动排列的 GridContainer
    const gridContainersToArrange: GridContainer[] = [];

    if (preset_infos) {
        console.log(`[initInventory] 处理预设数据，包含 ${preset_infos.content.length} 个槽位`);
        for (const preset of preset_infos.content) {
            const grid = inventory.contents[preset.title];
            console.log(`[initInventory] 处理槽位: ${preset.title}, grid类型: ${grid?.constructor.name}, 物品数量: ${preset.content.length}`);

            // 记录 GridContainer 用于后续自动排列
            if (grid instanceof GridContainer && !gridContainersToArrange.includes(grid)) {
                gridContainersToArrange.push(grid);
                console.log(`[initInventory] 将 ${preset.title} 添加到自动排列列表`);
            }

            // console.log(grid)
            for (const item_info of preset.content) {
                const item_name = item_info.name;
                // 优先使用objectID查找，如果没有再用name查找
                let item_type = null;
                if (item_info.objectID) {
                    item_type = window.game.itemManager.getItemInfoById(item_info.objectID);
                }
                if (!item_type && item_name) {
                    item_type = window.game.itemManager.getItemInfoByName(item_name);
                }

                if (item_type) {
                    if (grid instanceof Subgrid) {
                        const item = new Item(item_type);
                        if(item_type.subgridLayout) {
                            item.subgridLayout = item_type.subgridLayout;
                        }

                        console.log(`[加载物品] ${item_name}, 配件信息:`, item_info.accessories, '位置:', item_info.position);
                        console.log(`[itemInfo.gunDetail]`, item_type.gunDetail);
                        console.log(`[item.accessories]`, item.accessories);
                        console.log(`[武器配件槽] subgrids数量: ${Object.keys(item.subgrids).length}, 槽位:`, Object.keys(item.subgrids));

                        // 使用position信息，如果没有则默认(0,0)
                        const pos_x = item_info.position ? item_info.position[1] : 0;
                        const pos_y = item_info.position ? item_info.position[2] : 0;
                        const rotated = item_info.position ? item_info.position[3] : 0;

                        // 如果旋转，交换宽高
                        if (rotated === 1) {
                            const tmp = item.cellWidth;
                            item.cellWidth = item.cellHeight;
                            item.cellHeight = tmp;
                        }

                        grid.addItem(item, pos_y, pos_x);
                        if (item_info.ammo) {
                            for (const ammoObject of item_info.ammo) {
                                item.ammo[ammoObject.name] = ammoObject.stack
                            }
                        }
                        if (item_info.accessories) {
                            console.log(`[开始装配配件] 枪械: ${item_name}, 配件数量: ${item_info.accessories.length}`);

                            // 获取武器ID
                            const weaponID = item.info?.objectID;
                            if (!weaponID) {
                                console.warn('[装配配件] 武器缺少 objectID，跳过配件装配');
                                continue;
                            }

                            // 获取武器的配件槽定义
                            const weaponAccessorySlots = item.accessories || [];
                            console.log(`[武器配件槽定义] 数量: ${weaponAccessorySlots.length}`);
                            if (weaponAccessorySlots.length > 0) {
                                console.log(`[配件槽示例] 字段名:`, Object.keys(weaponAccessorySlots[0]));
                                console.log(`[配件槽示例] 完整内容:`, weaponAccessorySlots[0]);
                                console.log(`[所有配件槽]`, weaponAccessorySlots);
                            }

                            for (const accessory of item_info.accessories) {
                                console.log(`[装配配件] 配件字段名:`, Object.keys(accessory));
                                console.log(`[装配配件] 配件完整内容:`, accessory);

                                // 使用 itemManager 查找配件信息
                                let accessory_type = window.game.itemManager.getItemInfoById(accessory.objectID);

                                if (!accessory_type) {
                                    console.error(`[错误] 找不到配件信息: objectID=${accessory.objectID}, 名称=${accessory.name}`);
                                    continue;
                                }

                                console.log(`[查找配件类型] objectID=${accessory.objectID}, 名称=${accessory.name}, 结果=`, accessory_type);

                                // 使用新架构：通过 slotID 获取槽位信息
                                let gun_subgrid_name = null;
                                const slotId = accessory.slotID;

                                if (slotId) {
                                    // 使用新架构的 API 获取槽位信息
                                    const slotInfo = window.game.itemManager.getSlotInfo(weaponID, slotId);
                                    console.log(`[查询槽位信息] weaponID=${weaponID}, slotID=${slotId}, 结果=`, slotInfo);

                                    if (slotInfo && slotInfo.slotName) {
                                        gun_subgrid_name = slotInfo.slotName;
                                        console.log(`[slotID匹配] slotID=${slotId} -> 槽位名称=${gun_subgrid_name}`);
                                        console.log(`[可用子网格键]`, Object.keys(item.subgrids));
                                        console.log(`[子网格是否存在] item.subgrids['${gun_subgrid_name}'] =`, item.subgrids[gun_subgrid_name]);
                                    } else {
                                        console.warn(`[警告] 无法获取 slotID ${slotId} 的槽位信息`);
                                    }
                                }

                                if (!gun_subgrid_name) {
                                    console.log(`[警告] 找不到配件槽: ${accessory.name} (slotID: ${accessory.slotID})`);
                                    console.log(`[可用槽位]`, Object.keys(item.subgrids).map(k => ({
                                        name: k,
                                        acceptedObjectIDs: item.subgrids[k].acceptedObjectIDs,
                                        occupied: item.subgrids[k].blocks.length
                                    })));
                                    continue;
                                }

                                const gun_subgrid = item.subgrids[gun_subgrid_name];
                                if (gun_subgrid) {
                                    const accessory_item = new Item(accessory_type);
                                    let addResult = gun_subgrid.addItem(accessory_item, 0, 0);

                                    if (addResult) {
                                        console.log(`[装配结果] ✓ ${accessory.name} -> ${gun_subgrid_name}`);
                                    } else {
                                        console.log(`[装配结果] ✗ ${accessory.name} 装配失败`);
                                    }
                                } else {
                                    console.log(`[错误] subgrid '${gun_subgrid_name}' 不存在`);
                                }
                            }
                        }
                        if (item_info.stack) {
                            item.currentStactCount = item_info.stack;
                        }
                        item.refreshUI();
                    } else if (grid instanceof GridContainer) {
                        // GridContainer中的物品
                        const item = new Item(item_type);
                        if(item_type.subgridLayout) {
                            item.subgridLayout = item_type.subgridLayout;
                        }
                        if (item_info.stack) {
                            item.currentStactCount = item_info.stack;
                        }

                        // 如果有position信息，则按指定位置放置
                        const item_position = item_info.position;
                        if (item_position && Array.isArray(item_position) && item_position.length >= 3) {
                            console.log(`[GridContainer物品] 按position放置: ${item_name} at [${item_position.join(', ')}]`);

                            if (!grid.subgrids || grid.subgrids.length === 0) {
                                console.error(`[错误] GridContainer的subgrids未初始化:`, grid);
                                continue;
                            }

                            const subgrid = grid.subgrids[item_position[0]];
                            if (!subgrid) {
                                console.error(`[错误] 找不到subgrid[${item_position[0]}]:`, grid);
                                continue;
                            }

                            const pos_x = item_position[1];
                            const pos_y = item_position[2];
                            if (item_position[3] === 1) {
                                const tmp = item.cellWidth;
                                item.cellWidth = item.cellHeight;
                                item.cellHeight = tmp;
                            }
                            subgrid.addItem(item, pos_y, pos_x);
                        } else {
                            // 没有position信息，添加到GridContainer的items列表，等待自动排列
                            console.log(`[GridContainer物品] 添加待自动排列: ${item_name}`);
                            if (!(grid as any).items) {
                                (grid as any).items = [];
                            }
                            (grid as any).items.push(item);
                        }

                        // 处理弹药
                        if (item_info.ammo) {
                            for (const ammoObject of item_info.ammo) {
                                item.ammo[ammoObject.name] = ammoObject.stack
                            }
                        }

                        // 处理武器配件
                        if (item_info.accessories) {
                            console.log(`[GridContainer武器] 开始装配配件: ${item_name}, 配件数量: ${item_info.accessories.length}`);

                            // ========== 新增：GridContainer 中的武器也动态创建缺失的 subgrid ==========
                            for (const accessory of item_info.accessories) {
                                const slotId = accessory.slotID;
                                if (slotId !== undefined && slotId !== null) {
                                    const slotInfo = window.game.itemManager.getGunSlotInfoByID(slotId);
                                    if (slotInfo && slotInfo.nameCN) {
                                        const slotName = slotInfo.nameCN;
                                        // 检查这个 subgrid 是否已经存在
                                        if (!item.subgrids[slotName]) {
                                            console.log(`[GridContainer动态创建槽位] slotID=${slotId}, 槽位名=${slotName}, 配件类型=${slotInfo.accType}`);
                                            // 动态创建 Subgrid
                                            const subgrid = new Subgrid({
                                                size: {width: 1, height: 1},
                                                cellSize: 72,
                                                aspect: 1,
                                                fullfill: true,
                                                countable: false,
                                                accept: [slotInfo.accType],
                                                title: slotName
                                            });
                                            subgrid.parentRegion = item;
                                            item.subgrids[slotName] = subgrid;
                                            subgrid.onItemDraggedIn = item.onAccessoryAdded.bind(item);
                                            subgrid.onItemDraggedOut = item.onAccessoryRemoved.bind(item);
                                            subgrid.setEnabled(false);
                                            console.log(`[GridContainer动态创建槽位] 完成: ${slotName}`);
                                        }
                                    }
                                }
                            }
                            // ========== GridContainer 动态创建 subgrid 结束 ==========

                            // 获取武器的配件槽定义
                            const weaponAccessorySlots = item.accessories || [];
                            console.log(`[GridContainer武器配件槽定义] 数量: ${weaponAccessorySlots.length}`);
                            if (weaponAccessorySlots.length > 0) {
                                console.log(`[GridContainer配件槽示例] 字段名:`, Object.keys(weaponAccessorySlots[0]));
                                console.log(`[GridContainer配件槽示例] 完整内容:`, weaponAccessorySlots[0]);
                            }

                            for (const accessory of item_info.accessories) {
                                console.log(`[GridContainer装配配件] 配件字段名:`, Object.keys(accessory));
                                console.log(`[GridContainer装配配件] 配件完整内容:`, accessory);

                                // 优先使用 itemManager 查找（如果加载了完整数据）
                                let accessory_type = window.game.itemManager.getItemInfoById(accessory.objectID);

                                // 如果查找失败，直接使用后端返回的配件信息
                                if (!accessory_type) {
                                    console.log(`[GridContainer装配配件] itemManager 中找不到配件，直接使用后端数据`);
                                    // 根据 slotID 获得对应的 accType
                                    const slotInfo = window.game.itemManager.getGunSlotInfoByID(accessory.slotID);
                                    const correctAccType = slotInfo ? slotInfo.accType : 'unknown';
                                    console.log(`[GridContainer装配配件] slotID=${accessory.slotID} 的 accType=${correctAccType}`);

                                    accessory_type = {
                                        name: accessory.name,
                                        objectID: accessory.objectID,
                                        secondClass: correctAccType, // 修复：使用 secondClass 而不是 type
                                        color: accessory.color ? parseInt(accessory.color, 16) : 0x808080,
                                        cellWidth: 1,
                                        cellHeight: 1,
                                        grade: 1
                                    };
                                }
                                if (!accessory_type) {
                                    console.error(`[GridContainer武器] 找不到配件信息: objectID=${accessory.objectID}, 名称=${accessory.name}`);
                                    continue;
                                }

                                // 通过 slotID 获取完整的槽位信息，然后用 nameCN 查找子网格
                                let gun_subgrid_name = null;
                                const backendSlotId = accessory.slotID;
                                if (backendSlotId !== undefined && backendSlotId !== null) {
                                    // 使用 itemManager 的 API 获取槽位信息
                                    const slotInfo = window.game.itemManager.getGunSlotInfoByID(backendSlotId);
                                    if (slotInfo && slotInfo.nameCN) {
                                        gun_subgrid_name = slotInfo.nameCN;
                                        console.log(`[GridContainer slotID匹配] slotID=${backendSlotId} -> 槽位名称=${gun_subgrid_name}`);
                                    } else {
                                        console.warn(`[GridContainer警告] 无法获取 slotID ${backendSlotId} 的槽位信息`);
                                    }
                                }

                                // 如果没有找到，尝试通过配件类型匹配空槽位
                                if (!gun_subgrid_name) {
                                    gun_subgrid_name = Object.keys(item.subgrids).find(
                                        key => item.subgrids[key].acceptedTypes.includes(accessory_type.type) &&
                                        item.subgrids[key].blocks.length === 0
                                    );
                                    console.log(`[GridContainer类型匹配] 配件类型=${accessory_type.type}, 找到槽位=${gun_subgrid_name}`);
                                }

                                if (!gun_subgrid_name) {
                                    console.log(`[GridContainer警告] 找不到配件槽: ${accessory.name} (slotID: ${accessory.slotID})`);
                                    console.log(`[GridContainer可用槽位]`, Object.keys(item.subgrids).map(k => ({
                                        name: k,
                                        accepts: item.subgrids[k].acceptedTypes,
                                        occupied: item.subgrids[k].blocks.length
                                    })));
                                    continue;
                                }

                                const gun_subgrid = item.subgrids[gun_subgrid_name];
                                if (gun_subgrid) {
                                    const accessory_item = new Item(accessory_type);
                                    let addResult = gun_subgrid.addItem(accessory_item, 0, 0);

                                    // 如果 addItem 失败，尝试直接添加（绕过检查）
                                    if (!addResult) {
                                        console.log(`[GridContainer] addItem 失败，尝试强制添加...`);
                                        try {
                                            accessory_item.parentGrid = gun_subgrid;
                                            accessory_item.col = 0;
                                            accessory_item.row = 0;
                                            gun_subgrid.blocks.push(accessory_item);
                                            accessory_item.refreshUI();
                                            addResult = true;
                                            console.log(`[GridContainer] 强制添加成功`);
                                        } catch (e) {
                                            console.error(`[GridContainer] 强制添加失败:`, e);
                                            addResult = false;
                                        }
                                    }
                                    console.log(`[GridContainer装配] ${accessory.name} -> ${gun_subgrid_name} (slotID: ${accessory.slotID}), 成功=${addResult}`);
                                }
                            }
                        }
                        if (item_info.stack) {
                            item.currentStactCount = item_info.stack;
                        }
                        item.refreshUI();
                    }
                } else {
                    console.warn(`[initInventory] 找不到物品: objectID=${item_info.objectID}, name=${item_info.name}`);
                }
            }
        }

        // 修复背包和胸挂的关联引用（加载预设数据时 onItemDraggedIn 没有触发）
        // 必须在autoArrange之前执行，确保子网格已经初始化
        if (inventory.contents['ChestRig'] instanceof Subgrid) {
            const chestRigSlot = inventory.contents['ChestRig'] as Subgrid;
            const containerChestRigs = inventory.contents['ContainerChestRigs'] as GridContainer;

            if (chestRigSlot.blocks.length > 0 && containerChestRigs) {
                const equippedChestRig = chestRigSlot.blocks[0];
                console.log(`[initInventory] 检测到已装备的胸挂: ${equippedChestRig.name}，设置关联引用并初始化子网格`);

                // 设置 associatedItem
                containerChestRigs.associatedItem = equippedChestRig;

                // 设置 layout 并初始化子网格
                containerChestRigs.layout = equippedChestRig.subgridLayout || [];
                if (Object.keys(equippedChestRig.subgrids).length > 0) {
                    // 如果胸挂物品已经有subgrids，使用它们
                    containerChestRigs.subgrids = [];
                    for (const subgrid of Object.values(equippedChestRig.subgrids)) {
                        subgrid.parentRegion = containerChestRigs as any;
                        containerChestRigs.subgrids.push(subgrid);
                    }
                    containerChestRigs.refreshUI();
                } else {
                    // 否则根据layout初始化新的subgrids
                    containerChestRigs.initSubgrids();
                }
                console.log(`[initInventory] 胸挂GridContainer初始化完成，子网格数量: ${containerChestRigs.subgrids.length}`);

                // 更新所有 subgrids 的 parentRegion
                for (const subgrid of containerChestRigs.subgrids) {
                    subgrid.parentRegion = containerChestRigs as any;
                }
            }
        }

        if (inventory.contents['Backpack'] instanceof Subgrid) {
            const backpackSlot = inventory.contents['Backpack'] as Subgrid;
            const containerBackpack = inventory.contents['ContainerBackpack'] as GridContainer;

            if (backpackSlot.blocks.length > 0 && containerBackpack) {
                const equippedBackpack = backpackSlot.blocks[0];
                console.log(`[initInventory] 检测到已装备的背包: ${equippedBackpack.name}，设置关联引用并初始化子网格`);

                // 设置 associatedItem
                containerBackpack.associatedItem = equippedBackpack;

                // 设置 layout 并初始化子网格
                containerBackpack.layout = equippedBackpack.subgridLayout || [];
                if (Object.keys(equippedBackpack.subgrids).length > 0) {
                    // 如果背包物品已经有subgrids，使用它们
                    containerBackpack.subgrids = [];
                    for (const subgrid of Object.values(equippedBackpack.subgrids)) {
                        subgrid.parentRegion = containerBackpack as any;
                        containerBackpack.subgrids.push(subgrid);
                    }
                    containerBackpack.refreshUI();
                } else {
                    // 否则根据layout初始化新的subgrids
                    containerBackpack.initSubgrids();
                }
                console.log(`[initInventory] 背包GridContainer初始化完成，子网格数量: ${containerBackpack.subgrids.length}`);

                // 更新所有 subgrids 的 parentRegion
                for (const subgrid of containerBackpack.subgrids) {
                    subgrid.parentRegion = containerBackpack as any;
                }
            }
        }

        // 对所有 GridContainer 进行自动排列（背包、胸挂等）
        console.log(`[initInventory] 开始对 ${gridContainersToArrange.length} 个 GridContainer 进行自动排列`);
        for (const gridContainer of gridContainersToArrange) {
            gridContainer.autoArrange();
        }

        return;
    }

    // console.log('1111', type)
    if (type === 2) {
        // 地面容器：不需要初始化任何物品，保持空的
        return;
    } else if (type === 0) {
        // Spoils box
        const subgrid = inventory.contents['spoilsBox'] as Subgrid;
        const blocksNum = Math.floor(Math.random() * 10) + 1; // 随机生成0到9个方块
        let items = [];
        for (let i = 0; i < blocksNum; i++) {
            const info = window.game.itemManager.getRandomItemWithPreset('default');
            items.push(info);
        }

        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 8; col++) {
                // console.log('ddd', items.length)
                if(items.length === 0) {
                    return;
                }
                const info = items[0];
                const checkSize = {
                    cellWidth: info.length,
                    cellHeight: info.width,
                    col: col,
                    row: row,
                }
                const bOverlap = subgrid.checkForOverlap(checkSize, col, row);
                const bBoundary = subgrid.checkBoundary(checkSize, col, row);
                // console.log('eee', bOverlap, bBoundary)
                if (!bOverlap && bBoundary) {
                    // console.log("aaa", blockType, item);
                    // 使用 Block 类创建方块
                    const block = new Item(info);
                    if(info.subgridLayout) {
                        block.subgridLayout = info.subgridLayout;
                    }
                    subgrid.addItem(block, col, row);

                    items.shift(); // 移除已放置的方块类型
                    if (items.length === 0) {
                        // console.log(this.blocks);
                        return;
                    }
                }
            }
        }
    } else {
        // TODO
        const tasks1 = [
            {
                type: 'primaryWeapon',
                grades: [1, 0, 0, 0, 0, 0, 0, 0],
                subgrid: 'PrimaryWeapon1',
                probability: 0.9,
            },
            {
                type: 'secondaryWeapon',
                grades: [1, 0, 0, 0, 0, 0, 0, 0],
                subgrid: 'Secondary',
                probability: 0.3,
            },
            {
                type: 'primaryWeapon',
                grades: [1, 0, 0, 0, 0, 0, 0, 0],
                subgrid: 'PrimaryWeapon2',
                probability: 0.6,
            },
            {
                type: 'helmet',
                grades: [0, 0.1, 0.1, 0.3, 0.3, 0.15, 0.05, 0],
                subgrid: 'Helmet',
                probability: 0.7,
            },
            {
                type: 'armor',
                grades: [0, 0.1, 0.1, 0.3, 0.3, 0.15, 0.05, 0],
                subgrid: 'Armor',
                probability: 0.9,
            },
            {
                type: 'chestRigs',
                grades: [0, 0.1, 0.2, 0.2, 0.4, 0.1, 0, 0],
                subgrid: 'ChestRig',
                probability: 1,
            },
            {
                type: 'backpack',
                grades: [0, 0.1, 0.2, 0.2, 0.3, 0.1, 0.1, 0],
                subgrid: 'Backpack',
                probability: 1,
            },
        ]
        for (const task of tasks1) {
            if (Math.random() < task.probability) {
                const subgrid = inventory.contents[task.subgrid] as Subgrid;
                const probObject: { [key: string]: { prob: number, grades: number[] } } = {};
                probObject[task.type] = {
                    prob: 1,
                    grades: task.grades
                }
                const info = window.game.itemManager.getRandomItem(probObject);
                // console.log(probObject)
                const item = new Item(info);
                // console.log(subgrid)
                // console.log(task)
                // if (info.primaryClass === 'gun') {
                //     console.log(info, inventory.title, item)
                // }
                subgrid.addItem(item);
                // if (info.primaryClass === 'gun') {
                //     console.log(info, 'added')
                // }
            }
        }
        // 口袋、背包、胸挂特殊处理
        const tasks2 = [
            {
                type: 'pocket',
                container: 'pocket',
                stop_probability: 0.12,
                prerequisite: null,
            },
            {
                type: 'chestRigs',
                container: 'ContainerChestRigs',
                stop_probability: 0.08,
                prerequisite: 'ChestRig',
            },
            {
                type: 'backpack',
                container: 'ContainerBackpack',
                stop_probability: 0.1,
                prerequisite: 'Backpack',
            },
        ];
        for (const task of tasks2) {
            while(true) {
                if (Math.random() < task.stop_probability) {
                    break;
                }
                if (task.prerequisite && !inventory.contents[task.prerequisite]) {
                    break;
                }
                const gridContainer = inventory.contents[task.container] as GridContainer;
                const info = window.game.itemManager.getRandomItemWithPreset('default');
                // console.log('info', task.type, info, gridContainer);
                const item = new Item(info);
                gridContainer.addItem(item);
            }
        }
    }
}

export const updateTotalValueDisplay = () => {
    if(!window.game.controlPanelRegion) return;
    if(!window.game.controlPanelRegion.components['totalValueDisplay']) return;
    const totalValueDisplay = window.game.controlPanelRegion.components['totalValueDisplay'] as TotalValueDisplay;
    totalValueDisplay.updateTotalValue();
}

export const initSpoilsRegion = (position: {x: number, y: number}, presets: any | null = null) => {
    const region = new Region(position, {
        title: "战利品",
        width: 508,
        height: 632,
        titleColor: 0x999999,
        titleAlpha: 0.3,
        componentWidth: 0,
        backgroundColor: 0xffffff,
        backgroundAlpha: 0.1,
        countable: false,
    });
    if (presets) {
        // console.log(presets)
        for ( const preset of presets.data) {
            const inventory_type = preset.type === 'playerContainer' ? 1 : 0;
            const inventory = region.addInventory(inventory_type, false);
            initInventory(inventory, inventory_type, preset);
            inventory.setEnabled(false);
        }
    } else {
        for (let i = 0; i < window.game.defaultSpoilsRegionNumber; i += 1) {
            region.addInventory(0, true);
        }
        for (let i = 0; i < window.game.defaultPlayerRegionNumber; i += 1) {
            region.addInventory(1, true);
        }
    }
    region.switchTo(0);
    region.addSwitcherUI();

    return region;
}