import * as PIXI from 'pixi.js'
import {Block} from "./model/Block";
import BlockSprite from "./BlockSprite";
import EdgeSprite from "./EdgeSprite";

export default class TimelineContainer extends PIXI.Container {
    private readonly fetchHeightDifference: number = 100;
    private readonly maxBlocksPerHeightGroup = 20;
    private readonly marginMultiplier = 2.0;

    private readonly application: PIXI.Application;
    private readonly edgeContainer: PIXI.Container;
    private readonly blockContainer: PIXI.Container;
    private readonly blockIdsToBlockSprites: { [id: number]: BlockSprite } = {};
    private readonly blockIdsToEdgeSprites: { [id: number]: EdgeSprite[] } = {};
    private readonly heightGroups: { [height: number]: number[] } = {};

    private targetHeight: number = 0;

    constructor(application: PIXI.Application) {
        super();

        this.application = application;

        this.edgeContainer = new PIXI.Container();
        this.addChild(this.edgeContainer);

        this.blockContainer = new PIXI.Container();
        this.addChild(this.blockContainer);
    }

    private insertOrIgnoreBlocks = (blocks: Block[]) => {
        let shouldRecalculateBlockSpritePositions = false;
        for (let block of blocks) {
            if (!this.blockIdsToBlockSprites[block.id]) {
                // Add the block to its "height group"--an ordered set of
                // blocks with the same height
                if (!this.heightGroups[block.height]) {
                    this.heightGroups[block.height] = [];
                }
                this.heightGroups[block.height].push(block.id);

                // Add the block to the block-by-ID map
                const blockSprite = new BlockSprite(this.application, block);
                this.blockIdsToBlockSprites[block.id] = blockSprite;

                // Add the block sprite to the block container
                this.blockContainer.addChild(blockSprite);

                // Create edges between the block and all its
                // parents and add them to the appropriate
                // collections
                this.blockIdsToEdgeSprites[block.id] = [];
                for (let parentId of block.parentIds) {
                    const edgeSprite = new EdgeSprite(this.application, block.id, parentId);
                    this.blockIdsToEdgeSprites[block.id].push(edgeSprite);

                    this.edgeContainer.addChild(edgeSprite);
                }

                // The timeline container changed so the block
                // sprite positions needs to be recalculated
                shouldRecalculateBlockSpritePositions = true;
            }
        }
        if (shouldRecalculateBlockSpritePositions) {
            this.recalculateBlockSpritePositions();
        }
    }

    private recalculateBlockSpritePositions = () => {
        const rendererHeight = this.application.renderer.height;
        const blockSize = this.calculateBlockSize(rendererHeight);
        const margin = this.calculateMargin(blockSize);

        Object.values(this.heightGroups).forEach(blockIds => {
            for (let i = 0; i < blockIds.length; i++) {
                const blockId = blockIds[i];
                const blockSprite = this.blockIdsToBlockSprites[blockId];
                blockSprite.resize(blockSize);

                const block = blockSprite.getBlock();
                blockSprite.x = block.height * (blockSize + margin);
                blockSprite.x = this.calculateBlockSpriteX(block.height, blockSize, margin);
                blockSprite.y = this.calculateBlockSpriteY(i, blockIds.length, rendererHeight);
            }
        });
    }

    private calculateBlockSpriteY = (heightGroupIndex: number, heightGroupSize: number, rendererHeight: number) => {
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

    private calculateBlockSpriteX = (blockHeight: number, blockSize: number, margin: number) => {
        return blockHeight * (blockSize + margin);
    }

    private calculateBlockSize = (rendererHeight: number) => {
        return rendererHeight / this.maxBlocksPerHeightGroup;
    }

    private calculateMargin = (blockSize: number) => {
        return blockSize * this.marginMultiplier;
    }

    recalculatePositions = () => {
        this.recalculateTimelineContainerPosition();
        this.recalculateBlockSpritePositions();
    }

    private recalculateTimelineContainerPosition = () => {
        const rendererWidth = this.application.renderer.width;
        const rendererHeight = this.application.renderer.height;
        const blockSize = this.calculateBlockSize(rendererHeight);
        const margin = this.calculateMargin(blockSize);

        const blockSpriteXForTargetHeight = this.calculateBlockSpriteX(this.targetHeight, blockSize, margin);

        this.x = rendererWidth / 2 - blockSpriteXForTargetHeight;
        this.y = rendererHeight / 2;
    }

    setTargetHeight = (targetHeight: number) => {
        this.targetHeight = targetHeight;

        let startHeight = targetHeight - this.fetchHeightDifference;
        if (startHeight < 0) {
            startHeight = 0;
        }
        const endHeight = targetHeight + this.fetchHeightDifference;

        fetch(`http://localhost:3001/blocks?startHeight=${startHeight}&endHeight=${endHeight}`)
            .then(response => response.json())
            .then(this.insertOrIgnoreBlocks);

        this.recalculateTimelineContainerPosition();
    }
}
