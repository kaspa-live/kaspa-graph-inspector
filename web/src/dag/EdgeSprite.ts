import * as PIXI from "pixi.js";

const edgeColor = 0xaaaaaa;
const edgeLineWidth = 2;
const edgeTextures: { [key: string]: PIXI.RenderTexture } = {};

const edgeTexture = (application: PIXI.Application, vectorX: number, vectorY: number): PIXI.RenderTexture => {
    const key = `${vectorX},${vectorY}`
    if (!edgeTextures[key]) {
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(edgeLineWidth, edgeColor);
        graphics.moveTo(0, 0);
        graphics.lineTo(vectorX, vectorY);

        edgeTextures[key] = application.renderer.generateTexture(graphics, PIXI.SCALE_MODES.LINEAR, 1);
    }

    return edgeTextures[key];
};

export default class EdgeSprite extends PIXI.Sprite {
    private readonly application: PIXI.Application;
    private readonly fromBlockId: number;
    private readonly toBlockId: number;

    private vectorX: number = 0;
    private vectorY: number = 0;

    constructor(application: PIXI.Application, fromBlockId: number, toBlockId: number) {
        super();

        this.application = application;
        this.fromBlockId = fromBlockId;
        this.toBlockId = toBlockId;
    }

    setVector = (vectorX: number, vectorY: number) => {
        if (!this.texture || this.vectorX !== vectorX || this.vectorY !== vectorY) {
            this.vectorX = vectorX;
            this.vectorY = vectorY;

            this.texture = edgeTexture(this.application, vectorX, vectorY);
        }
    }

    getFromBlockId = (): number => {
        return this.fromBlockId;
    }

    getToBlockId = (): number => {
        return this.toBlockId;
    }
}