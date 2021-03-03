import * as PIXI from 'pixi.js'
import {Block} from "./model/Block";
import BlockSprite from "./BlockSprite";

export default class TimelineContainer extends PIXI.Container {
    private readonly application: PIXI.Application;
    private readonly blockIdsToBlockSprites: { [id: number]: BlockSprite } = {};
    private readonly heightGroups: { [height: number]: number[] } = {};

    constructor(application: PIXI.Application) {
        super();

        this.application = application;

        this.insertOrIgnoreBlocks = this.insertOrIgnoreBlocks.bind(this);

        fetch("http://localhost:3001/blocks?startHeight=0&endHeight=100")
            .then(response => response.json())
            .then(this.insertOrIgnoreBlocks);
    }

    private insertOrIgnoreBlocks(blocks: Block[]) {
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

    private readonly maxBlocksPerHeightGroup = 20;
    private readonly marginMultiplier = 2.0;

    private recalculateBlockSpritePositions() {
        const rendererHeight = this.application.renderer.height;
        const blockHeight = rendererHeight / this.maxBlocksPerHeightGroup;
        const margin = blockHeight * this.marginMultiplier;

        Object.entries(this.heightGroups).forEach(([height, blockIds]) => {
            for (let blockId of blockIds) {
                const blockSprite = this.blockIdsToBlockSprites[blockId];
                const block = blockSprite.getBlock();
                blockSprite.x = block.height * (blockHeight + margin);
            }
        });
    }
}
