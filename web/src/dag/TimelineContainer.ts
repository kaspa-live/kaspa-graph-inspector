import * as PIXI from 'pixi.js'
import {Block} from "./model/Block";
import BlockSprite from "./BlockSprite";
import EdgeSprite from "./EdgeSprite";
import {Ease, Tween} from "@createjs/tweenjs";
import HeightSprite from "./HeightSprite";
import {BlocksAndEdgesAndHeightGroups} from "./model/BlocksAndEdgesAndHeightGroups";
import {Edge} from "./model/Edge";
import {HeightGroup} from "./model/HeightGroup";

export default class TimelineContainer extends PIXI.Container {
    private readonly maxBlocksPerHeightGroup = 12;
    private readonly marginMultiplier = 2.0;
    private readonly visibleHeightRangePadding: number = 2;

    private readonly application: PIXI.Application;
    private readonly heightContainer: PIXI.Container;
    private readonly edgeContainer: PIXI.Container;
    private readonly blockContainer: PIXI.Container;

    private readonly heightKeysToHeightSprites: { [heightKey: string]: HeightSprite } = {};
    private readonly blockKeysToBlockSprites: { [blockKey: string]: BlockSprite } = {};
    private readonly edgeKeysToEdgeSprites: { [edgeKey: string]: EdgeSprite } = {};

    private blockKeysToBlocks: { [key: string]: Block } = {};
    private edgeKeysToEdges: { [key: string]: Edge } = {};
    private heightKeysToHeightGroups: { [key: string]: HeightGroup } = {};
    private targetHeight: number = 0;

    private blockClickedListener: (block: Block) => void;
    private heightClickedListener: (height: number) => void;

    constructor(application: PIXI.Application) {
        super();

        this.application = application;

        this.blockClickedListener = () => {
            // Do nothing
        };
        this.heightClickedListener = () => {
            // Do nothing
        };

        this.heightContainer = new PIXI.Container();
        this.addChild(this.heightContainer);

        this.edgeContainer = new PIXI.Container();
        this.addChild(this.edgeContainer);

        this.blockContainer = new PIXI.Container();
        this.addChild(this.blockContainer);
    }

