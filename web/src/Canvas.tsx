import {useEffect, useRef} from 'react'
import DagView from "./dag/DagView";
import './Canvas.css'

const Canvas = (props: any) => {
    const canvasRef = useRef() as React.MutableRefObject<HTMLCanvasElement>;

    useEffect(() => {
        const canvas = canvasRef.current
        const dagVisualization = new DagView(canvas)
        return () => {
            dagVisualization.stop()
        };
    }, [])

    return <canvas ref={canvasRef} className="canvas" {...props}/>
}

export default Canvas