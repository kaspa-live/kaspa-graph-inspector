import * as PIXI from 'pixi.js'
import TimelineContainer from "./TimelineContainer";

export default class Dag {
    private readonly application: PIXI.Application;
    private readonly timelineContainer: TimelineContainer;

    private currentWidth: number = 0;
    private currentHeight: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.application = new PIXI.Application({
            transparent: false,
            backgroundColor: 0xffffff,
            view: canvas,
            resizeTo: canvas,
        });

        this.timelineContainer = new TimelineContainer(this.application);
        this.application.ticker.add(this.resizeIfRequired);
        this.application.stage.addChild(this.timelineContainer);
        this.initializeTargetHeightByQueryParams();


        this.application.start();
    }

    private resizeIfRequired = () => {
        if (this.currentWidth !== this.application.renderer.width
            || this.currentHeight !== this.application.renderer.height) {
            this.currentWidth = this.application.renderer.width;
            this.currentHeight = this.application.renderer.height;

            this.timelineContainer.recalculatePositions();
        }
    }

    private initializeTargetHeightByQueryParams = () => {
        const targetHeight = this.extractTargetHeightFromParams();
        if (targetHeight !== null) {
            this.setTargetHeight(targetHeight);
            return;
        }
        this.setTargetHeight(0);
    }

    private extractTargetHeightFromParams = (): number | null => {
        const urlParams = new URLSearchParams(window.location.search);
        const targetHeightString = urlParams.get("targetHeight");
        if (targetHeightString) {
            const targetHeight = parseInt(targetHeightString);
            if (targetHeight) {
                return targetHeight;
            }
        }
        return null;
    }

    private setTargetHeight(targetHeight: number) {
        this.timelineContainer.setTargetHeight(targetHeight);

        const [startHeight, endHeight] = this.timelineContainer.getVisibleHeightRange(targetHeight);
        fetch(`http://localhost:3001/blocks?startHeight=${startHeight}&endHeight=${endHeight}`)
            .then(response => response.json())
            .then(this.timelineContainer.insertOrIgnoreBlocks);
    }

    stop = () => {
        if (this.application) {
            this.application.stop();
        }
    }
}
