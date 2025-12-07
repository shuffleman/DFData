/**
 * 背包/胸挂格子布局转换器
 * 将API返回的grid数据转换为游戏使用的subgridLayout格式
 */

interface GridData {
    grid: {
        X: number;
        Y: number;
    };
    column: number;
    subColumn?: number;
}

interface SubgridLayout {
    width: number;
    height: number;
    xOffset: number;
    yOffset: number;
}

/**
 * 转换grid数据为subgridLayout
 *
 * 布局规则（重要！）：
 * - column 相同的格子在同一列（X相同，垂直堆叠，Y递增）
 * - column 不同的格子在同一行（Y相同，水平排列，X递增）
 * - subColumn 相同的格子在同一行（Y相同，水平排列，X递增）
 * - subColumn 不同的格子在同一列（X相同，垂直堆叠，Y递增）
 *
 * 示例：column=1 和 column=2 水平并排（X不同），每个column内部垂直堆叠（Y递增）
 *       在同一column内，subColumn相同的格子水平排列（X递增，Y相同）
 *
 * @param gridArray 原始grid数据数组
 * @returns subgridLayout数组，格式：[width, height, xOffset, yOffset][]
 */
export function convertGridToLayout(gridArray: GridData[]): [number, number, number, number][] {
    if (!gridArray || gridArray.length === 0) {
        return [];
    }

    // 1. 按 column 分组
    const columns = new Map<number, Map<number | null, GridData[]>>();

    for (const item of gridArray) {
        if (!columns.has(item.column)) {
            columns.set(item.column, new Map());
        }

        const subCol = item.subColumn ?? null;
        const columnMap = columns.get(item.column)!;

        if (!columnMap.has(subCol)) {
            columnMap.set(subCol, []);
        }
        columnMap.get(subCol)!.push(item);
    }

    // 2. 计算每个格子的位置
    const layouts: SubgridLayout[] = [];
    let currentColumnX = 0;  // 当前主列的X偏移（水平位置）

    // 按 column 排序（column 1, 2, 3... 从左到右排列）
    const sortedColumns = Array.from(columns.keys()).sort((a, b) => a - b);

    for (const colNum of sortedColumns) {
        const columnMap = columns.get(colNum)!;
        let currentRowY = 0;  // 当前行的Y偏移（垂直位置）
        let maxColumnWidth = 0;  // 当前主列的最大宽度

        // 先处理没有 subColumn 的格子（通常是主格子，如 2x2）
        if (columnMap.has(null)) {
            const items = columnMap.get(null)!;
            for (const item of items) {
                layouts.push({
                    width: item.grid.X,
                    height: item.grid.Y,
                    xOffset: currentColumnX,
                    yOffset: currentRowY
                });
                currentRowY += item.grid.Y;  // 垂直堆叠（Y递增）
                maxColumnWidth = Math.max(maxColumnWidth, item.grid.X);
            }
        }

        // 处理有 subColumn 的格子
        // subColumn 不同的格子垂直排列（Y不同）
        // subColumn 相同的格子水平排列（X不同，Y相同）
        const subColumns = Array.from(columnMap.keys())
            .filter(key => key !== null)
            .sort((a, b) => (a as number) - (b as number));

        for (const subColNum of subColumns) {
            const items = columnMap.get(subColNum)!;
            let subColX = currentColumnX;  // 这一行子格子的起始X位置
            const subColY = currentRowY;   // 这一行子格子的Y位置（相同subColumn，Y相同）
            let rowWidth = 0;

            // subColumn 相同的格子水平排列
            for (const item of items) {
                layouts.push({
                    width: item.grid.X,
                    height: item.grid.Y,
                    xOffset: subColX,
                    yOffset: subColY
                });
                subColX += item.grid.X;  // 水平排列（X递增）
                rowWidth += item.grid.X;
            }

            maxColumnWidth = Math.max(maxColumnWidth, rowWidth);

            // 计算这一行的最大高度，更新下一行的Y位置
            const rowHeight = Math.max(...items.map(item => item.grid.Y));
            currentRowY += rowHeight;  // 不同 subColumn 垂直排列（Y递增）
        }

        currentColumnX += maxColumnWidth;  // 下一个主列水平排列（X递增）
    }

    // 3. 转换为 [width, height, xOffset, yOffset] 格式
    return layouts.map(layout => [
        layout.width,
        layout.height,
        layout.xOffset,
        layout.yOffset
    ]);
}

/**
 * 示例用法：
 *
 * 输入：
 * [
 *   { grid: { X: 2, Y: 2 }, column: 1 },
 *   { grid: { X: 1, Y: 3 }, column: 1, subColumn: 1 },
 *   { grid: { X: 1, Y: 3 }, column: 1, subColumn: 1 },
 *   { grid: { X: 2, Y: 2 }, column: 2 },
 *   { grid: { X: 1, Y: 3 }, column: 2, subColumn: 2 },
 *   { grid: { X: 1, Y: 3 }, column: 2, subColumn: 2 }
 * ]
 *
 * 布局示意图（column 1 和 2 水平并排，subColumn 相同的格子水平排列）：
 *
 *  column=1                column=2
 * ┌─────────┐            ┌─────────┐
 * │  2x2    │            │  2x2    │
 * │ (0,0)   │            │ (2,0)   │
 * └─────────┘            └─────────┘
 * ┌────┐┌────┐          ┌────┐┌────┐
 * │1x3 ││1x3 │          │1x3 ││1x3 │ ← subColumn 相同，水平排列
 * │    ││    │          │    ││    │
 * │(0,2)│(1,2)│        │(2,2)│(3,2)│
 * └────┘└────┘          └────┘└────┘
 *
 * 输出：
 * [
 *   [2, 2, 0, 0],     // column=1 的 2x2 格子
 *   [1, 3, 0, 2],     // column=1, subColumn=1 的第1个 1x3 格子
 *   [1, 3, 1, 2],     // column=1, subColumn=1 的第2个 1x3 格子（水平排列，X递增）
 *   [2, 2, 2, 0],     // column=2 的 2x2 格子
 *   [1, 3, 2, 2],     // column=2, subColumn=2 的第1个 1x3 格子
 *   [1, 3, 3, 2]      // column=2, subColumn=2 的第2个 1x3 格子（水平排列，X递增）
 * ]
 */
