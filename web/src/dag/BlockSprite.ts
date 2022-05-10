import * as PIXI from "pixi.js-legacy";
import { Ease, Tween } from "@createjs/tweenjs";
import { Block } from "../model/Block";
import { BlockColorConst, BlockColor } from "../model/BlockColor";
import { HighlightFrame, theme } from "./Theme";

//const blockColors: { [color: string]: number } = {"gray": 0xf5faff, "red": 0xfc606f, "blue": 0xb4cfed};
//const highlightColors: { [color: string]: number } = {"gray": 0x78869e, "red": 0x9e4949, "blue": 0x49849e};
//const blockRoundingRadius = 10;
const blockTextures: { [key: string]: PIXI.RenderTexture } = {};

const blockTexture = (application: PIXI.Application, blockSize: number, blockColor: BlockColor): PIXI.RenderTexture => {
    const key = `${blockSize}-${blockColor}`
    if (!blockTextures[key]) {
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(theme.scale(theme.components.block[blockColor].border.width, blockSize), theme.components.block[blockColor].border.color, 1, 0.5);
        graphics.beginFill(0xffffff);
        graphics.drawRoundedRect(0, 0, blockSize, blockSize, theme.scale(theme.components.block.roundingRadius, blockSize));
        graphics.endFill();

        let textureOptions: PIXI.IGenerateTextureOptions  = {
            scaleMode: PIXI.SCALE_MODES.LINEAR,
            resolution: 1,
        }
        blockTextures[key] = application.renderer.generateTexture(graphics, textureOptions);
    }

    return blockTextures[key];
};

export default class BlockSprite extends PIXI.Container {
    private readonly application: PIXI.Application;
    private readonly block: Block;
    private readonly spriteContainer: PIXI.Container;
    private readonly textContainer: PIXI.Container;
    private readonly highlightContainer: PIXI.Container;

    private blockSize: number = 0;
    private isBlockSizeInitialized: boolean = false;
    private blockColor:  BlockColor = BlockColorConst.GRAY;
    private hasFocus: boolean = false;
    private isHighlighted: boolean = false;
    private highlightColor: BlockColor = BlockColorConst.GRAY;
    private currentSprite: PIXI.Sprite;
    private currentText?: PIXI.Text;
    private currentHighlight: PIXI.Graphics;
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

        this.highlightContainer = new PIXI.Container();
        this.highlightContainer.alpha = 0.0;
        this.addChild(this.highlightContainer);

        this.currentSprite = this.buildSprite();
        this.spriteContainer.addChild(this.currentSprite);

        this.currentHighlight = this.buildHighlight();
        this.highlightContainer.addChild(this.currentHighlight);