    setBlocksAndEdgesAndHeightGroups = (blocksAndEdgesAndHeightGroups: BlocksAndEdgesAndHeightGroups) => {
        const blocks = blocksAndEdgesAndHeightGroups.blocks;
        const edges = blocksAndEdgesAndHeightGroups.edges;
        const heightGroups = blocksAndEdgesAndHeightGroups.heightGroups;

        // Update the blocks-by-ids map with the new blocks
        this.blockKeysToBlocks = {};
        for (let block of blocks) {
            const key = this.buildBlockKey(block);
            this.blockKeysToBlocks[key] = block;
        }

        // Update the edges-by-keys map with the new edges
        this.edgeKeysToEdges = {};
        for (let edge of edges) {
            const key = this.buildEdgeKey(edge);
            this.edgeKeysToEdges[key] = edge;
        }

        // Update the height-groups-by-keys map with the new height groups
        this.heightKeysToHeightGroups = {};
        for (let heightGroup of heightGroups) {
            const key = this.buildHeightKey(heightGroup.height);
            this.heightKeysToHeightGroups[key] = heightGroup;
        }

        // Remove no-longer relevant height sprites
        const heightKeysInBlocks: { [heightKey: string]: boolean } = {};
        for (let block of blocks) {
            const key = this.buildHeightKey(block.height);
            heightKeysInBlocks[key] = true;
        }
        Object.entries(this.heightKeysToHeightSprites)
            .filter(([heightKey, _]) => !heightKeysInBlocks[heightKey])
            .forEach(([heightKey, sprite]) => {
                delete this.heightKeysToHeightSprites[heightKey];
                this.heightContainer.removeChild(sprite);
            });

        // Remove no-longer relevant block sprites
        Object.entries(this.blockKeysToBlockSprites)
            .filter(([blockKey, _]) => !this.blockKeysToBlocks[blockKey])
            .forEach(([blockKey, sprite]) => {
                delete this.blockKeysToBlockSprites[blockKey];
                this.blockContainer.removeChild(sprite);
            });


        // Remove no-longer relevant edge sprites
        Object.entries(this.edgeKeysToEdgeSprites)
            .filter(([edgeKey, _]) => !this.edgeKeysToEdges[edgeKey])
            .forEach(([edgeKey, sprite]) => {
                delete this.edgeKeysToEdgeSprites[edgeKey];
                this.edgeContainer.removeChild(sprite);
            });

        // Update existing block sprites
        for (let block of blocks) {
            const key = this.buildBlockKey(block);
            if (this.blockKeysToBlockSprites[key]) {
                const blockSprite = this.blockKeysToBlockSprites[key];
                blockSprite.setColor(block.color);
            }
        }

        // Add new height sprites
        Object.keys(heightKeysInBlocks)
            .filter(heightKey => !this.heightKeysToHeightSprites[heightKey])
            .forEach(heightKey => {
                // Add the height to the heightSprite-by-heightKey map
                const heightGroup = this.heightKeysToHeightGroups[heightKey];
                const heightSprite = new HeightSprite(this.application, heightGroup.height);
                heightSprite.setHeightClickedListener(this.heightClickedListener);
                this.heightKeysToHeightSprites[heightKey] = heightSprite;

                // Add the height sprite to the height container
                this.heightContainer.addChild(heightSprite);
            });

        // Add new block sprites
        for (let block of blocks) {
            const key = this.buildBlockKey(block);
            if (!this.blockKeysToBlockSprites[key]) {
                // Add the block to the blockSprite-by-ID map
                const blockSprite = new BlockSprite(this.application, block);
                blockSprite.setColor(block.color);
                blockSprite.setBlockClickedListener(this.blockClickedListener);
                this.blockKeysToBlockSprites[key] = blockSprite;

                // Add the block sprite to the block container
                this.blockContainer.addChild(blockSprite);

                // Animate the block sprite as it's created
                blockSprite.alpha = 0.0;
                Tween.get(blockSprite).to({alpha: 1.0}, 500);
            }
        }

        // Update existing edge sprites
        for (let edge of edges) {
            const edgeKey = this.buildEdgeKey(edge);
            if (this.edgeKeysToEdgeSprites[edgeKey]) {
                const edgeSprite = this.edgeKeysToEdgeSprites[edgeKey];
                const toBlock = this.blockKeysToBlocks[edge.toBlockId];
                const fromBlock = this.blockKeysToBlocks[edge.fromBlockId];
                if (toBlock && fromBlock) {
                    const isInVirtualSelectedParentChain = fromBlock.isInVirtualSelectedParentChain
                        && toBlock.isInVirtualSelectedParentChain;
                    edgeSprite.setIsInVirtualSelectedParentChain(isInVirtualSelectedParentChain);
                }
            }
        }

        // Add new edge sprites
        for (let edge of edges) {
            const edgeKey = this.buildEdgeKey(edge);
            if (!this.edgeKeysToEdgeSprites[edgeKey]) {
                // Add the edge to the edgeSprite-by-key map
                const edgeSprite = new EdgeSprite(this.application, edge.fromBlockId, edge.toBlockId);
                const toBlock = this.blockKeysToBlocks[edge.toBlockId];
                const fromBlock = this.blockKeysToBlocks[edge.fromBlockId];
                if (toBlock && fromBlock) {
                    const isInVirtualSelectedParentChain = fromBlock.isInVirtualSelectedParentChain
                        && toBlock.isInVirtualSelectedParentChain;
                    edgeSprite.setIsInVirtualSelectedParentChain(isInVirtualSelectedParentChain);
                }
                this.edgeKeysToEdgeSprites[edgeKey] = edgeSprite;

                // Add the edge sprite to the edge container
                this.edgeContainer.addChild(edgeSprite);

                // Animate the edge sprite as its created
                edgeSprite.alpha = 0.0;
                Tween.get(edgeSprite).to({alpha: 1.0}, 500);
            }
        }

        this.recalculateSpritePositions();
    }

