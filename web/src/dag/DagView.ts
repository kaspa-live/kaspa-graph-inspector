import * as PIXI from 'pixi.js'
import {newBlockSprite} from "./BlockView";
import {Block} from "./model/Block";

export default class DagView {
    private readonly application: PIXI.Application;

    constructor(canvas: HTMLCanvasElement) {
        this.application = new PIXI.Application({
            transparent: false,
            backgroundColor: 0xffffff,
            view: canvas,
            resizeTo: canvas,
        });
        this.application.start();

        fetch("http://localhost:3001/blocks?startHeight=0&endHeight=100")
            .then(response => response.json())
            .then((blocks: Block[]) => {
                for (let block of blocks) {
                    const blockSprite = newBlockSprite(this.application);
                    blockSprite.x = (blockSprite.width + 50) * block.height;
                    this.application.stage.addChild(blockSprite);
                }
            });
    }

    stop() {
        if (this.application) {
            this.application.stop();
        }
    }
}
