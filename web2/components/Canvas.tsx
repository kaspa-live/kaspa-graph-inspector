import {useEffect, useRef} from 'react'
import style from '../styles/Canvas.module.css'
import DagVisualization from "../scripts/DagVisualization";

const Canvas = props => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current
        const dagVisualization = new DagVisualization(canvas)
        return () => {
            dagVisualization.stop()
        };
    }, [])

    return <canvas ref={canvasRef} className={style.canvas} {...props}/>
}

export default Canvas