import * as PIXI from 'pixi.js'
import {Block} from "./model/Block";
import BlockSprite from "./BlockSprite";
import EdgeSprite from "./EdgeSprite";
import {Ease, Tween} from "@createjs/tweenjs";
import HeightSprite from "./HeightSprite";

export default class TimelineContainer extends PIXI.Container {
    private readonly maxBlocksPerHeightGroup = 12;
    private readonly marginMultiplier = 2.0;
    private readonly visibleHeightRangePadding: number = 2;

    private readonly application: PIXI.Application;
    private readonly heightContainer: PIXI.Container;
    private readonly edgeContainer: PIXI.Container;
    private readonly blockContainer: PIXI.Container;

    private readonly heightGroups: { [height: number]: number[] } = {};
    private readonly heightsToHeightSprites: { [height: number]: HeightSprite } = {};
    private readonly blockIdsToBlockSprites: { [id: number]: BlockSprite } = {};
    private readonly blockIdsToEdgeSprites: { [id: number]: EdgeSprite[] } = {};

    private blockIdsToBlocks: { [id: number]: Block } = {};
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

    setBlocks = (blocks: Block[]) => {
        // Update the blocks-by-ids map with the new blocks
        this.blockIdsToBlocks = {};
        for (let block of blocks) {
            this.blockIdsToBlocks[block.id] = block;
        }

        // Remove no-longer relevant height groups
        const heightsInBlocks: { [height: number]: boolean } = {};
        for (let block of blocks) {
            heightsInBlocks[block.height] = true;
        }
        Object.keys(this.heightGroups)
            .filter(height => !heightsInBlocks[parseInt(height)])
            .forEach(height => delete this.heightGroups[parseInt(height)]);

        // Remove no-longer relevant height sprites
        Object.entries(this.heightsToHeightSprites)
            .filter(([height, _]) => !heightsInBlocks[parseInt(height)])
            .forEach(([height, sprite]) => {
                delete this.heightsToHeightSprites[parseInt(height)];
                this.heightContainer.removeChild(sprite);
            });

        // Remove no-longer relevant block sprites
        Object.entries(this.blockIdsToBlockSprites)
            .filter(([blockId, _]) => !this.blockIdsToBlocks[parseInt(blockId)])
            .forEach(([blockId, sprite]) => {
                delete this.blockIdsToBlockSprites[parseInt(blockId)];
                this.blockContainer.removeChild(sprite);
            });


        // Remove no-longer relevant edge sprites
        Object.entries(this.blockIdsToEdgeSprites)
            .filter(([blockId, _]) => !this.blockIdsToBlocks[parseInt(blockId)])
            .forEach(([blockId, sprites]) => {
                delete this.blockIdsToEdgeSprites[parseInt(blockId)];
                for (let sprite of sprites) {
                    this.edgeContainer.removeChild(sprite);
                }
            });

        // Update existing block sprites
        for (let block of blocks) {
            if (this.blockIdsToBlockSprites[block.id]) {
                const blockSprite = this.blockIdsToBlockSprites[block.id];
                blockSprite.setColor(block.color);
            }
        }

        // Add new blocks to their appropriate height groups
        for (let block of blocks) {
            if (!this.heightGroups[block.height]) {
                this.heightGroups[block.height] = [];
            }
            let exists = false;
            for (let blockId of this.heightGroups[block.height]) {
                if (blockId === block.id) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                this.heightGroups[block.height].push(block.id);
            }
        }

        // Add new height sprites
        Object.keys(heightsInBlocks)
            .filter(height => !this.heightsToHeightSprites[parseInt(height)])
            .forEach(height => {
                // Add the height to the heightSprite-by-height map
                const heightSprite = new HeightSprite(this.application, parseInt(height));
                heightSprite.setHeightClickedListener(this.heightClickedListener);
                this.heightsToHeightSprites[parseInt(height)] = heightSprite;

                // Add the height sprite to the height container
                this.heightContainer.addChild(heightSprite);
            });

        // Add new block sprites
        for (let block of blocks) {
            if (!this.blockIdsToBlockSprites[block.id]) {
                // Add the block to the blockSprite-by-ID map
                const blockSprite = new BlockSprite(this.application, block);
                blockSprite.setColor(block.color);
                blockSprite.setBlockClickedListener(this.blockClickedListener);
                this.blockIdsToBlockSprites[block.id] = blockSprite;

                // Add the block sprite to the block container
                this.blockContainer.addChild(blockSprite);

                // Animate the block sprite as it's created
                blockSprite.alpha = 0.0;
                Tween.get(blockSprite).to({alpha: 1.0}, 500);
            }
        }

        // Update existing edge sprites
        for (let block of blocks) {
            if (this.blockIdsToEdgeSprites[block.id]) {
                const edgeSprites = this.blockIdsToEdgeSprites[block.id];
                for (let edgeSprite of edgeSprites) {
                    if (edgeSprite.getToBlockId() === block.selectedParentId) {
                        edgeSprite.setIsInVirtualSelectedParentChain(block.isInVirtualSelectedParentChain);
                    }
                }
            }
        }

        // Add new edge sprites
        for (let block of blocks) {
            if (!this.blockIdsToEdgeSprites[block.id]) {
                // Create edges between the block and all its
                // parents and add them to the appropriate
                // collections
                this.blockIdsToEdgeSprites[block.id] = [];
                if (block.parentIds) {
                    for (let parentId of block.parentIds) {
                        const edgeSprite = new EdgeSprite(this.application, block.id, parentId);
                        if (parentId === block.selectedParentId) {
                            edgeSprite.setIsInVirtualSelectedParentChain(block.isInVirtualSelectedParentChain)
                        }
                        this.blockIdsToEdgeSprites[block.id].push(edgeSprite);

                        this.edgeContainer.addChild(edgeSprite);

                        // Animate the edge sprite as its created
                        edgeSprite.alpha = 0.0;
                        Tween.get(edgeSprite).to({alpha: 1.0}, 500);
                    }
                }
            }
        }

        this.recalculateSpritePositions();
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

        Object.entries(this.heightsToHeightSprites)
            .forEach(([height, sprite]) => {
                sprite.setSize(blockSize + margin, rendererHeight, blockSize);

                sprite.x = this.calculateBlockSpriteX(parseInt(height), blockSize, margin);
                sprite.y = 0;
            });
    }

