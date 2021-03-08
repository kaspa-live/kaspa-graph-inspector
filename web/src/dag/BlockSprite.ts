import * as PIXI from "pixi.js";
import {Ease, Tween} from "@createjs/tweenjs";

const blockColors: { [color: string]: number } = {"gray": 0xaaaaaa, "red": 0xffaaaa, "blue": 0xaaaaff};
const blockRoundingRadius = 10;
const blockTextures: { [key: string]: PIXI.RenderTexture } = {};

const blockTexture = (application: PIXI.Application, blockSize: number): PIXI.RenderTexture => {
    const key = `${blockSize}`
    if (!blockTextures[key]) {
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(2, 0x222222)
        graphics.beginFill(0xffffff);
        graphics.drawRoundedRect(0, 0, blockSize, blockSize, blockRoundingRadius);
        graphics.endFill();

        blockTextures[key] = application.renderer.generateTexture(graphics, PIXI.SCALE_MODES.LINEAR, 1);
    }

    return blockTextures[key];
};

export default class BlockSprite extends PIXI.Container {
    private readonly unfocusedScale = 0.75;
    private readonly focusedScale = 1.0;

    private readonly application: PIXI.Application;

    private blockSize: number = 0;
    private blockColor: string = "gray";
    private currentSprite: PIXI.Sprite;

    constructor(application: PIXI.Application) {
        super();

        this.application = application;

        this.interactive = true;
        this.buttonMode = true;
        this.on("pointerover", () => {
            Tween.get(this.scale).to({x: this.focusedScale, y: this.focusedScale}, 200, Ease.quadOut);
        });
        this.on("pointerout", () => {
            Tween.get(this.scale).to({x: this.unfocusedScale, y: this.unfocusedScale}, 200, Ease.quadOut);
        });
        this.scale.set(this.unfocusedScale, this.unfocusedScale);

        this.currentSprite = this.buildSprite();
        this.addChild(this.currentSprite)
    }

    private buildSprite = () => {
        const sprite = new PIXI.Sprite();
        sprite.anchor.set(0.5, 0.5);
        sprite.tint = blockColors[this.blockColor];
        return sprite;
    }

    setSize = (blockSize: number) => {
        if (!this.currentSprite.texture || this.blockSize !== blockSize) {
            this.blockSize = blockSize;
            this.currentSprite.texture = blockTexture(this.application, blockSize);
        }
    }

    setColor = (color: string) => {
        if (this.blockColor !== color) {
            this.blockColor = color;

            const oldSprite = this.currentSprite;

            this.currentSprite = this.buildSprite();
            this.currentSprite.texture = blockTexture(this.application, this.blockSize);
            this.currentSprite.alpha = 0.0;
            this.addChild(this.currentSprite);

            Tween.get(this.currentSprite)
                .to({alpha: 1.0}, 500)
                .call(() => this.removeChild(oldSprite));
        }
    }
};
