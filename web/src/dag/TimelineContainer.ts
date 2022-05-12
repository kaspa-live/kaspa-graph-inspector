import * as PIXI from "pixi.js-legacy";
import {Block} from "../model/Block";
import BlockSprite from "./BlockSprite";
import EdgeSprite from "./EdgeSprite";
import {Ease, Tween} from "@createjs/tweenjs";
import HeightSprite from "./HeightSprite";
import {
    areBlocksAndEdgesAndHeightGroupsEqual,
    BlocksAndEdgesAndHeightGroups,
    getHeightGroupDAAScore,
    getDAAScoreGroupHeight,
    getBlockChildIds
} from "../model/BlocksAndEdgesAndHeightGroups";
import {Edge} from "../model/Edge";
import {HeightGroup} from "../model/HeightGroup";
import {BlockColorConst} from "../model/BlockColor";
import { theme } from "./Theme";

export default class TimelineContainer extends PIXI.Container {
    private readonly application: PIXI.Application;
    private readonly heightContainer: PIXI.Container;
    private readonly edgeContainer: PIXI.Container;
    private readonly blockContainer: PIXI.Container;

    private readonly heightKeysToHeightSprites: { [heightKey: string]: HeightSprite } = {};
    private readonly blockKeysToBlockSprites: { [blockKey: string]: BlockSprite } = {};
    private readonly edgeKeysToEdgeSprites: { [edgeKey: string]: EdgeSprite } = {};

    private currentBlocksAndEdgesAndHeightGroups: BlocksAndEdgesAndHeightGroups | null = null;

    private blockKeysToBlocks: { [key: string]: Block } = {};
    private edgeKeysToEdges: { [key: string]: Edge } = {};
    private heightKeysToHeightGroups: { [key: string]: HeightGroup } = {};
    private targetHeight: number = -1;
    private targetDAAScore: number = 0;

    private blockClickedListener: (block: Block) => void;
    private daaScoreClickedListener: (daaScore: number) => void;

    constructor(application: PIXI.Application) {
        super();

        this.application = application;

        this.blockClickedListener = () => {
            // Do nothing
        };
        this.daaScoreClickedListener = () => {
            // Do nothing
        };

        this.heightContainer = new PIXI.Container();
        this.addChild(this.heightContainer);

        this.edgeContainer = new PIXI.Container();
        this.addChild(this.edgeContainer);

        this.blockContainer = new PIXI.Container();
        this.addChild(this.blockContainer);
    }

    gettBlocksAndEdgesAndHeightGroups = (): BlocksAndEdgesAndHeightGroups | null => this.currentBlocksAndEdgesAndHeightGroups;

