import '@pixi/graphics-extras';
import * as PIXI from "pixi.js-legacy";
import {Tween} from "@createjs/tweenjs";
import { EdgeLayout, theme } from "./Theme";

class EdgeGraphicsDefinition {
    readonly color;
    readonly lineWidth;
    readonly arrowRadius;

    constructor(props: EdgeLayout) {
        this.color = props.color;
        this.lineWidth = props.lineWidth;
        this.arrowRadius = props.arrowRadius;
    }

    key = (): string => {
        return `${this.color}-${this.lineWidth}-${this.arrowRadius}`
    }
}

export default class EdgeSprite extends PIXI.Container {
    private static readonly normalDefinition = new EdgeGraphicsDefinition(theme.components.edge.normal);
    private static readonly inVirtualSelectedParentChainDefinition = new EdgeGraphicsDefinition(theme.components.edge.virtualChain);
    private static readonly highlightedParentDefinition = new EdgeGraphicsDefinition(theme.components.edge.highlighted.parent);
    private static readonly highlightedChildDefinition = new EdgeGraphicsDefinition(theme.components.edge.highlighted.child);
    private static readonly highlightedSelectedParentDefinition = new EdgeGraphicsDefinition(theme.components.edge.highlighted.selected);
    private static readonly highlightedParentInVirtualSelectedParentChainDefinition = new EdgeGraphicsDefinition(theme.components.edge.highlighted.virtualChain.parent);
    private static readonly highlightedChildInVirtualSelectedParentChainDefinition = new EdgeGraphicsDefinition(theme.components.edge.highlighted.virtualChain.child);

    private static readonly definitionMap: { [definitionKey: string]: EdgeGraphicsDefinition } = EdgeSprite.initializeDefinitionMap();

    private readonly application: PIXI.Application;
    private readonly fromBlockId: number;
    private readonly toBlockId: number;

    private vectorX: number = 0;
    private vectorY: number = 0;
    private blockSize: number = 0;
    private blockBoundsVectorX: number = 0;
    private blockBoundsVectorY: number = 0;
    private isVectorInitialized: boolean = false;
    private toY: number = 0;
    private isInVirtualSelectedParentChain: boolean = false;
    private isHighlightedParent: boolean = false;
    private isHighlightedChild: boolean = false;
    private isSelectedParent: boolean = false;

    private graphicsMap: { [definitionKey: string]: PIXI.Graphics } = {};

    constructor(application: PIXI.Application, fromBlockId: number, toBlockId: number) {
        super();

        this.application = application;
        this.fromBlockId = fromBlockId;
        this.toBlockId = toBlockId;

        for (let definitionKey in EdgeSprite.definitionMap) {
            this.graphicsMap[definitionKey] = this.addNewGraphics();
        }
        this.graphicsMap[EdgeSprite.normalDefinition.key()].alpha = 1.0;
    }

    private static initializeDefinitionMap(): Record<string, EdgeGraphicsDefinition> {
        let definitionMap: { [definitionKey: string]: EdgeGraphicsDefinition } = {};
        definitionMap[EdgeSprite.normalDefinition.key()] = EdgeSprite.normalDefinition;
        definitionMap[EdgeSprite.inVirtualSelectedParentChainDefinition.key()] = EdgeSprite.inVirtualSelectedParentChainDefinition;
        definitionMap[EdgeSprite.highlightedParentDefinition.key()] = EdgeSprite.highlightedParentDefinition;
        definitionMap[EdgeSprite.highlightedChildDefinition.key()] = EdgeSprite.highlightedChildDefinition;
        definitionMap[EdgeSprite.highlightedSelectedParentDefinition.key()] = EdgeSprite.highlightedSelectedParentDefinition;
        definitionMap[EdgeSprite.highlightedParentInVirtualSelectedParentChainDefinition.key()] = EdgeSprite.highlightedParentInVirtualSelectedParentChainDefinition;
        definitionMap[EdgeSprite.highlightedChildInVirtualSelectedParentChainDefinition.key()] = EdgeSprite.highlightedChildInVirtualSelectedParentChainDefinition;
        return definitionMap;
    }

    private addNewGraphics = (): PIXI.Graphics => {
        const graphics = new PIXI.Graphics();
        graphics.alpha = 0.0;
        this.addChild(graphics);
        return graphics;
    }

