import * as PIXI from "pixi.js";
import {Tween} from "@createjs/tweenjs";

export default class EdgeSprite extends PIXI.Container {
    private readonly normalColor = 0xaaaaaa;
    private readonly normalLineWidth = 2;
    private readonly normalArrowRadius = 4;
    private readonly selectedColor = 0xb4cfed;
    private readonly selectedLineWidth = 4;
    private readonly selectedArrowRadius = 6;

    private readonly application: PIXI.Application;
    private readonly fromBlockId: number;
    private readonly toBlockId: number;

    private vectorX: number = 0;
    private vectorY: number = 0;
    private clipVectorX: number = 0;
    private clipVectorY: number = 0;
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

    setVector = (vectorX: number, vectorY: number, clipVectorX: number, clipVectorY: number) => {
        if (this.vectorX !== vectorX || this.vectorY !== vectorY) {
            this.vectorX = vectorX;
            this.vectorY = vectorY;
            this.clipVectorX = clipVectorX;
            this.clipVectorY = clipVectorY;

            this.renderGraphics()
        }
    }

    private renderGraphics = () => {
        const lineWidth = this.isInVirtualSelectedParentChain ? this.selectedLineWidth : this.normalLineWidth;
        const color = this.isInVirtualSelectedParentChain ? this.selectedColor : this.normalColor;
        const arrowRadius = this.isInVirtualSelectedParentChain ? this.selectedArrowRadius : this.normalArrowRadius;

        // Compensate for line width in clip vectors
        let clipVectorX = this.clipVectorX;
        if (clipVectorX < 0) {
            clipVectorX += lineWidth;
        }
        if (clipVectorX > 0) {
            clipVectorX -= lineWidth;
        }
        let clipVectorY = this.clipVectorY;
        if (clipVectorY < 0) {
            // noinspection JSSuspiciousNameCombination
            clipVectorY += lineWidth;
        }
        if (clipVectorY > 0) {
            // noinspection JSSuspiciousNameCombination
            clipVectorY -= lineWidth;
        }

        // Draw the edge
        const fromX = clipVectorX;
        const fromY = clipVectorY;
        const toX = this.vectorX - clipVectorX;
        const toY = this.vectorY - clipVectorY;
        this.currentGraphics.clear();
        this.currentGraphics.lineStyle(lineWidth, color);
        this.currentGraphics.moveTo(fromX, fromY);
        this.currentGraphics.lineTo(toX, toY);

        // Draw the arrow head
        const angleRadians = Math.atan2(this.vectorY, this.vectorX) + (Math.PI / 2);
        const toVectorMagnitude = Math.sqrt(toX ** 2 + toY **2);
        const arrowOffsetX = -toX * (arrowRadius + lineWidth) / toVectorMagnitude;
        const arrowOffsetY = -toY * (arrowRadius + lineWidth) / toVectorMagnitude;
        const arrowX = toX + arrowOffsetX;
        const arrowY = toY + arrowOffsetY;
        this.currentGraphics.beginFill(color);
        this.currentGraphics.drawStar(arrowX, arrowY, 3, arrowRadius, undefined, angleRadians);
        this.currentGraphics.endFill();
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