    private buildBlockKey = (block: Block): string => {
        return `${block.id}`;
    }

    private buildEdgeKey = (edge: Edge): string => {
        return `${edge.fromBlockId}-${edge.toBlockId}`;
    }

    private buildHeightKey = (height: number): string => {
        return `${height};`
    }

    private recalculateSpritePositions = () => {
        this.recalculateHeightSpritePositions();
        this.recalculateBlockSpritePositions();
        this.recalculateEdgeSpritePositions();
    }

    private recalculateHeightSpritePositions = () => {
        const rendererHeight = this.application.renderer.height;
        const blockSize = this.calculateBlockSize(rendererHeight);
        const margin = this.calculateMargin(blockSize);

        Object.values(this.heightKeysToHeightSprites)
            .forEach(sprite => {
                sprite.setSize(blockSize + margin, rendererHeight, blockSize);

                const height = sprite.getHeight();
                sprite.x = this.calculateBlockSpriteX(height, blockSize, margin);
                sprite.y = 0;
            });
    }

    private recalculateBlockSpritePositions = () => {
        const rendererHeight = this.application.renderer.height;
        const blockSize = this.calculateBlockSize(rendererHeight);
        const margin = this.calculateMargin(blockSize);

        Object.entries(this.blockKeysToBlocks)
            .forEach(([blockKey, block]) => {
                const blockSprite = this.blockKeysToBlockSprites[blockKey];
                blockSprite.setSize(blockSize);

                const heightKey = this.buildHeightKey(block.height);
                const heightGroup = this.heightKeysToHeightGroups[heightKey];
                blockSprite.x = this.calculateBlockSpriteX(block.height, blockSize, margin);
                blockSprite.y = this.calculateBlockSpriteY(block.heightGroupIndex, heightGroup.size, rendererHeight);
            });
    }

    private recalculateEdgeSpritePositions = () => {
        const rendererHeight = this.application.renderer.height;
        const blockSize = this.calculateBlockSize(rendererHeight);
        const margin = this.calculateMargin(blockSize);

        Object.entries(this.edgeKeysToEdges)
            .forEach(([edgeKey, edge]) => {
                const edgeSprite = this.edgeKeysToEdgeSprites[edgeKey];

                const toHeightKey = this.buildHeightKey(edge.toHeight);
                const toHeightGroup = this.heightKeysToHeightGroups[toHeightKey];
                const toX = this.calculateBlockSpriteX(edge.toHeight, blockSize, margin);
                const toY = this.calculateBlockSpriteY(edge.toHeightGroupIndex, toHeightGroup.size, rendererHeight);

                const fromHeightKey = this.buildHeightKey(edge.fromHeight);
                const fromHeightGroup = this.heightKeysToHeightGroups[fromHeightKey];
                const fromX = this.calculateBlockSpriteX(edge.fromHeight, blockSize, margin);
                const fromY = this.calculateBlockSpriteY(edge.fromHeightGroupIndex, fromHeightGroup.size, rendererHeight);

                const vectorX = toX - fromX;
                const vectorY = toY - fromY;
                const {
                    blockBoundsVectorX,
                    blockBoundsVectorY
                } = BlockSprite.clampVectorToBounds(blockSize, vectorX, vectorY);
                edgeSprite.setVector(vectorX, vectorY, blockBoundsVectorX, blockBoundsVectorY);

                edgeSprite.x = fromX;
                edgeSprite.y = fromY;
            });
    }

