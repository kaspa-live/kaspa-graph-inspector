import '@pixi/graphics-extras';
import * as PIXI from "pixi.js-legacy";
import { Tween } from "@createjs/tweenjs";
import { EdgeLayout, theme, Theme } from "./Theme";

class EdgeGraphicsDefinition {
    readonly color;
    readonly lineWidth;
    readonly arrowRadius;
    readonly isHighlight;
    readonly isChild;

    constructor(props: EdgeLayout, isHighlight: boolean, isChild: boolean) {
        this.color = props.color;
        this.lineWidth = props.lineWidth;
        this.arrowRadius = props.arrowRadius;
        this.isHighlight = isHighlight;
        this.isChild = isChild;
    }

    key = (): string => {
        return `${this.color}-${this.lineWidth}-${this.arrowRadius}-${this.isHighlight}-${this.isChild}`
    }
}

class ThemeEdgeGraphicsDefinitions {
    readonly normalDefinition: EdgeGraphicsDefinition;
    readonly inVirtualSelectedParentChainDefinition;
    readonly highlightedParentDefinition;
    readonly highlightedChildDefinition;
    readonly highlightedSelectedParentDefinition;
    readonly highlightedParentInVirtualSelectedParentChainDefinition;
    readonly highlightedChildInVirtualSelectedParentChainDefinition;

    readonly definitionMap: { [definitionKey: string]: EdgeGraphicsDefinition };

    constructor(theme: Theme) {
        this.normalDefinition = new EdgeGraphicsDefinition(theme.components.edge.normal, false, false);
        this.inVirtualSelectedParentChainDefinition = new EdgeGraphicsDefinition(theme.components.edge.virtualChain, false, false);
        this.highlightedParentDefinition = new EdgeGraphicsDefinition(theme.components.edge.highlighted.parent, true, false);
        this.highlightedChildDefinition = new EdgeGraphicsDefinition(theme.components.edge.highlighted.child, true, true);
        this.highlightedSelectedParentDefinition = new EdgeGraphicsDefinition(theme.components.edge.highlighted.selected, true, false);
        this.highlightedParentInVirtualSelectedParentChainDefinition = new EdgeGraphicsDefinition(theme.components.edge.highlighted.virtualChain.parent, true, false);
        this.highlightedChildInVirtualSelectedParentChainDefinition = new EdgeGraphicsDefinition(theme.components.edge.highlighted.virtualChain.child, true, true);

        this.definitionMap = this.initializeDefinitionMap();
    }

    private initializeDefinitionMap(): Record<string, EdgeGraphicsDefinition> {
        let definitionMap: { [definitionKey: string]: EdgeGraphicsDefinition } = {};
        definitionMap[this.normalDefinition.key()] = this.normalDefinition;
        definitionMap[this.inVirtualSelectedParentChainDefinition.key()] = this.inVirtualSelectedParentChainDefinition;
        definitionMap[this.highlightedParentDefinition.key()] = this.highlightedParentDefinition;
        definitionMap[this.highlightedChildDefinition.key()] = this.highlightedChildDefinition;
        definitionMap[this.highlightedSelectedParentDefinition.key()] = this.highlightedSelectedParentDefinition;
        definitionMap[this.highlightedParentInVirtualSelectedParentChainDefinition.key()] = this.highlightedParentInVirtualSelectedParentChainDefinition;
        definitionMap[this.highlightedChildInVirtualSelectedParentChainDefinition.key()] = this.highlightedChildInVirtualSelectedParentChainDefinition;
        return definitionMap;
    }
}

let themeDefs = new ThemeEdgeGraphicsDefinitions(theme);

export function updateTheme() {
    themeDefs = new ThemeEdgeGraphicsDefinitions(theme);
}

export default class EdgeSprite extends PIXI.Container {
    private readonly application: PIXI.Application;
    private readonly fromBlockId: number;
    private readonly toBlockId: number;

    private vectorX: number = 0;
    private vectorY: number = 0;
    private blockSize: number = 0;
    private margin: number = 0;
    private blockBoundsVectorX: number = 0;
    private blockBoundsVectorY: number = 0;
    private isVectorInitialized: boolean = false;
    private toY: number = 0;
    private isInVirtualSelectedParentChain: boolean = false;
    private isHighlightedParent: boolean = false;
    private isHighlightedChild: boolean = false;
    private isSelectedParent: boolean = false;

    private graphicsMap: { [definitionKey: string]: PIXI.Graphics } = {};
    private baseDefinition?: EdgeGraphicsDefinition;

    constructor(application: PIXI.Application, fromBlockId: number, toBlockId: number) {
        super();

        this.application = application;
        this.fromBlockId = fromBlockId;
        this.toBlockId = toBlockId;

        for (let definitionKey in themeDefs.definitionMap) {
            this.graphicsMap[definitionKey] = this.addNewGraphics();
        }
        this.graphicsMap[themeDefs.normalDefinition.key()].alpha = 1.0;
        this.baseDefinition = themeDefs.normalDefinition;
    }

    private addNewGraphics = (): PIXI.Graphics => {
        const graphics = new PIXI.Graphics();
        graphics.alpha = 0.0;
        this.addChild(graphics);
        return graphics;
    }