    setBlocksAndEdgesAndHeightGroups = (blocksAndEdgesAndHeightGroups: BlocksAndEdgesAndHeightGroups, targetBlock: Block | null = null) => {
        // Don't bother updating anything if there's nothing to update
        // noinspection JSSuspiciousNameCombination
        if (this.currentBlocksAndEdgesAndHeightGroups !== null
            && areBlocksAndEdgesAndHeightGroupsEqual(this.currentBlocksAndEdgesAndHeightGroups, blocksAndEdgesAndHeightGroups)) {
            return;
        }
        this.currentBlocksAndEdgesAndHeightGroups = blocksAndEdgesAndHeightGroups;

        // Calculate target height is necessary
        if (this.targetHeight < 0) {
            this.recalculateTargetHeight();
        }

        const blocks = blocksAndEdgesAndHeightGroups.blocks;
        const edges = blocksAndEdgesAndHeightGroups.edges;
        const heightGroups = blocksAndEdgesAndHeightGroups.heightGroups;
        const targetBlockKey = targetBlock ? this.buildBlockKey(targetBlock.id) : null;

        // Update the blocks-by-ids map with the new blocks
        this.blockKeysToBlocks = {};
        for (let block of blocks) {
            const key = this.buildBlockKey(block.id);
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
            const key = this.buildBlockKey(block.id);
            if (this.blockKeysToBlockSprites[key]) {
                const blockSprite = this.blockKeysToBlockSprites[key];
                this.assignBlockToBlockSprite(blockSprite, block, targetBlockKey);
            }
        }

        // Add new height sprites
        Object.keys(heightKeysInBlocks)
            .filter(heightKey => !this.heightKeysToHeightSprites[heightKey])
            .forEach(heightKey => {
                // Add the height to the heightSprite-by-heightKey map
                const heightGroup = this.heightKeysToHeightGroups[heightKey];
                const heightDAAScore = getHeightGroupDAAScore(this.currentBlocksAndEdgesAndHeightGroups!, heightGroup.height)
                const heightSprite = new HeightSprite(this.application, heightGroup.height, heightDAAScore);
                heightSprite.setDAAScoreClickedListener(this.daaScoreClickedListener);
                this.heightKeysToHeightSprites[heightKey] = heightSprite;

                // Add the height sprite to the height container
                this.heightContainer.addChild(heightSprite);
            });

        // Update height sprites DAAScore
        Object.keys(heightKeysInBlocks)
            .forEach(heightKey => {
              const heightGroup = this.heightKeysToHeightGroups[heightKey];
              if (this.heightKeysToHeightSprites[heightKey]) {
                const heightSprite = this.heightKeysToHeightSprites[heightKey];
                const heightDAAScore = getHeightGroupDAAScore(this.currentBlocksAndEdgesAndHeightGroups!, heightGroup.height)
                if (heightSprite.getDAAScore() !== heightDAAScore) {
                    heightSprite.setDAAScore(heightDAAScore)
                }
              }
            });

        // Add new block sprites
        for (let block of blocks) {
            const key = this.buildBlockKey(block.id);
            if (!this.blockKeysToBlockSprites[key]) {
                // Add the block to the blockSprite-by-ID map
                const blockSprite = new BlockSprite(this.application, block);
                this.assignBlockToBlockSprite(blockSprite, block, targetBlockKey);
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
                this.assignEdgeToEdgeSprite(edgeSprite, edge, targetBlockKey);
            }
        }

        // Add new edge sprites
        for (let edge of edges) {
            const edgeKey = this.buildEdgeKey(edge);
            if (!this.edgeKeysToEdgeSprites[edgeKey]) {
                // Add the edge to the edgeSprite-by-key map
                const edgeSprite = new EdgeSprite(this.application, edge.fromBlockId, edge.toBlockId);
                this.assignEdgeToEdgeSprite(edgeSprite, edge, targetBlockKey);
                this.edgeKeysToEdgeSprites[edgeKey] = edgeSprite;

                // Add the edge sprite to the edge container
                this.edgeContainer.addChild(edgeSprite);

                // Animate the edge sprite as its created
                edgeSprite.alpha = 0.0;
                Tween.get(edgeSprite).to({alpha: 1.0}, 500);
            }
        }

        this.recalculateSpritePositions(true);
    }

    private assignBlockToBlockSprite = (blockSprite: BlockSprite, block: Block, targetBlockKey: string | null) => {
        blockSprite.setColor(block.color);

        if (targetBlockKey === null) {
            blockSprite.setHighlighted(false, false, BlockColorConst.GRAY);
            return;
        }

        const blockKey = this.buildBlockKey(block.id);
        const targetBlock = this.blockKeysToBlocks[targetBlockKey];

        const [childIds, ] = getBlockChildIds(this.currentBlocksAndEdgesAndHeightGroups!, targetBlock);
        const childBlockKeys = childIds.map(blockId => this.buildBlockKey(blockId));
        if (childBlockKeys.indexOf(blockKey) >= 0) {
            blockSprite.setHighlighted(true, false, block.color);
            return;
        }

        const mergeSetRedBlockKeys = targetBlock.mergeSetRedIds.map(blockId => this.buildBlockKey(blockId));
        const mergeSetBlueBlockKeys = targetBlock.mergeSetBlueIds.map(blockId => this.buildBlockKey(blockId));

        const mergeSetBlockKeys = mergeSetRedBlockKeys.concat(mergeSetBlueBlockKeys);
        if (mergeSetBlockKeys.indexOf(blockKey) < 0 && blockKey !== targetBlockKey) {
            blockSprite.setHighlighted(false, false, BlockColorConst.GRAY);
            return;
        }

        var blockColor = BlockColorConst.GRAY;
        if (mergeSetRedBlockKeys.indexOf(blockKey) >= 0) {
            blockColor = BlockColorConst.RED;
        } else if (mergeSetBlueBlockKeys.indexOf(blockKey) >= 0) {
            blockColor = BlockColorConst.BLUE;
        } else {
            blockColor = block.color;
        }
        blockSprite.setHighlighted(true, blockKey === targetBlockKey, blockColor);
    }

