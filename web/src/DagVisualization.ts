import * as PIXI from 'pixi.js'

export default class DagVisualization {
    private readonly application: PIXI.Application;
    private readonly circle: PIXI.Graphics;

    constructor(canvas: HTMLCanvasElement) {
        this.application = new PIXI.Application({
            transparent: false,
            backgroundColor: 0xffffff,
            view: canvas,
            resizeTo: canvas,
        });

        this.circle = new PIXI.Graphics();
        this.circle.beginFill(0xff0000);
        this.circle.drawCircle(30, 30, 30);
        this.circle.endFill();
        this.application.stage.addChild(this.circle);

        this.update = this.update.bind(this);
        this.application.ticker.add(this.update);
        this.application.start();
    }

    private update(deltaTime: number) {
        this.circle.x += 0.1 * deltaTime;
        this.circle.y += 0.1 * deltaTime;
    }

    stop() {
        if (this.application) {
            this.application.stop();
        }
    }
}
