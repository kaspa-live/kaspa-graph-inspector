import {useEffect, useRef} from 'react'
import style from '../styles/Canvas.module.css'

const Canvas = props => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current
        const renderer = new PixiRenderer(canvas)
        return () => {
            renderer.stop()
        };
    }, [])

    return <canvas ref={canvasRef} className={style.canvas} {...props}/>
}

class PixiRenderer {
    private pixi;
    private pixiApplication: PIXI.Application;

    private circle: PIXI.Graphics;

    constructor(canvas: HTMLCanvasElement) {
        import("pixi.js").then(pixi => {
            this.pixi = pixi
            this.pixiApplication = new pixi.Application({
                backgroundColor: 0xFFBA6F,
                view: canvas,
                resizeTo: canvas,
            });
            this.initialize();
            this.update = this.update.bind(this);
            this.pixiApplication.ticker.add(this.update);
            this.pixiApplication.start();
        });
    }

    initialize() {
        this.circle = new this.pixi.Graphics();
        this.circle.beginFill(0xff0000);
        this.circle.drawCircle(30, 30, 30);
        this.circle.endFill();
        this.pixiApplication.stage.addChild(this.circle);
    }

    update(deltaTime: number) {
        this.circle.x += 0.1 * deltaTime;
        this.circle.y += 0.1 * deltaTime;
    }

    stop() {
        if (this.pixiApplication) {
            this.pixiApplication.stop();
        }
    }
}

export default Canvas