import * as PIXI from 'pixi.js'
import {Block} from "./model/Block";
import BlockSprite from "./BlockSprite";

export default class TimelineContainer extends PIXI.Container {
    private readonly maxBlocksPerHeightGroup = 20;
    private readonly marginMultiplier = 2.0;

    private readonly application: PIXI.Application;
    private readonly blockIdsToBlockSprites: { [id: number]: BlockSprite } = {};
    private readonly heightGroups: { [height: number]: number[] } = {};

    constructor(application: PIXI.Application) {
        super();

        this.application = application;

        fetch("http://localhost:3001/blocks?startHeight=0&endHeight=100")
            .then(response => response.json())
            .then(this.insertOrIgnoreBlocks);
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

                // Add the block sprite to the timeline container
                this.addChild(blockSprite);

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
        const blockSize = rendererHeight / this.maxBlocksPerHeightGroup;
        const margin = blockSize * this.marginMultiplier;

        Object.values(this.heightGroups).forEach(blockIds => {
            for (let blockId of blockIds) {
                const blockSprite = this.blockIdsToBlockSprites[blockId];
                blockSprite.resize(blockSize);

                const block = blockSprite.getBlock();
                blockSprite.x = block.height * (blockSize + margin);
            }
        });
    }

    recalculatePositions = () => {
        const rendererHeight = this.application.renderer.height;
        this.y = rendererHeight / 2;

        const rendererWidth = this.application.renderer.width;
        this.x = rendererWidth / 2;

        this.recalculateBlockSpritePositions();
    }
}
