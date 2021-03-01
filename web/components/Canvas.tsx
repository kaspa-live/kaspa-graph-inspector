import {useEffect, useRef} from 'react'
import style from '../styles/Canvas.module.css'

const Canvas = props => {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        resizeIfRequired(canvas)

        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, context.canvas.width, context.canvas.height)

        context.fillStyle = '#ff0000'
        context.fillRect(200, 100, 100, 100)
    }, [])

    return <canvas ref={canvasRef} className={style.canvas} {...props}/>
}

const resizeIfRequired = (canvas: HTMLCanvasElement) => {
    const {width, height} = canvas.getBoundingClientRect()
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
    }
}

export default Canvas