import {useEffect, useRef} from 'react'
import style from '../styles/Canvas.module.css'

const Canvas = props => {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, context.canvas.width, context.canvas.height)

        context.fillStyle = '#ff0000'
        context.fillRect(100, 100, 100, 100)
    }, [])

    return <canvas ref={canvasRef} className={style.canvas} {...props}/>
}

export default Canvas