    private calculateBlockSpriteY = (heightGroupIndex: number, heightGroupSize: number, rendererHeight: number): number => {
        if (heightGroupSize === 1) {
            return 0;
        }
        if (heightGroupIndex === 0 && heightGroupSize % 2 === 1) {
            return 0;
        }

        // Offset the indices so that there's a natural margin between
        // both the blocks and the top/bottom of the renderer
        let offsetGroupIndex;
        if (heightGroupSize % 2 === 0) {
            offsetGroupIndex = heightGroupIndex % 2 === 0 ? (heightGroupIndex * 2) + 1 : heightGroupIndex * 2;
        } else {
            offsetGroupIndex = heightGroupIndex % 2 === 0 ? heightGroupIndex * 2 : (heightGroupIndex * 2) + 1;
        }
        const offsetGroupSize = (heightGroupSize * 2) + 1;

        // These equations simply position indices in the following
        // manner: 0, -1, 1, -2, 2, -3, 3...
        const centeredIndex = Math.floor((offsetGroupSize - 1) / 2)
            + (Math.ceil(offsetGroupIndex / 2) * ((-1) ** (offsetGroupIndex + 1)));
        const normalizedPosition = centeredIndex / (offsetGroupSize - 1);
        return (normalizedPosition - 0.5) * rendererHeight;
    }

    private calculateBlockSpriteX = (blockHeight: number, blockSize: number, margin: number): number => {
        return blockHeight * (blockSize + margin);
    }

    private calculateBlockSize = (rendererHeight: number): number => {
        return Math.floor(rendererHeight / this.maxBlocksPerHeightGroup);
    }

    private calculateMargin = (blockSize: number): number => {
        return blockSize * this.marginMultiplier;
    }

    recalculatePositions = () => {
        this.moveTimelineContainer();
        this.recalculateSpritePositions();
    }

    private moveTimelineContainer = () => {
        const rendererWidth = this.application.renderer.width;
        const rendererHeight = this.application.renderer.height;
        const blockSize = this.calculateBlockSize(rendererHeight);
        const margin = this.calculateMargin(blockSize);

        const blockSpriteXForTargetHeight = this.calculateBlockSpriteX(this.targetHeight, blockSize, margin);

        this.y = rendererHeight / 2;

        // Animate the timeline if it moved for less than a
        // screen-length. Otherwise, just set it the x
        const targetX = rendererWidth / 2 - blockSpriteXForTargetHeight;
        if (Math.abs(this.x - targetX) < rendererWidth) {
            Tween.get(this).to({x: targetX}, 500, Ease.quadOut);
            return;
        }
        this.x = targetX;
    }

    getVisibleHeightRange = (targetHeight: number): [fromHeight: number, toHeight: number] => {
        const maxBlockAmountOnHalfTheScreen = this.getMaxBlockAmountOnHalfTheScreen();

        let fromHeight = targetHeight - maxBlockAmountOnHalfTheScreen;
        if (fromHeight < 0) {
            fromHeight = 0;
        }
        const toHeight = targetHeight + maxBlockAmountOnHalfTheScreen;
        return [fromHeight, toHeight];
    }

    getMaxBlockAmountOnHalfTheScreen = (): number => {
        const rendererWidth = this.application.renderer.width;
        const rendererHeight = this.application.renderer.height;
        const blockSize = this.calculateBlockSize(rendererHeight);
        const margin = this.calculateMargin(blockSize);

        const maxBlockAmountOnScreen = rendererWidth / (blockSize + margin);
        return Math.ceil(maxBlockAmountOnScreen / 2) + this.visibleHeightRangePadding;
    }

    setTargetHeight = (targetHeight: number) => {
        this.targetHeight = targetHeight;
        this.moveTimelineContainer();
    }

    setBlockClickedListener = (blockClickedListener: (block: Block) => void) => {
        this.blockClickedListener = blockClickedListener;
    }

    setHeightClickedListener = (heightClickedListener: (height: number) => void) => {
        this.heightClickedListener = heightClickedListener;
    }
}