    setVector = (vectorX: number, vectorY: number, blockSize: number, margin: number, blockBoundsVectorX: number, blockBoundsVectorY: number) => {
        if (this.vectorX !== vectorX
            || this.vectorY !== vectorY
            || this.blockSize !== blockSize
            || this.margin !== margin
            || this.blockBoundsVectorX !== blockBoundsVectorX
            || this.blockBoundsVectorY !== blockBoundsVectorY) {

            this.vectorX = vectorX;
            this.vectorY = vectorY;
            this.blockSize = blockSize;
            this.margin = margin;
            this.blockBoundsVectorX = blockBoundsVectorX;
            this.blockBoundsVectorY = blockBoundsVectorY;

            for (let definitionKey in themeDefs.definitionMap) {
                const definition = themeDefs.definitionMap[definitionKey];
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
        let lineWidth = theme.scale(definition.lineWidth, this.blockSize);
        const color = definition.color;
        let arrowRadius = theme.scale(definition.arrowRadius, this.blockSize);
        const baseLineWidth = theme.scale(this.baseDefinition!.lineWidth, this.blockSize);
        const baseArrowRadius = theme.scale(this.baseDefinition!.arrowRadius, this.blockSize);

        // We want a noticeable increase in size for a highlighted edge
        if (definition.isHighlight) {
            lineWidth = Math.max(lineWidth, baseLineWidth + theme.components.edge.highlighted.minBorderIncrease);
            arrowRadius = Math.max(arrowRadius, baseArrowRadius + (theme.components.edge.highlighted.minBorderIncrease * 0.5));
        }

        // Compute the edge
        const fromX = 0;
        const fromY = 0;
        const toX = this.vectorX - this.blockBoundsVectorX;
        const toY = this.vectorY - this.blockBoundsVectorY;

        // Compute the arrow head
        const angleRadians = Math.atan2(this.vectorY, this.vectorX) + (Math.PI / 2);
        const toVectorMagnitude = Math.sqrt(toX ** 2 + toY ** 2);

        // To gat the actual arrow radius, we must consider the radius of the 
        // triangle, but also the line width that is drawn around it.
        // The triangle is equilateral, so the increase in radius is exactly
        // 1x the line width. This because the extra thickness of the triangle
        // is 0.5x the line width, for an incident angle of 30 degree (2 edges
        // respectively at 30 and -30 degree form a triangle tip), with the 
        // hypotenuse of 1x line width being the increase in radius.
        const totalArrowRadius = arrowRadius + lineWidth;

        const arrowOffsetX = -toX * totalArrowRadius / toVectorMagnitude;
        const arrowOffsetY = -toY * totalArrowRadius / toVectorMagnitude;
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

        // Draw a mark along the edge if it is highlighted
        if (definition.isHighlight) {
            const isChild = definition.isChild;
            const markRadius = theme.scale(theme.components.edge.highlighted.markRadius, this.blockSize);

            const markOffsetX = (this.blockSize + this.margin) / 2;
            const markOffsetY = this.vectorY / this.vectorX * markOffsetX;
            const markX = isChild ? this.vectorX + markOffsetX : -markOffsetX;
            const markY = isChild ? this.vectorY + markOffsetY : -markOffsetY;

            // Draw the mark
            graphics.beginFill(color);
            graphics.drawCircle(markX, markY, markRadius);
            graphics.endFill();
        }
    }

    setToY = (toY: number) => {
        this.toY = toY;
    }

    getToY = (): number => {
        return this.toY;
    }

    setFullState = (isInVirtualSelectedParentChain: boolean, isHighlightedParent: boolean, isHighlightedChild: boolean, isSelectedParent: boolean) => {
        if (this.isInVirtualSelectedParentChain !== isInVirtualSelectedParentChain
            || this.isHighlightedParent !== isHighlightedParent
            || this.isHighlightedChild !== isHighlightedChild
            || this.isSelectedParent !== isSelectedParent) {

            this.isInVirtualSelectedParentChain = isInVirtualSelectedParentChain;
            this.isHighlightedParent = isHighlightedParent;
            this.isHighlightedChild = isHighlightedChild;
            this.isSelectedParent = isSelectedParent;

            this.resolveShownGraphics();
        }
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
                definition = themeDefs.highlightedParentInVirtualSelectedParentChainDefinition;
            } else if (this.isHighlightedChild) {
                definition = themeDefs.highlightedChildInVirtualSelectedParentChainDefinition;
            } else {
                definition = themeDefs.inVirtualSelectedParentChainDefinition;
            }
        } else {
            if (this.isHighlightedParent) {
                if (this.isSelectedParent) {
                    definition = themeDefs.highlightedSelectedParentDefinition;
                } else {
                    definition = themeDefs.highlightedParentDefinition;
                }
            } else if (this.isHighlightedChild) {
                definition = themeDefs.highlightedChildDefinition;
            } else {
                definition = themeDefs.normalDefinition;
            }
        }

        // Update current base definitions
        if (!definition.isHighlight) {
            this.baseDefinition = definition;
        }

        this.changeShownGraphics(definition);
    }

    private changeShownGraphics = (targetDefinition: EdgeGraphicsDefinition) => {
        const targetKey = targetDefinition.key();
        const targetGraphics = this.graphicsMap[targetKey];
        Tween.get(targetGraphics).to({ alpha: 1.0 }, 500);

        for (let definitionKey in this.graphicsMap) {
            if (targetKey === definitionKey) {
                continue;
            }
            const graphics = this.graphicsMap[definitionKey];
            if (graphics.alpha !== 0.0) {
                Tween.get(graphics).to({ alpha: 0.0 }, 500);
            }
        }
    }

    getFromBlockId = (): number => {
        return this.fromBlockId;
    }

    getToBlockId = (): number => {
        return this.toBlockId;
    }
}
