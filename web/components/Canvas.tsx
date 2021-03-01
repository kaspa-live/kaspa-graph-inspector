import {useEffect, useRef} from 'react'
import style from '../styles/Canvas.module.css'

const Canvas = props => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const renderer = new Renderer(canvas, context);
        renderer.render();
    }, [])

    return <canvas ref={canvasRef} className={style.canvas} {...props}/>
}

class Renderer {
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.context = context;
        this.render = this.render.bind(this);
    }

    render() {
        this.resizeIfRequired(this.canvas);

        this.context.fillStyle = '#ffffff';
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        this.context.fillStyle = '#ff0000';
        this.context.fillRect(200, 100, 100, 100);

        requestAnimationFrame(this.render);
    }

    resizeIfRequired(canvas: HTMLCanvasElement) {
        const {width, height} = canvas.getBoundingClientRect()
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width
            canvas.height = height
        }
    }
}

export default Canvas