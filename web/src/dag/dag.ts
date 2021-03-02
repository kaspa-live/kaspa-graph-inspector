import * as PIXI from 'pixi.js'
import {newBlock} from "./block";

export default class Dag {
    private readonly application: PIXI.Application;
    private readonly roundedRectangle: PIXI.Sprite;

    constructor(canvas: HTMLCanvasElement) {
        this.application = new PIXI.Application({
            transparent: false,
            backgroundColor: 0xffffff,
            view: canvas,
            resizeTo: canvas,
        });


        this.roundedRectangle = newBlock(this.application);
        this.application.stage.addChild(this.roundedRectangle);

        this.update = this.update.bind(this);
        this.application.ticker.add(this.update);
        this.application.start();
    }

    private update(deltaTime: number) {
        this.roundedRectangle.x += 0.1 * deltaTime;
        this.roundedRectangle.y += 0.1 * deltaTime;
    }

    stop() {
        if (this.application) {
            this.application.stop();
        }
    }
}
