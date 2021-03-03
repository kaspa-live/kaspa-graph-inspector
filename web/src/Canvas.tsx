import {useEffect, useRef} from 'react'
import Dag from "./dag/Dag";
import './Canvas.css'

const Canvas = (props: any) => {
    const canvasRef = useRef() as React.MutableRefObject<HTMLCanvasElement>;

    useEffect(() => {
        const canvas = canvasRef.current
        const dagVisualization = new Dag(canvas)
        return () => {
            dagVisualization.stop()
        };
    }, [])

    return <canvas ref={canvasRef} className="canvas" {...props}/>
}

export default Canvas