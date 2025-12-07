/**
 * 测试grid转换逻辑
 */
const fs = require('fs');
const path = require('path');

// 读取 data.json
const dataPath = path.join(__dirname, '../data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// 参考代码的 s 函数（重新实现以理解逻辑）
function referenceLayoutFunction(item) {
  const grids = (item && item.grid) || [];
  if (!grids.length) return [];

  // 按column分组
  const columnGroups = {};
  grids.forEach((gridItem) => {
    const column = gridItem.column || 1;
    if (!columnGroups[column]) {
      columnGroups[column] = [];
    }
    columnGroups[column].push(gridItem);
  });

  const result = [];

  // 对每个column排序并处理
  Object.keys(columnGroups)
    .sort((a, b) => a - b)
    .forEach((columnKey) => {
      const columnItems = columnGroups[columnKey];
      const rows = [];
      let currentRow = [];
      let previousSubColumn = undefined;

      for (const gridItem of columnItems) {
        const hasSubColumn = gridItem.hasOwnProperty('subColumn');
        const subColumn = hasSubColumn ? gridItem.subColumn : null;

        // 如果当前行为空，或者有subColumn且等于上一个subColumn，加入当前行
        if (currentRow.length === 0 || (hasSubColumn && subColumn === previousSubColumn && subColumn != null)) {
          currentRow.push(gridItem);
        } else {
          // 否则，保存当前行，开始新行
          rows.push(currentRow);
          currentRow = [gridItem];
        }
        previousSubColumn = subColumn;
      }

      // 保存最后一行
      if (currentRow.length) {
        rows.push(currentRow);
      }

      result.push(rows);
    });

  return result;
}

// 测试几个胸挂
const testItems = [
  { id: 11070002002, name: 'HK3便携胸挂' },
  { id: 11070004003, name: 'DRC先进侦察胸挂' },
  { id: 11070003003, name: 'DSA战术胸挂' }
];

for (const testItem of testItems) {
  const chest = data.rawData.chests.find(c => c.objectID === testItem.id);
  if (!chest) continue;

  console.log(`\n========== ${testItem.name} (${testItem.id}) ==========`);
  console.log('\n原始grid数据:');
  console.log(JSON.stringify(chest.grid, null, 2));

  console.log('\n参考代码的布局结构 [column][row][block]:');
  const refLayout = referenceLayoutFunction(chest);
  refLayout.forEach((column, colIndex) => {
    console.log(`  Column ${colIndex}:`);
    column.forEach((row, rowIndex) => {
      console.log(`    Row ${rowIndex}: ${row.length} blocks`);
      row.forEach((block, blockIndex) => {
        console.log(`      Block ${blockIndex}: ${block.grid.X}x${block.grid.Y}${block.grid.hidden ? ' (hidden)' : ''}${block.subColumn !== undefined ? ` subCol=${block.subColumn}` : ''}`);
      });
    });
  });

  console.log('\n应该转换为的坐标布局 [width, height, x, y]:');
  // 计算坐标
  const coordinates = [];
  let columnX = 0;

  for (const column of refLayout) {
    let rowY = 0;

    for (const row of column) {
      let blockX = 0;

      for (const block of row) {
        coordinates.push([
          block.grid.X,
          block.grid.Y,
          columnX + blockX,
          rowY
        ]);
        blockX += block.grid.X;
      }

      // 计算这一行的最大高度
      const rowHeight = Math.max(...row.map(b => b.grid.Y));
      rowY += rowHeight;
    }

    // 计算这一列的最大宽度
    const columnWidth = Math.max(...column.flat().map(b => b.grid.X));
    columnX += columnWidth;
  }

  coordinates.forEach((coord, i) => {
    console.log(`  [${i}]: [${coord.join(', ')}]`);
  });
}
