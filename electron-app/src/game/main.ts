import { Game } from './Game';

/**
 * 主入口
 */
async function main() {
  console.log('战利品收集整理游戏 v1.0.0');
  console.log('正在启动...');

  try {
    // 创建游戏实例（不再需要传递配置）
    const game = new Game();

    // 初始化游戏（加载数据，创建UI）
    await game.init();

    // 启动游戏（创建战利品区域）
    await game.startGame();

    console.log('游戏启动成功!');
    console.log('使用 window.game 访问游戏实例');
  } catch (error) {
    console.error('游戏启动失败:', error);

    // 显示错误信息
    const appDiv = document.getElementById('app');
    if (appDiv) {
      appDiv.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          color: #fff;
          font-family: Arial, sans-serif;
        ">
          <h1 style="color: #ff0000;">游戏启动失败</h1>
          <p>${error instanceof Error ? error.message : '未知错误'}</p>
          <p style="color: #999;">请检查控制台以获取更多信息</p>
        </div>
      `;
    }
  }
}

// 启动应用
main();
