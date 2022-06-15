import React, {useEffect, useRef} from 'react'
import Dag from "../dag/Dag";
import { styled } from '@mui/material/styles';

const StyledCanevas = styled('canvas')({
    padding: 0,
    margin: 0,

    position: 'relative',
    width: '100%',
    height: '100%',
})


const Canvas = ({dag}: { dag: Dag }) => {
    const canvasRef = useRef() as React.MutableRefObject<HTMLCanvasElement>;

    useEffect(() => {
        const canvas = canvasRef.current;
        dag.initialize(canvas);

        return () => {
            dag.stop();
        };
    }, [dag]);

    return <StyledCanevas ref={canvasRef} />;
}

export default Canvas