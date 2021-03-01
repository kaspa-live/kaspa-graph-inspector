export default class DagVisualization {
    private pixi;
    private pixiApplication: PIXI.Application;

    private circle: PIXI.Graphics;

    constructor(canvas: HTMLCanvasElement) {
        import("pixi.js").then(pixi => {
            this.pixi = pixi
            this.pixiApplication = new pixi.Application({
                transparent: false,
                backgroundColor: 0xffffff,
                view: canvas,
                resizeTo: canvas,
            });
            this.initialize();
            this.update = this.update.bind(this);
            this.pixiApplication.ticker.add(this.update);
            this.pixiApplication.start();
        });
    }

    private initialize() {
        this.circle = new this.pixi.Graphics();
        this.circle.beginFill(0xff0000);
        this.circle.drawCircle(30, 30, 30);
        this.circle.endFill();
        this.pixiApplication.stage.addChild(this.circle);
    }

    private update(deltaTime: number) {
        this.circle.x += 0.1 * deltaTime;
        this.circle.y += 0.1 * deltaTime;
    }

    stop() {
        if (this.pixiApplication) {
            this.pixiApplication.stop();
        }
    }
}
