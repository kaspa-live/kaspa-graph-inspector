import * as PIXI from "pixi.js";

export default class EdgeSprite extends PIXI.Graphics {
    private readonly color = 0xaaaaaa;
    private readonly lineWidth = 2;

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
        if (this.vectorX !== vectorX || this.vectorY !== vectorY) {
            this.vectorX = vectorX;
            this.vectorY = vectorY;

            this.clear();
            this.lineStyle(this.lineWidth, this.color);
            this.moveTo(0, 0);
            this.lineTo(vectorX, vectorY);
        }
    }

    getFromBlockId = (): number => {
        return this.fromBlockId;
    }

    getToBlockId = (): number => {
        return this.toBlockId;
    }
}