import * as PIXI from "pixi.js";
import {Ease, Tween} from "@createjs/tweenjs";
import {Block} from "./model/Block";

const blockColors: { [color: string]: number } = {"gray": 0xf5faff, "red": 0xfc606f, "blue": 0xb4cfed};
const blockRoundingRadius = 10;
const blockTextures: { [key: string]: PIXI.RenderTexture } = {};

const blockTexture = (application: PIXI.Application, blockSize: number): PIXI.RenderTexture => {
    const key = `${blockSize}`
    if (!blockTextures[key]) {
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(3, 0xaaaaaa);
        graphics.beginFill(0xffffff);
        graphics.drawRoundedRect(0, 0, blockSize, blockSize, blockRoundingRadius);
        graphics.endFill();

        blockTextures[key] = application.renderer.generateTexture(graphics, PIXI.SCALE_MODES.LINEAR, 1);
    }

    return blockTextures[key];
};

export default class BlockSprite extends PIXI.Container {
    private readonly unfocusedScale = 0.9;
    private readonly focusedScale = 1.0;
    private readonly textSizeMultiplier = 0.25;

    private readonly application: PIXI.Application;
    private readonly block: Block;
    private readonly spriteContainer: PIXI.Container;
    private readonly textContainer: PIXI.Container;

    private blockSize: number = 0;
    private blockColor: string = "gray";
    private currentSprite: PIXI.Sprite;
    private blockClickedListener: (block: Block) => void;

    constructor(application: PIXI.Application, block: Block) {
        super();

        this.application = application;
        this.block = block;

        this.blockClickedListener = () => {
            // Do nothing
        };

        this.spriteContainer = new PIXI.Container();
        this.addChild(this.spriteContainer);

        this.textContainer = new PIXI.Container();
        this.addChild(this.textContainer);

        this.currentSprite = this.buildSprite();
        this.spriteContainer.addChild(this.currentSprite);

        this.scale.set(this.unfocusedScale, this.unfocusedScale);
    }

    private buildSprite = (): PIXI.Sprite => {
        const sprite = new PIXI.Sprite();
        sprite.anchor.set(0.5, 0.5);
        sprite.tint = blockColors[this.blockColor];

        sprite.interactive = true;
        sprite.buttonMode = true;
        sprite.on("pointerover", () => {
            Tween.get(this.scale).to({x: this.focusedScale, y: this.focusedScale}, 200, Ease.quadOut);
        });
        sprite.on("pointerout", () => {
            Tween.get(this.scale).to({x: this.unfocusedScale, y: this.unfocusedScale}, 200, Ease.quadOut);
        });
        sprite.on("pointertap", () => this.blockClickedListener(this.block));

        return sprite;
    }

    private buildText = (blockSize: number): PIXI.Text => {
        const style = new PIXI.TextStyle({
            fontFamily: '"Lucida Console", "Courier", monospace',
            fontSize: blockSize * this.textSizeMultiplier,
            fontWeight: "bold",
            fill: 0x666666,
        });

        const blockHashLength = this.block.blockHash.length;
        const lastEightBlockHashCharacters = this.block.blockHash.substring(blockHashLength - 8).toUpperCase();
        const firstFourDisplayCharacters = lastEightBlockHashCharacters.substring(0, 4);
        const lastFourDisplayCharacter = lastEightBlockHashCharacters.substring(4);
        const displayHash = `${firstFourDisplayCharacters}\n${lastFourDisplayCharacter}`;

        const text = new PIXI.Text(displayHash, style);
        text.anchor.set(0.5, 0.5);
        text.tint = blockColors[this.blockColor];
        return text;
    }

    setSize = (blockSize: number) => {
        if (!this.currentSprite.texture || this.blockSize !== blockSize) {
            this.blockSize = blockSize;
            this.currentSprite.texture = blockTexture(this.application, blockSize);

            const text = this.buildText(blockSize);
            this.textContainer.removeChildren();
            this.textContainer.addChild(text);
        }
    }

    setColor = (color: string) => {
        if (this.blockColor !== color) {
            this.blockColor = color;

            const oldSprite = this.currentSprite;

            this.currentSprite = this.buildSprite();
            this.currentSprite.texture = blockTexture(this.application, this.blockSize);
            this.currentSprite.alpha = 0.0;
            this.spriteContainer.addChild(this.currentSprite);

            Tween.get(this.currentSprite)
                .to({alpha: 1.0}, 500)
                .call(() => this.removeChild(oldSprite));
        }
    }

    setBlockClickedListener = (blockClickedListener: (block: Block) => void) => {
        this.blockClickedListener = blockClickedListener;
    }

    clipEdgeVector = (vectorX: number, vectorY: number): { clipVectorX: number, clipVectorY: number } => {
        const halfBlockSize = Math.floor(this.blockSize / 2);
        if (vectorY === 0) {
            return {
                clipVectorX: vectorX >= 0 ? halfBlockSize : -halfBlockSize,
                clipVectorY: 0,
            };
        }

        const cornerSize = Math.floor(blockRoundingRadius / 2);
        const halfBlockSizeMinusCorner = halfBlockSize - cornerSize;

        const angleRadians = Math.atan2(vectorX, vectorY);
        const yForHalfBlockSize = Math.abs(halfBlockSize / Math.tan(angleRadians));
        if (yForHalfBlockSize <= halfBlockSizeMinusCorner) {
            return {
                clipVectorX: vectorX >= 0 ? halfBlockSize : -halfBlockSize,
                clipVectorY: vectorY >= 0 ? yForHalfBlockSize : -yForHalfBlockSize,
            };
        }
        const xForHalfBlockSize = Math.abs(halfBlockSize * Math.tan(angleRadians));
        if (xForHalfBlockSize <= halfBlockSizeMinusCorner) {
            return {
                clipVectorX: vectorX >= 0 ? xForHalfBlockSize : -xForHalfBlockSize,
                clipVectorY: vectorY >= 0 ? halfBlockSize : -halfBlockSize
            };
        }

        return {clipVectorX: 0, clipVectorY: 0};
    }
};
