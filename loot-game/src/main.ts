import { Game } from './Game';
import type { GameConfig } from '@types/index';

/**
 * 主入口
 */
async function main() {
  console.log('战利品收集整理游戏 v1.0.0');
  console.log('正在启动...');

  // 游戏配置
  const config: GameConfig = {
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1a1a1a,
    playerAreaWidth: 35,    // 35%
    lootAreaWidth: 50,      // 50%
    controlPanelWidth: 15,  // 15%
    cellSize: 60,           // 60像素每格
    maxTabs: 6,             // 最多6个tab
  };

  try {
    // 创建游戏实例
    const game = new Game(config);

    // 初始化游戏
    await game.initialize();

    // 启动游戏
    game.start();

    // 窗口大小调整处理
    window.addEventListener('resize', () => {
      // TODO: 实现窗口大小调整
      console.log('窗口大小已改变');
    });

    // 将game实例暴露到全局，方便调试
    (window as any).game = game;

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
