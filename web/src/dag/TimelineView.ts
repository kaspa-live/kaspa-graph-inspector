import * as PIXI from 'pixi.js'
import {Block} from "./model/Block";
import {newBlockSprite} from "./BlockView";

export default class TimelineView extends PIXI.Container {
    private readonly application: PIXI.Application;
    private readonly blockIdsToBlockSprites: { [id: number]: PIXI.Sprite } = {};

    constructor(application: PIXI.Application) {
        super();

        this.application = application;

        fetch("http://localhost:3001/blocks?startHeight=0&endHeight=100")
            .then(response => response.json())
            .then((blocks: Block[]) => {
                for (let block of blocks) {
                    if (!this.blockIdsToBlockSprites[block.id]) {
                        this.blockIdsToBlockSprites[block.id] = newBlockSprite(this.application);
                    }
                }
                this.redraw();
            });
    }

    private redraw() {
        this.removeChildren()
    }
}
