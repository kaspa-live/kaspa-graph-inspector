import * as PIXI from "pixi.js";

const edgeColor = 0xffaaaa;
const edgeLineWidth = 2;
const edgeTextures = new Map<{ x: number; y: number }, PIXI.RenderTexture>();

const edgeTexture = (application: PIXI.Application, x: number, y: number) => {
    if (!edgeTextures.has({x, y})) {
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(edgeLineWidth, edgeColor);
        graphics.moveTo(0, 0);
        graphics.lineTo(x, y);

        edgeTextures.set({x, y}, application.renderer.generateTexture(graphics, PIXI.SCALE_MODES.LINEAR, 1));
    }

    return edgeTextures.get({x, y}) as PIXI.RenderTexture;
};

export default class EdgeSprite extends PIXI.Sprite {
    private readonly application: PIXI.Application;
    private readonly fromBlockId: number;
    private readonly toBlockId: number;

    private fromX: number = 0;
    private fromY: number = 0;
    private toX: number = 0;
    private toY: number = 0;

    constructor(application: PIXI.Application, fromBlockId: number, toBlockId: number) {
        super();

        this.application = application;
        this.fromBlockId = fromBlockId;
        this.toBlockId = toBlockId;
    }

    update = (fromX: number, fromY: number, toX: number, toY: number) => {
        if (!this.texture || this.fromX !== fromX || this.fromY !== fromY || this.toX !== toX || this.toY !== toY) {
            this.fromX = fromX;
            this.fromY = fromY;
            this.toX = toX;
            this.toY = toY;

            const x = toX - fromX;
            const y = toY - fromY;
            this.texture = edgeTexture(this.application, x, y);
        }
    }

    getFromBlockId = () => {
        return this.fromBlockId;
    }

    getToBlockId = () => {
        return this.toBlockId;
    }
}