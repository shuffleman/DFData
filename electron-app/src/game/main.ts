import { Game } from "./game";
// import { version } from "../package.json";

// Note: Webpack uses process.env.NODE_ENV instead of import.meta.env
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === "development") {
    console.log("Development mode!");
}

(async () => {
    const game = new Game();
    await game.init();
    console.log("Game initialized!");
})();

