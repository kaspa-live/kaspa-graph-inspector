import React, {useEffect, useRef} from 'react'
import Dag from "./dag/Dag";
import './Canvas.css'

const Canvas = ({appState, setAppState}: any) => {
    const canvasRef = useRef() as React.MutableRefObject<HTMLCanvasElement>;

    useEffect(() => {
        const canvas = canvasRef.current;
        const dag = new Dag(canvas);

        dag.setIsTrackingChangedListener(isTracking => setAppState({...appState, isTracking}));

        return () => {
            dag.stop();
        };
    }, []);

    return <canvas ref={canvasRef} className="canvas"/>;
}

export default Canvas