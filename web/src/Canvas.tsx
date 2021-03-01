import {useEffect, useRef} from 'react'
import DagVisualization from "./DagVisualization";
import './Canvas.css'

const Canvas = (props: any) => {
    const canvasRef = useRef() as React.MutableRefObject<HTMLCanvasElement>;

    useEffect(() => {
        const canvas = canvasRef.current
        const dagVisualization = new DagVisualization(canvas)
        return () => {
            dagVisualization.stop()
        };
    }, [])

    return <canvas ref={canvasRef} className="canvas" {...props}/>
}

export default Canvas