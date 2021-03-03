import * as PIXI from 'pixi.js'
import TimelineView from "./TimelineView";

export default class DagView {
    private readonly application: PIXI.Application;
    private readonly timelineView: TimelineView;

    constructor(canvas: HTMLCanvasElement) {
        this.application = new PIXI.Application({
            transparent: false,
            backgroundColor: 0xffffff,
            view: canvas,
            resizeTo: canvas,
        });

        this.timelineView = new TimelineView(this.application);
        this.application.stage.addChild(this.timelineView);

        this.application.start();
    }

    stop() {
        if (this.application) {
            this.application.stop();
        }
    }
}
