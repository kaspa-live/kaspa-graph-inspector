import * as PIXI from "pixi.js";
import {Block} from "./model/Block";

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

export default class BlockSprite extends PIXI.Sprite {
    private readonly application: PIXI.Application;
    private readonly block: Block;

    constructor(application: PIXI.Application, block: Block) {
        super(blockTexture(application));

        this.application = application;
        this.block = block;

        this.anchor.set(0.5, 0.5);
    }

    getBlock(): Block {
        return this.block
    }
};
