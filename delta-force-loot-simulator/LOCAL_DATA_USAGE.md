# 使用 data.json 本地数据说明

## 已完成的工作

1. ✅ 创建了数据转换脚本 `scripts/convertData.cjs`
2. ✅ 将 `data.json` (19.3MB) 转换为项目所需的本地 JSON 格式（827个物品）
3. ✅ 修改配置文件，默认使用本地数据
4. ✅ 修复了代码以支持本地数据加载
5. ✅ **创建了本地战利品生成器** `src/lootGenerator.ts`
6. ✅ **修改了 game.ts，根据配置自动选择本地/API模式**

## 项目数据流程说明

项目的数据分为两部分：

### 1. 物品基础数据 (ItemManager)
- **数据内容**：武器、配件、护甲、头盔、背包等物品的定义信息
- **数据来源**：`/public/json/` (本地) 或 API 端点
- **作用**：提供物品的基本属性（名称、尺寸、价格、图片等）

### 2. 战利品配置数据 (游戏关卡)
- **数据内容**：具体的战利品箱配置（每个箱子里有什么物品、在什么位置、带什么配件）
- **数据来源**：
  - **API 模式**：调用 `/api/public/gameitem/generate-loot` 动态生成
  - **本地模式**：使用 `src/lootGenerator.ts` 在前端生成
- **作用**：决定游戏开始时各个容器的具体内容

**现在项目已完全支持纯本地运行，不再依赖后端 API！**

## 生成的数据统计

从 data.json (19.3MB) 转换生成的本地数据：

| 数据类型 | 文件位置 | 数量 |
|---------|---------|-----|
| 步枪武器 | `/public/json/gun/gunRifle.json` | 52 |
| 手枪武器 | `/public/json/gun/gunPistol.json` | 7 |
| 弹药 | `/public/json/gun/ammo.json` | 83 |
| 后握把 | `/public/json/acc/accBackGrip.json` | 37 |
| 枪管 | `/public/json/acc/accBarrel.json` | 134 |
| 前握把 | `/public/json/acc/accForeGrip.json` | 21 |
| 功能配件 | `/public/json/acc/accFunctional.json` | 61 |
| 弹匣 | `/public/json/acc/accMagazine.json` | 69 |
| 枪口 | `/public/json/acc/accMuzzle.json` | 39 |
| 瞄具 | `/public/json/acc/accScope.json` | 42 |
| 枪托 | `/public/json/acc/accStock.json` | 72 |
| 护甲 | `/public/json/protect/armor.json` | 69 |
| 头盔 | `/public/json/protect/helmet.json` | 70 |
| 背包 | `/public/json/protect/backpack.json` | 26 |
| 胸挂 | `/public/json/protect/chestRigs.json` | 19 |
| 价格数据 | `/public/json/values.json` | 827 |
| 槽位映射 | `/public/json/gunSlotMap.json` | 59 |

**总计：827 个物品**

## 修改的文件

1. **scripts/convertData.cjs** (新增)
   - 数据转换脚本，将 data.json 转换为项目格式

2. **src/lootGenerator.ts** (新增)
   - 本地战利品生成器
   - 生成随机的战利品箱和玩家装备配置
   - 支持加权随机、品质分布、配件装配等

3. **src/config.ts**
   - 启用了本地 `values.json` 路径
   - 默认配置改为使用本地数据源（`resource_cdn: 'local'`）

4. **src/game.ts**
   - 导入 `lootGenerator`
   - 开发模式也使用本地数据
   - `startGameWithPreset` 函数根据配置自动选择本地/API模式

5. **src/itemManager.ts**
   - `getValues()` 方法支持根据配置动态选择数据源

6. **src/components/AutoOptimizeButton.ts**
   - 修复了 TypeScript 编译错误

## 如何使用

### 方式 1：直接运行（已配置好）

项目现在默认使用本地数据，直接运行即可：

```bash
npm run dev
```

### 方式 2：切换回 API 模式

如果需要切换回 API 模式，修改 `src/config.ts`:

```typescript
export const GAME_DEFAULT_CONFIG = {
    displayGridTitle: false,
    needSearch: true,
    resource_cdn: 'api',      // 改为 api
    realtime_value: 'api'     // 改为 api
}
```

### 方式 3：使用 CDN 模式

使用 jsDelivr CDN（GitHub 仓库）：

```typescript
export const GAME_DEFAULT_CONFIG = {
    displayGridTitle: false,
    needSearch: true,
    resource_cdn: 'jsdelivr',
    realtime_value: 'jsdelivr'
}
```

## 重新转换数据

如果 `data.json` 更新了，可以重新运行转换脚本：

```bash
node scripts/convertData.cjs
```

脚本会自动：
1. 读取根目录的 `data.json` 文件
2. 转换所有数据为项目所需格式
3. 保存到 `/public/json/` 目录
4. 生成价格数据和槽位映射文件

## 数据格式说明

转换后的数据符合项目的 jData 包装格式：

```json
{
  "jData": {
    "data": {
      "data": {
        "list": [
          {
            "objectID": 18060000011,
            "objectName": "AWM狙击步枪",
            "primaryClass": "gun",
            "secondClass": "gunRifle",
            "grade": 0,
            "length": 6,
            "width": 1,
            "pic": "图片URL",
            "baseValue": 556459,
            "searchTime": 1.2,
            "gunDetail": {
              "caliber": "ammo.338",
              "capacity": 5,
              "fireMode": "单发",
              "accessory": []
            }
          }
        ]
      }
    }
  }
}
```

## 注意事项

1. **图片链接**：转换后保留了原始的图片 URL，确保网络连接以加载图片
2. **背包/胸挂布局**：使用了简化的网格布局，可能需要根据实际容量调整
3. **武器配件槽**：`gunSlotMap.json` 是基础版本，完整槽位映射可从 `data.json` 的 `structuredData` 提取
4. **收集品/消耗品**：如果 `data.json` 中没有这些数据，生成的是空文件

## 构建项目

确认数据正常后，可以构建生产版本：

```bash
npm run build
```

生成的文件在 `dist/` 目录。
