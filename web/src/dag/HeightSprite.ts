import * as PIXI from "pixi.js-legacy";
import { Ease, Tween } from "@createjs/tweenjs";
import { theme } from "./Theme";

const heightTextures: { [key: string]: PIXI.RenderTexture } = {};

const heightTexture = (application: PIXI.Application, width: number, height: number): PIXI.RenderTexture => {
    const resolution = application.renderer.resolution;
    const key = `${width},${height}-${resolution}`
    if (!heightTextures[key]) {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0xffffff);
        graphics.drawRect(0, 0, width, height);
        graphics.endFill();

        let textureOptions: PIXI.IGenerateTextureOptions = {
            scaleMode: PIXI.SCALE_MODES.LINEAR,
            resolution: resolution,
        }
        heightTextures[key] = application.renderer.generateTexture(graphics, textureOptions);
    }

    return heightTextures[key];
};

export default class HeightSprite extends PIXI.Container {
    private readonly application: PIXI.Application;
    private readonly blockHeight: number;
    private readonly spriteContainer: PIXI.Container;
    private readonly textContainer: PIXI.Container;

    private daaScore: number;
    private currentTextValue: number;

    private currentSprite: PIXI.Sprite;

    private spriteWidth: number = 0;
    private spriteHeight: number = 0;
    private daaScoreClickedListener: (daaScore: number) => void;

    constructor(application: PIXI.Application, blockHeight: number, daaScore: number, interactive: boolean) {
        super();

        this.application = application;
        this.blockHeight = blockHeight;
        this.daaScore = daaScore;
        this.currentTextValue = 0;

        this.daaScoreClickedListener = () => {
            // Do nothing
        };

        this.spriteContainer = new PIXI.Container();
        this.addChild(this.spriteContainer);

        this.textContainer = new PIXI.Container();
        this.addChild(this.textContainer);

        this.currentSprite = this.buildSprite(interactive);
        this.spriteContainer.addChild(this.currentSprite);
    }

    private buildSprite = (interactive: boolean): PIXI.Sprite => {
        const sprite = new PIXI.Sprite();
        sprite.anchor.set(0.5, 0.5);
        sprite.alpha = 0.0;
        sprite.tint = theme.components.height.color.highlight;

        sprite.interactive = true;
        sprite.buttonMode = true;
        if (interactive) {
            sprite.on("pointerover", () => {
                Tween.get(sprite).to({ alpha: 1.0 }, 200, Ease.linear);
            });
            sprite.on("pointerout", () => {
                Tween.get(sprite).to({ alpha: 0.0 }, 200, Ease.linear);
            });
            sprite.on("pointertap", () => this.daaScoreClickedListener(this.daaScore));
        }

        return sprite;
    }

    private buildText = (spriteHeight: number, blockSize: number): PIXI.Text => {
        const fontSize = Math.round(
            Math.max(theme.components.height.text.minFontSize,
                Math.min(blockSize * theme.components.height.text.multiplier.size,
                    theme.components.height.text.maxFontSize)));

        const bottomMargin = Math.round(
            Math.max(theme.components.height.text.minBottomMargin,
                Math.min(blockSize * theme.components.height.text.multiplier.bottomMargin,
                    theme.components.height.text.maxBottomMargin)));

        const style = new PIXI.TextStyle({
            fontFamily: theme.components.height.text.fontFamily,
            fontWeight: theme.components.height.text.fontWeight,
            fontSize: fontSize,
            fill: 0xffffff,
        });

        const spriteMarginXMult = theme.components.height.text.multiplier.marginX * blockSize / this.spriteWidth;
        const language = navigator.language || "en-US";
        const text = new PIXI.Text(this.getTextValue().toLocaleString(language), style);
        text.anchor.set(0.5, 0.5);
        text.tint = theme.components.height.color.contrastText;
        text.y = (spriteHeight / 2) - bottomMargin;
        const textSpriteSpread = Math.ceil((text.width / this.spriteWidth) + spriteMarginXMult);
        if (textSpriteSpread > 1 && this.blockHeight % textSpriteSpread !== 0) {
            return new PIXI.Text("", style);
        }
        return text;
    }

    setSize = (width: number, height: number, blockSize: number) => {
        if (!this.currentSprite.texture || this.spriteWidth !== width || this.spriteHeight !== height || this.currentTextValue !== this.getTextValue()) {
            this.spriteWidth = width;
            this.spriteHeight = height;
            this.currentSprite.texture = heightTexture(this.application, width, height);
            this.currentTextValue = this.getTextValue();

            const text = this.buildText(height, blockSize);
            this.textContainer.removeChildren();
            this.textContainer.addChild(text);
        }
    }

    getHeight = (): number => {
        return this.blockHeight;
    }

    setDAAScore = (daaScore: number) => {
        this.daaScore = daaScore;
    }

    getDAAScore = (): number => {
        return this.daaScore
    }

    getTextValue = (): number => {
        return (this.daaScore !== 0 ? this.daaScore : this.blockHeight);
    }

    setDAAScoreClickedListener = (daaScoreClickedListener: (daaScore: number) => void) => {
        this.daaScoreClickedListener = daaScoreClickedListener;
    }
}