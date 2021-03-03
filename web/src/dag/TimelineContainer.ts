import * as PIXI from 'pixi.js'
import {Block} from "./model/Block";
import BlockSprite from "./BlockSprite";

export default class TimelineContainer extends PIXI.Container {
    private readonly application: PIXI.Application;
    private readonly blockIdsToBlockSprites: { [id: number]: BlockSprite } = {};

    constructor(application: PIXI.Application) {
        super();

        this.application = application;

        fetch("http://localhost:3001/blocks?startHeight=0&endHeight=100")
            .then(response => response.json())
            .then((blocks: Block[]) => {
                for (let block of blocks) {
                    if (!this.blockIdsToBlockSprites[block.id]) {
                        this.blockIdsToBlockSprites[block.id] = new BlockSprite(this.application, block);
                    }
                }
                this.redraw();
            });
    }

    private redraw() {
        this.removeChildren();
    }
}