    private recalculateBlockSpritePositions = () => {
        const rendererHeight = this.application.renderer.height;
        const blockSize = this.calculateBlockSize(rendererHeight);
        const margin = this.calculateMargin(blockSize);

        Object.values(this.heightGroups).forEach(blockIds => {
            for (let i = 0; i < blockIds.length; i++) {
                const blockId = blockIds[i];
                const blockSprite = this.blockIdsToBlockSprites[blockId];
                blockSprite.setSize(blockSize);

                const block = this.blockIdsToBlocks[blockId];
                blockSprite.x = this.calculateBlockSpriteX(block.height, blockSize, margin);
                blockSprite.y = this.calculateBlockSpriteY(i, blockIds.length, rendererHeight);
            }
        });
    }

    private recalculateEdgeSpritePositions = () => {
        const rendererWidth = this.application.renderer.width;
        const rendererHeight = this.application.renderer.height;

        Object.values(this.blockIdsToEdgeSprites).forEach(edgeSprites => {
            for (let i = 0; i < edgeSprites.length; i++) {
                const edgeSprite = edgeSprites[i];

                const fromBlockSprite = this.blockIdsToBlockSprites[edgeSprite.getFromBlockId()];
                const fromX = fromBlockSprite.x;
                const fromY = fromBlockSprite.y;

                let toX;
                let toY;
                if (!this.blockIdsToBlockSprites[edgeSprite.getToBlockId()]) {
                    // These blocks have not been loaded/fetched
                    // so we make up `to` values for them
                    toX = fromX - rendererWidth;
                    toY = this.calculateBlockSpriteY(i, edgeSprites.length, rendererHeight);
                } else {
                    const toBlockSprite = this.blockIdsToBlockSprites[edgeSprite.getToBlockId()];
                    toX = toBlockSprite.x;
                    toY = toBlockSprite.y;
                }

                const vectorX = toX - fromX;
                const vectorY = toY - fromY;
                edgeSprite.setVector(vectorX, vectorY);

                edgeSprite.x = fromX;
                edgeSprite.y = fromY;
            }
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
