import * as PIXI from "pixi.js";
import {Tween} from "@createjs/tweenjs";

export default class EdgeSprite extends PIXI.Container {
    private readonly normalColor = 0xaaaaaa;
    private readonly normalLineWidth = 2;
    private readonly selectedColor = 0xaaaaff;
    private readonly selectedLineWidth = 4;

    private readonly application: PIXI.Application;
    private readonly fromBlockId: number;
    private readonly toBlockId: number;

    private vectorX: number = 0;
    private vectorY: number = 0;
    private isInVirtualSelectedParentChain: boolean = false;
    private currentGraphics: PIXI.Graphics;

    constructor(application: PIXI.Application, fromBlockId: number, toBlockId: number) {
        super();

        this.application = application;
        this.fromBlockId = fromBlockId;
        this.toBlockId = toBlockId;

        this.currentGraphics = this.buildGraphics();
        this.addChild(this.currentGraphics);
    }

    private buildGraphics = () => {
        return new PIXI.Graphics();
    }

    setVector = (vectorX: number, vectorY: number) => {
        if (this.vectorX !== vectorX || this.vectorY !== vectorY) {
            this.vectorX = vectorX;
            this.vectorY = vectorY;

            this.renderGraphics()
        }
    }

    private renderGraphics = () => {
        const lineWidth = this.isInVirtualSelectedParentChain ? this.selectedLineWidth : this.normalLineWidth;
        const color = this.isInVirtualSelectedParentChain ? this.selectedColor : this.normalColor;

        this.currentGraphics.clear();
        this.currentGraphics.lineStyle(lineWidth, color);
        this.currentGraphics.moveTo(0, 0);
        this.currentGraphics.lineTo(this.vectorX, this.vectorY);
    }

    setIsInVirtualSelectedParentChain = (isInVirtualSelectedParentChain: boolean) => {
        if (this.isInVirtualSelectedParentChain !== isInVirtualSelectedParentChain) {
            this.isInVirtualSelectedParentChain = isInVirtualSelectedParentChain;

            const oldGraphics = this.currentGraphics;

            this.currentGraphics = this.buildGraphics();
            this.renderGraphics();
            this.currentGraphics.alpha = 0.0;
            this.addChild(this.currentGraphics);

            Tween.get(this.currentGraphics).to({alpha: 1.0}, 500);
            Tween.get(oldGraphics)
                .to({alpha: 0.0}, 500)
                .call(() => this.removeChild(oldGraphics))
        }
    }

    getFromBlockId = (): number => {
        return this.fromBlockId;
    }

    getToBlockId = (): number => {
        return this.toBlockId;
    }
}