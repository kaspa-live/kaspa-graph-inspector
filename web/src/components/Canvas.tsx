import React, {useEffect, useRef} from 'react'
import Dag from "../dag/Dag";
import './Canvas.css'

const Canvas = ({dag}: { dag: Dag }) => {
    const canvasRef = useRef() as React.MutableRefObject<HTMLCanvasElement>;

    useEffect(() => {
        const canvas = canvasRef.current;
        dag.initialize(canvas);

        return () => {
            dag.stop();
        };
    }, []);

    return <canvas ref={canvasRef} className="canvas"/>;
}

export default Canvas