import * as PIXI from "pixi.js";
import {Tween} from "@createjs/tweenjs";

const blockColors: { [color: string]: number } = {"gray": 0xaaaaaa, "red": 0xffaaaa, "blue": 0xaaaaff};
const blockRoundingRadius = 10;
const blockTextures: { [key: string]: PIXI.RenderTexture } = {};

const blockTexture = (application: PIXI.Application, blockSize: number): PIXI.RenderTexture => {
    const key = `${blockSize}`
    if (!blockTextures[key]) {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0xffffff);
        graphics.drawRoundedRect(0, 0, blockSize, blockSize, blockRoundingRadius);
        graphics.endFill();

        blockTextures[key] = application.renderer.generateTexture(graphics, PIXI.SCALE_MODES.LINEAR, 1);
    }

    return blockTextures[key];
};

export default class BlockSprite extends PIXI.Sprite {
    private readonly application: PIXI.Application;
    private readonly blockId: number;

    private blockSize: number = 0;
    private color: string = "gray";

    constructor(application: PIXI.Application, blockId: number) {
        super();

        this.application = application;
        this.blockId = blockId;

        this.anchor.set(0.5, 0.5);
        this.tint = blockColors[this.color]
    }

    resize = (blockSize: number) => {
        if (!this.texture || this.blockSize !== blockSize) {
            this.blockSize = blockSize;
            this.texture = blockTexture(this.application, blockSize);
        }
    }

    getBlockId = (): number => {
        return this.blockId;
    }

    setColor = (color: string) => {
        if (this.color !== color) {
            this.color = color;
            Tween.get(this).to({tint: blockColors[color]}, 500);
        }
    }
};
