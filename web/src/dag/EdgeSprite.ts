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
    private blockBoundsVectorX: number = 0;
    private blockBoundsVectorY: number = 0;
    private isVectorInitialized: boolean = false;
    private toY: number = 0;
    private isInVirtualSelectedParentChain: boolean = false;
    private normalGraphics: PIXI.Graphics;
    private selectedGraphics: PIXI.Graphics;

    constructor(application: PIXI.Application, fromBlockId: number, toBlockId: number) {
        super();

        this.application = application;
        this.fromBlockId = fromBlockId;
        this.toBlockId = toBlockId;

        this.normalGraphics = new PIXI.Graphics();
        this.addChild(this.normalGraphics);

        this.selectedGraphics = new PIXI.Graphics();
        this.selectedGraphics.alpha = 0.0;
        this.addChild(this.selectedGraphics);
    }

    setVector = (vectorX: number, vectorY: number, blockBoundsVectorX: number, blockBoundsVectorY: number) => {
        if (this.vectorX !== vectorX
            || this.vectorY !== vectorY
            || this.blockBoundsVectorX !== blockBoundsVectorX
            || this.blockBoundsVectorY !== blockBoundsVectorY) {

            this.vectorX = vectorX;
            this.vectorY = vectorY;
            this.blockBoundsVectorX = blockBoundsVectorX;
            this.blockBoundsVectorY = blockBoundsVectorY;

            this.renderGraphics(this.normalGraphics, false);
            this.renderGraphics(this.selectedGraphics, true);
        }
        this.isVectorInitialized = true;
    }

    wasVectorSet = (): boolean => {
        return this.isVectorInitialized;
    }

    private renderGraphics = (graphics: PIXI.Graphics, isSelectedGraphics: boolean) => {
        const lineWidth = isSelectedGraphics ? this.selectedLineWidth : this.normalLineWidth;
        const color = isSelectedGraphics ? this.selectedColor : this.normalColor;
        const arrowRadius = isSelectedGraphics ? this.selectedArrowRadius : this.normalArrowRadius;

        // Compensate for line width in block bounds vectors
        let blockBoundsVectorX = this.blockBoundsVectorX;
        if (blockBoundsVectorX < 0) {
            blockBoundsVectorX += lineWidth;
        }
        if (blockBoundsVectorX > 0) {
            blockBoundsVectorX -= lineWidth;
        }
        let blockBoundsVectorY = this.blockBoundsVectorY;
        if (blockBoundsVectorY < 0) {
            // noinspection JSSuspiciousNameCombination
            blockBoundsVectorY += lineWidth;
        }
        if (blockBoundsVectorY > 0) {
            // noinspection JSSuspiciousNameCombination
            blockBoundsVectorY -= lineWidth;
        }

        // Draw the edge
        const fromX = blockBoundsVectorX;
        const fromY = blockBoundsVectorY;
        const toX = this.vectorX - blockBoundsVectorX;
        const toY = this.vectorY - blockBoundsVectorY;
        graphics.clear();
        graphics.lineStyle(lineWidth, color);
        graphics.moveTo(fromX, fromY);
        graphics.lineTo(toX, toY);

        // Draw the arrow head
        const angleRadians = Math.atan2(this.vectorY, this.vectorX) + (Math.PI / 2);
        const toVectorMagnitude = Math.sqrt(toX ** 2 + toY ** 2);
        const arrowOffsetX = -toX * (arrowRadius + lineWidth) / toVectorMagnitude;
        const arrowOffsetY = -toY * (arrowRadius + lineWidth) / toVectorMagnitude;
        const arrowX = toX + arrowOffsetX;
        const arrowY = toY + arrowOffsetY;
        graphics.beginFill(color);
        graphics.drawStar(arrowX, arrowY, 3, arrowRadius, undefined, angleRadians);
        graphics.endFill();
    }

    setToY = (toY: number) => {
        this.toY = toY;
    }

    getToY = (): number => {
        return this.toY;
    }

    setIsInVirtualSelectedParentChain = (isInVirtualSelectedParentChain: boolean) => {
        if (this.isInVirtualSelectedParentChain !== isInVirtualSelectedParentChain) {
            this.isInVirtualSelectedParentChain = isInVirtualSelectedParentChain;

            const targetNormalAlpha = isInVirtualSelectedParentChain ? 0.0 : 1.0;
            Tween.get(this.normalGraphics).to({alpha: targetNormalAlpha}, 500);

            const targetSelectedAlpha = isInVirtualSelectedParentChain ? 1.0 : 0.0;
            Tween.get(this.selectedGraphics).to({alpha: targetSelectedAlpha}, 500);
        }
    }

    getFromBlockId = (): number => {
        return this.fromBlockId;
    }

    getToBlockId = (): number => {
        return this.toBlockId;
    }
}