    private assignEdgeToEdgeSprite = (edgeSprite: EdgeSprite, edge: Edge, targetBlockKey: string | null) => {
        const toBlock = this.blockKeysToBlocks[edge.toBlockId];
        const fromBlock = this.blockKeysToBlocks[edge.fromBlockId];
        let isInVirtualSelectedParentChain = false;
        let isHighlightedParent = false;
        let isHighlightedChild = false;
        let isSelectedParent = false;
        if (fromBlock) {
            isSelectedParent = (fromBlock.selectedParentId === edge.toBlockId);
            if (toBlock) {
                isInVirtualSelectedParentChain = fromBlock.isInVirtualSelectedParentChain
                    && toBlock.isInVirtualSelectedParentChain;
            }
        }
        isHighlightedParent = (this.buildBlockKey(edge.fromBlockId) === targetBlockKey);
        isHighlightedChild = (this.buildBlockKey(edge.toBlockId) === targetBlockKey);

        edgeSprite.setFullState(isInVirtualSelectedParentChain, isHighlightedParent, isHighlightedChild, isSelectedParent);
    }

    findBlockWithHash = (blockHash: string): Block | null => {
        let foundBlock = null;
        for (let block of Object.values(this.blockKeysToBlocks)) {
            if (block.blockHash === blockHash) {
                foundBlock = block;
                break;
            }
        }
        return foundBlock;
    }

    setTargetBlock = (targetBlock: Block | null) => {
        const targetBlockKey = targetBlock ? this.buildBlockKey(targetBlock.id) : null;
        for (let blockKey in this.blockKeysToBlocks) {
            const block = this.blockKeysToBlocks[blockKey];
            const blockSprite = this.blockKeysToBlockSprites[blockKey];
            this.assignBlockToBlockSprite(blockSprite, block, targetBlockKey);
        }
        for (let edgeKey in this.edgeKeysToEdges) {
            const edge = this.edgeKeysToEdges[edgeKey];
            const edgeSprite = this.edgeKeysToEdgeSprites[edgeKey];
            this.assignEdgeToEdgeSprite(edgeSprite, edge, targetBlockKey);
        }
    }

    private buildBlockKey = (blockId: number): string => {
        return `${blockId}`;
    }

    private buildEdgeKey = (edge: Edge): string => {
        return `${edge.fromBlockId}-${edge.toBlockId}`;
    }

    private buildHeightKey = (height: number): string => {
        return `${height};`
    }

    recalculateTargetHeight = () => {
        if  (this.currentBlocksAndEdgesAndHeightGroups !== null) {
            this.targetHeight = getDAAScoreGroupHeight(this.currentBlocksAndEdgesAndHeightGroups, this.targetDAAScore);
        }
    }

