import * as PIXI from 'pixi.js'
import TimelineContainer from "./TimelineContainer";

export default class Dag {
    private readonly application: PIXI.Application;
    private readonly timelineContainer: TimelineContainer;

    constructor(canvas: HTMLCanvasElement) {
        this.application = new PIXI.Application({
            transparent: false,
            backgroundColor: 0xffffff,
            view: canvas,
            resizeTo: canvas,
        });

        this.timelineContainer = new TimelineContainer(this.application);
        this.application.stage.addChild(this.timelineContainer);

        this.application.start();
    }

    stop() {
        if (this.application) {
            this.application.stop();
        }
    }
}
