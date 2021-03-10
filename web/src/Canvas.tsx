import React, {useEffect, useRef} from 'react'
import Dag from "./dag/Dag";
import './Canvas.css'

const Canvas = ({setTrackingState, setDag}: { setTrackingState: any, setDag: any }) => {
    const canvasRef = useRef() as React.MutableRefObject<HTMLCanvasElement>;

    useEffect(() => {
        const canvas = canvasRef.current;
        const dag = new Dag(canvas);

        setDag(dag);
        dag.setIsTrackingChangedListener(isTracking => setTrackingState(isTracking));

        return () => {
            dag.stop();
        };
    }, []);

    return <canvas ref={canvasRef} className="canvas"/>;
}

export default Canvas