    private recalculateSpritePositions = (animate: boolean) => {
        this.recalculateEdgeSpritePositions(animate);
        this.recalculateBlockSpritePositions(animate);
        this.recalculateHeightSpritePositions();
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

    private recalculateBlockSpritePositions = (animate: boolean) => {
        const rendererHeight = this.application.renderer.height;
        const blockSize = this.calculateBlockSize(rendererHeight);
        const margin = this.calculateMargin(blockSize);

        Object.entries(this.blockKeysToBlocks)
            .forEach(([blockKey, block]) => {
                const blockSprite = this.blockKeysToBlockSprites[blockKey];
                const wasBlockSpriteSizeSet = blockSprite.wasBlockSizeSet();
                blockSprite.setSize(blockSize);

                const heightKey = this.buildHeightKey(block.height);
                const heightGroup = this.heightKeysToHeightGroups[heightKey];
                blockSprite.x = this.calculateBlockSpriteX(block.height, blockSize, margin);

                const targetY = this.calculateBlockSpriteY(block.heightGroupIndex, heightGroup.size, rendererHeight);
                if (blockSprite.y !== targetY) {
                    if (!wasBlockSpriteSizeSet || !animate) {
                        blockSprite.y = targetY;
                    } else {
                        Tween.get(blockSprite).to({y: targetY}, 500, Ease.quadOut);
                    }
                }
            });
    }

    private recalculateEdgeSpritePositions = (animate: boolean) => {
        const rendererHeight = this.application.renderer.height;
        const blockSize = this.calculateBlockSize(rendererHeight);
        const margin = this.calculateMargin(blockSize);

        Object.entries(this.edgeKeysToEdges)
            .forEach(([edgeKey, edge]) => {
                const edgeSprite = this.edgeKeysToEdgeSprites[edgeKey];

                const fromHeightKey = this.buildHeightKey(edge.fromHeight);
                const fromHeightGroup = this.heightKeysToHeightGroups[fromHeightKey];
                const fromY = this.calculateBlockSpriteY(edge.fromHeightGroupIndex, fromHeightGroup.size, rendererHeight);

                const toHeightKey = this.buildHeightKey(edge.toHeight);
                const toHeightGroup = this.heightKeysToHeightGroups[toHeightKey];
                const toY = this.calculateBlockSpriteY(edge.toHeightGroupIndex, toHeightGroup.size, rendererHeight);

                const fromX = this.calculateBlockSpriteX(edge.fromHeight, blockSize, margin);
                const toX = this.calculateBlockSpriteX(edge.toHeight, blockSize, margin);

                if (!animate) {
                    this.updateEdgeSprite(edgeSprite, blockSize, margin, fromX, toX, fromY, toY);
                    return;
                }

                let previousToY = 0;
                let previousFromY = 0;
                if (edgeSprite.wasVectorSet()) {
                    previousToY = edgeSprite.getToY();
                    previousFromY = edgeSprite.y;
                } else {
                    // Attempt to get the previous toY from the toBlock
                    const toBlockKey = this.buildBlockKey(edge.toBlockId);
                    const toBlockSprite = this.blockKeysToBlockSprites[toBlockKey];

                    // toY either not available or not interesting, so don't bother
                    // animating a transition
                    if (!toBlockSprite || !toBlockSprite.wasBlockSizeSet() || toBlockSprite.y === toY) {
                        this.updateEdgeSprite(edgeSprite, blockSize, margin, fromX, toX, fromY, toY);
                        return;
                    }

                    previousToY = toBlockSprite.y;
                    previousFromY = fromY;
                }

                // Exit early if the y coordinates are exactly the same
                if (toY === previousToY && fromY === previousFromY) {
                    return;
                }

                // Animate the edge
                const tween = {
                    fromY: previousFromY,
                    toY: previousToY,
                };
                const onChange = (event: any) => {
                    const fromY = event.target.target.fromY;
                    const toY = event.target.target.toY;
                    this.updateEdgeSprite(edgeSprite, blockSize, margin, fromX, toX, fromY, toY);
                };
                Tween.get(tween, {onChange: onChange}).to({fromY: fromY, toY: toY}, 500, Ease.quadOut);
            });
    }

    private updateEdgeSprite = (edgeSprite: EdgeSprite, blockSize: number, margin: number, fromX: number, toX: number, fromY: number, toY: number) => {
        const vectorX = toX - fromX;
        const vectorY = toY - fromY;
        const {
            blockBoundsVectorX,
            blockBoundsVectorY
        } = BlockSprite.clampVectorToBounds(blockSize, vectorX, vectorY);

        edgeSprite.setVector(vectorX, vectorY, blockSize, margin, blockBoundsVectorX, blockBoundsVectorY);
        edgeSprite.setToY(toY);

        edgeSprite.x = fromX;
        edgeSprite.y = fromY;
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

        // Flip the sign for even height groups. This make it so
        // that relations between blocks are preserved when blocks
        // are added to an existing (and already shown) height
        // group
        const signMultiplier = heightGroupSize % 2 === 0 ? 1 : -1;

        // These equations simply position indices in the following
        // manner: 0, -1, 1, -2, 2, -3, 3...
        const centeredIndex = Math.floor((offsetGroupSize - 1) / 2)
            + (Math.ceil(offsetGroupIndex / 2) * ((-1) ** (offsetGroupIndex + 1)));
        const normalizedPosition = centeredIndex / (offsetGroupSize - 1);
        return (normalizedPosition - 0.5) * rendererHeight * signMultiplier;
    }

    private calculateBlockSpriteX = (blockHeight: number, blockSize: number, margin: number): number => {
        return blockHeight * (blockSize + margin);
    }

    private calculateBlockSize = (rendererHeight: number): number => {
        return Math.floor(rendererHeight / theme.components.timeline.maxBlocksPerHeight);
    }

    private calculateMargin = (blockSize: number): number => {
        return blockSize * theme.components.timeline.multiplier.margin;
    }

    recalculatePositions = () => {
        this.moveTimelineContainer();
        this.recalculateSpritePositions(false);
    }

    private moveTimelineContainer = () => {
        const rendererWidth = this.application.renderer.width;
        const rendererHeight = this.application.renderer.height;
        const blockSize = this.calculateBlockSize(rendererHeight);
        const margin = this.calculateMargin(blockSize);

        const blockSpriteXForTargetHeight = this.calculateBlockSpriteX(this.targetHeight, blockSize, margin);

        this.y = rendererHeight / 2;

        // If target height is undefined, do nothing
        if (this.targetHeight >= 0) {
            // Animate the timeline if it moved for less than a
            // screen-length. Otherwise, just set it the x
            const targetX = rendererWidth / 2 - blockSpriteXForTargetHeight;
            if (Math.abs(this.x - targetX) < rendererWidth) {
                Tween.get(this).to({x: targetX}, 500, Ease.quadOut);
                return;
            }
            this.x = targetX;
        }
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
        return Math.ceil(maxBlockAmountOnScreen / 2) + theme.components.timeline.visibleHeightRangePadding;
    }

    getVisibleSlotAmountAfterHalfTheScreen = (rightMargin: number): number => {
        const rendererWidth = this.application.renderer.width;
        const rendererHeight = this.application.renderer.height;
        const blockSize = this.calculateBlockSize(rendererHeight);
        const margin = this.calculateMargin(blockSize);
        const heightWidth = blockSize + margin;

        const widthBetweenCenterAndRightMargin = Math.max(0, ((rendererWidth - heightWidth) / 2) - rightMargin + (margin / 2));
        return Math.floor(widthBetweenCenterAndRightMargin / heightWidth);
    }

    setTargetHeight = (targetHeight: number, newData?: BlocksAndEdgesAndHeightGroups) => {
        this.targetHeight = targetHeight;
        const data = !newData ? this.currentBlocksAndEdgesAndHeightGroups : newData;
        if (data !== null) {
            this.targetDAAScore = getHeightGroupDAAScore(data!, this.targetHeight)
        }
        this.moveTimelineContainer();
    }

    getTargetHeight = () => this.targetHeight;

    setTargetDAAScore = (targetDAAScore: number) => {
        this.targetDAAScore = targetDAAScore;
        this.recalculateTargetHeight();
        this.moveTimelineContainer();
    }

    getTargetDAAScore = () => this.targetDAAScore;

    setBlockClickedListener = (blockClickedListener: (block: Block) => void) => {
        this.blockClickedListener = blockClickedListener;
    }

    setDAAScoreClickedListener = (daaScoreClickedListener: (daaScore: number) => void) => {
        this.daaScoreClickedListener = daaScoreClickedListener;
    }
}
