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
    private pixiApplication;

    constructor(canvas: HTMLCanvasElement) {
        import("pixi.js").then(pixi => {
            this.pixi = pixi
            this.pixiApplication = new pixi.Application({
                backgroundColor: 0xFFBA6F,
                view: canvas,
                resizeTo: canvas,
            });
            this.pixiApplication.start();
        });
    }

    stop() {
        if (this.pixiApplication) {
            this.pixiApplication.stop();
        }
    }
}

export default Canvas