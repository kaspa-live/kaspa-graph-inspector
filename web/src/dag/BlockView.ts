import * as PIXI from "pixi.js";

let blockTextureInstance: PIXI.RenderTexture

const blockTexture = (application: PIXI.Application) => {
    if (!blockTextureInstance) {
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(2, 0x000000)
        graphics.beginFill(0xff0000);
        graphics.drawRoundedRect(0, 0, 100, 100, 30);
        graphics.endFill();

        blockTextureInstance = application.renderer.generateTexture(graphics, PIXI.SCALE_MODES.LINEAR, 1);
    }

    return blockTextureInstance;
};

export const newBlockSprite = (application: PIXI.Application) => {
    const sprite = new PIXI.Sprite(blockTexture(application));
    sprite.anchor.set(0.5, 0.5);
    return sprite;
};