    setVector = (vectorX: number, vectorY: number, blockSize: number, blockBoundsVectorX: number, blockBoundsVectorY: number) => {
        if (this.vectorX !== vectorX
            || this.vectorY !== vectorY
            || this.blockSize !== blockSize
            || this.blockBoundsVectorX !== blockBoundsVectorX
            || this.blockBoundsVectorY !== blockBoundsVectorY) {

            this.vectorX = vectorX;
            this.vectorY = vectorY;
            this.blockSize = blockSize;
            this.blockBoundsVectorX = blockBoundsVectorX;
            this.blockBoundsVectorY = blockBoundsVectorY;

            for (let definitionKey in EdgeSprite.definitionMap) {
                const definition = EdgeSprite.definitionMap[definitionKey];
                const graphics = this.graphicsMap[definitionKey];
                this.renderGraphics(graphics, definition);
            }
        }
        this.isVectorInitialized = true;
    }

    wasVectorSet = (): boolean => {
        return this.isVectorInitialized;
    }

    private renderGraphics = (graphics: PIXI.Graphics, definition: EdgeGraphicsDefinition) => {
        const lineWidth = theme.scale(definition.lineWidth, this.blockSize);
        const color = definition.color;
        const arrowRadius = theme.scale(definition.arrowRadius, this.blockSize);

        // Compute the edge
        const fromX = this.blockBoundsVectorX;
        const fromY = this.blockBoundsVectorY;
        const toX = this.vectorX - this.blockBoundsVectorX;
        const toY = this.vectorY - this.blockBoundsVectorY;

        //Compute the arrow head
        const angleRadians = Math.atan2(this.vectorY, this.vectorX) + (Math.PI / 2);
        const toVectorMagnitude = Math.sqrt(toX ** 2 + toY ** 2);
        const arrowOffsetX = -toX * (arrowRadius + lineWidth) / toVectorMagnitude;
        const arrowOffsetY = -toY * (arrowRadius + lineWidth) / toVectorMagnitude;
        const arrowX = toX + arrowOffsetX;
        const arrowY = toY + arrowOffsetY;

        // Draw the edge
        graphics.clear();
        graphics.lineStyle(lineWidth, color);
        graphics.moveTo(fromX, fromY);
        graphics.lineTo(toX + arrowOffsetX, toY + arrowOffsetY);

        // Draw the arrow head
        graphics.beginFill(color);
        graphics.drawStar!(arrowX, arrowY, 3, arrowRadius, 0, angleRadians);
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
            this.resolveShownGraphics();
        }
    }

    setHighlightedParent = (isHighlightedParent: boolean) => {
        if (this.isHighlightedParent !== isHighlightedParent) {
            this.isHighlightedParent = isHighlightedParent;
            this.resolveShownGraphics();
        }
    }

    setHighlightedChild = (isHighlightedChild: boolean) => {
        if (this.isHighlightedChild !== isHighlightedChild) {
            this.isHighlightedChild = isHighlightedChild;
            this.resolveShownGraphics();
        }
    }

    setIsSelectedParent = (isSelectedParent: boolean) => {
        if (this.isSelectedParent !== isSelectedParent) {
            this.isSelectedParent = isSelectedParent;
            this.resolveShownGraphics();
        }
    }

    private resolveShownGraphics = () => {
        let definition;
        if (this.isInVirtualSelectedParentChain) {
            if (this.isHighlightedParent) {
                definition = EdgeSprite.highlightedParentInVirtualSelectedParentChainDefinition;
            } else if (this.isHighlightedChild) {
                definition = EdgeSprite.highlightedChildInVirtualSelectedParentChainDefinition;
            } else {
                definition = EdgeSprite.inVirtualSelectedParentChainDefinition;
            }
        } else {
            if (this.isHighlightedParent) {
                if (this.isSelectedParent) {
                    definition = EdgeSprite.highlightedSelectedParentDefinition;
                } else {
                    definition = EdgeSprite.highlightedParentDefinition;
                }
            } else if (this.isHighlightedChild) {
                definition = EdgeSprite.highlightedChildDefinition;
            } else {
                definition = EdgeSprite.normalDefinition;
            }
        }
        this.changeShownGraphics(definition);
    }

    private changeShownGraphics = (targetDefinition: EdgeGraphicsDefinition) => {
        const targetKey = targetDefinition.key();
        const targetGraphics = this.graphicsMap[targetKey];
        Tween.get(targetGraphics).to({alpha: 1.0}, 500);

        for (let definitionKey in this.graphicsMap) {
            if (targetKey === definitionKey) {
                continue;
            }
            const graphics = this.graphicsMap[definitionKey];
            Tween.get(graphics).to({alpha: 0.0}, 500);
        }
    }

    getFromBlockId = (): number => {
        return this.fromBlockId;
    }

    getToBlockId = (): number => {
        return this.toBlockId;
    }
}
