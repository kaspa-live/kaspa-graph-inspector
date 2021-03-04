import * as PIXI from "pixi.js";

const blockColor = 0xaaaaaa;
const blockRoundingRadius = 10;
const blockTextures: { [blockSize: number]: PIXI.RenderTexture } = {};

const blockTexture = (application: PIXI.Application, blockSize: number): PIXI.RenderTexture => {
    if (!blockTextures[blockSize]) {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(blockColor);
        graphics.drawRoundedRect(0, 0, blockSize, blockSize, blockRoundingRadius);
        graphics.endFill();

        blockTextures[blockSize] = application.renderer.generateTexture(graphics, PIXI.SCALE_MODES.LINEAR, 1);
    }

    return blockTextures[blockSize];
};

export default class BlockSprite extends PIXI.Sprite {
    private readonly application: PIXI.Application;
    private readonly blockId: number;

    private blockSize: number = 0;

    constructor(application: PIXI.Application, blockId: number) {
        super();

        this.application = application;
        this.blockId = blockId;

        this.anchor.set(0.5, 0.5);
    }

    resize = (blockSize: number) => {
        if (!this.texture || this.blockSize !== blockSize) {
            this.blockSize = blockSize;
            this.texture = blockTexture(this.application, blockSize)
        }
    }

    getBlockId = (): number => {
        return this.blockId;
    }
};