        this.scale.set(theme.components.block.scale.default, theme.components.block.scale.default);
    }

    private buildSprite = (): PIXI.Sprite => {
        const sprite = new PIXI.Sprite();
        sprite.anchor.set(0.5, 0.5);
        sprite.tint = theme.components.block[this.blockColor].color.main;

        sprite.interactive = true;
        sprite.buttonMode = true;
        sprite.on("pointerover", () => {
            Tween.get(this.scale).to({x: theme.components.block.scale.hover, y: theme.components.block.scale.hover}, 200, Ease.quadOut);
        });
        sprite.on("pointerout", () => {
            Tween.get(this.scale).to({x: theme.components.block.scale.default, y: theme.components.block.scale.default}, 200, Ease.quadOut);
        });
        sprite.on("pointertap", () => this.blockClickedListener(this.block));

        return sprite;
    }

    private buildText = (blockSize: number): PIXI.Text => {
        const style = new PIXI.TextStyle({
            fontFamily: theme.components.block.text.fontFamily,
            fontSize: blockSize * theme.components.block.text.multiplier.size,
            fontWeight: theme.components.block.text.fontWeight,
            fill: theme.components.block[this.blockColor].color.contrastText,
        });

        const blockHashLength = this.block.blockHash.length;
        const lastEightBlockHashCharacters = this.block.blockHash.substring(blockHashLength - 8).toUpperCase();
        const firstFourDisplayCharacters = lastEightBlockHashCharacters.substring(0, 4);
        const lastFourDisplayCharacter = lastEightBlockHashCharacters.substring(4);
        const displayHash = `${firstFourDisplayCharacters}\n${lastFourDisplayCharacter}`;

        const text = new PIXI.Text(displayHash, style);
        text.anchor.set(0.5, 0.5);
        return text;
    }

    private buildHighlight = (): PIXI.Graphics => {
        const blockHighlight = this.getHighlightFrame();
        const highlightSize = this.blockSize + theme.scale(blockHighlight.offset, this.blockSize);
        const highlightRoundingRadius = theme.scale(theme.components.block.roundingRadius + (blockHighlight.offset / 2), this.blockSize);

        const graphics = new PIXI.Graphics();
        graphics.lineStyle(theme.scale(blockHighlight.lineWidth, this.blockSize), theme.components.block[this.highlightColor].color.highlight);
        graphics.drawRoundedRect(0, 0, highlightSize, highlightSize, highlightRoundingRadius);
        graphics.position.set(-highlightSize / 2, -highlightSize / 2);
        return graphics;
    }

    setSize = (blockSize: number) => {
        if (!this.currentSprite.texture || this.blockSize !== blockSize) {
            this.blockSize = blockSize;
            this.currentSprite.texture = blockTexture(this.application, blockSize, this.blockColor);

            this.currentText = this.buildText(blockSize);
            this.textContainer.removeChildren();
            this.textContainer.addChild(this.currentText);

            const highlight = this.buildHighlight();
            this.highlightContainer.removeChildren();
            this.highlightContainer.addChild(highlight);
        }
        this.isBlockSizeInitialized = true;
    }

    wasBlockSizeSet = (): boolean => {
        return this.isBlockSizeInitialized;
    }

    setColor = (color: BlockColor) => {
        if (this.blockColor !== color) {
            this.blockColor = color;

            const oldSprite = this.currentSprite;

            this.currentSprite = this.buildSprite();
            this.currentSprite.texture = blockTexture(this.application, this.blockSize, this.blockColor);
            this.currentSprite.alpha = 0.0;
            this.spriteContainer.addChild(this.currentSprite);

            const oldText = this.currentText;
            this.currentText = this.buildText(this.blockSize);
            if (!oldText) {
                this.textContainer.removeChildren();
                this.textContainer.addChild(this.currentText);
            } else {
                this.currentText.alpha = 0.0;
                this.textContainer.addChild(this.currentText);
                Tween.get(this.currentText)
                    .to({alpha: 1.0}, 300)
                    .call(() => this.textContainer.removeChild(oldText!));
            }

            Tween.get(this.currentSprite)
                .to({alpha: 1.0}, 500)
                .call(() => this.spriteContainer.removeChild(oldSprite));
        }
    }

    setHighlighted = (isHighlighted: boolean, hasFocus: boolean, highlightColor: BlockColor) => {
        if (this.isHighlighted !== isHighlighted || this.hasFocus !== hasFocus || this.highlightColor !== highlightColor) {
            this.isHighlighted = isHighlighted;
            this.hasFocus = hasFocus;
            this.highlightColor = highlightColor;
            const blockHighlight = this.getHighlightFrame();

            const oldHighlight = this.currentHighlight;

            if (oldHighlight.alpha > 0.0 && this.highlightContainer.alpha > 0.0) {
                Tween.get(oldHighlight)
                .to({alpha: 0.0}, 300)
                .call(() => this.highlightContainer.removeChild(oldHighlight));
            } else {
                this.highlightContainer.removeChildren();
            }

            this.currentHighlight = this.buildHighlight();
            this.currentHighlight.alpha = 0.0;
            this.highlightContainer.addChild(this.currentHighlight);

            if (isHighlighted) {
                Tween.get(this.currentHighlight)
                .to({alpha: 1.0}, 300);
            }
 
            const toAlpha = this.isHighlighted ? blockHighlight.alpha : 0.0;
            if (toAlpha !== this.highlightContainer.alpha) {
                Tween.get(this.highlightContainer)
                .to({alpha: toAlpha}, 300);
            }
        }
    }

    setBlockClickedListener = (blockClickedListener: (block: Block) => void) => {
        this.blockClickedListener = blockClickedListener;
    }

    private getHighlightFrame = (): HighlightFrame => {
        return this.hasFocus ? theme.components.block.focus : theme.components.block.highlight;
    }

    // getRealBlockSize returns the actual block size based on
    // a theoretical block size, taking into account the theme properties
    static getRealBlockSize = (blockSize: number): number => {
        // As we have no knowledge of an actual block, we base the calculation
        // on theme blue block, considered the most relevant
        return (blockSize + theme.scale(theme.components.block.blue.border.width / 2.0, blockSize)) * theme.components.block.scale.default;
    }

    // clampVectorToBounds clamps the given vector's magnitude
    // to be fully within the block's shape
    static clampVectorToBounds = (blockSize: number, vectorX: number, vectorY: number): { blockBoundsVectorX: number, blockBoundsVectorY: number } => {
        const realBlockSize = BlockSprite.getRealBlockSize(blockSize);
        const halfBlockSize = realBlockSize / 2;

        // Don't bother with any fancy calculations if the y
        // coordinate is exactly 0
        if (vectorY === 0) {
            return {
                blockBoundsVectorX: vectorX >= 0 ? halfBlockSize : -halfBlockSize,
                blockBoundsVectorY: 0,
            };
        }

        const roundingRadius = theme.scale(theme.components.block.roundingRadius, blockSize)
        const halfBlockSizeMinusCorner = halfBlockSize - roundingRadius;

        // Abs the vector's x and y before getting its tangent
        // so that it's a bit easier to reason about
        const tangentOfAngle = Math.abs(vectorY) / Math.abs(vectorX);

        // Is the vector passing through the vertical lines of
        // the block?
        const yForHalfBlockSize = halfBlockSize * tangentOfAngle;
        if (yForHalfBlockSize <= halfBlockSizeMinusCorner) {
            return {
                blockBoundsVectorX: vectorX >= 0 ? halfBlockSize : -halfBlockSize,
                blockBoundsVectorY: vectorY >= 0 ? yForHalfBlockSize : -yForHalfBlockSize,
            };
        }

        // Is the vector passing through the horizontal lines of
        // the block?
        const xForHalfBlockSize = halfBlockSize / tangentOfAngle;
        if (xForHalfBlockSize <= halfBlockSizeMinusCorner) {
            return {
                blockBoundsVectorX: vectorX >= 0 ? xForHalfBlockSize : -xForHalfBlockSize,
                blockBoundsVectorY: vectorY >= 0 ? halfBlockSize : -halfBlockSize
            };
        }

        // If we reached here, the vector is certainly passing
        // through a corner.
        // The following calculation is derived from solving:
        //   (x-m)^2 + (y-n)^2 = r^2
        //   tan(α) = y/x
        // Where:
        //   m and n are `halfBlockSizeMinusCorner`
        //   tan(α) is `tangentOfAngle`
        //   r is `roundingRadius`
        const a = (tangentOfAngle ** 2) + 1;
        const b = -(2 * halfBlockSizeMinusCorner * (tangentOfAngle + 1));
        const c = (2 * (halfBlockSizeMinusCorner ** 2)) - (roundingRadius ** 2);
        const x = (-b + Math.sqrt((b ** 2) - (4 * a * c))) / (2 * a);
        const y = x * tangentOfAngle;

        return {
            blockBoundsVectorX: vectorX >= 0 ? x : -x,
            blockBoundsVectorY: vectorY >= 0 ? y : -y,
        };
    }
};
