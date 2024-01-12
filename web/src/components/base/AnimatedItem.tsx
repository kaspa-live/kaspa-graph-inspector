import { Paper } from "@mui/material";
import { ReactElement, useState } from 'react'
import { useSpring, animated } from '@react-spring/web'

const AnimatedPaper = animated(props => <Paper {...props}/>);

interface AnimatedItemProps {
    backgroundColor: string;
    borderRadius: string;
    magnify: number;
    children: ReactElement
}


const AnimatedItem = ( {backgroundColor, borderRadius, magnify, children}: AnimatedItemProps ) => {
    const [active, toggle] = useState(false)
    const { x } = useSpring({
        from: { x: 0 },
        x: active ? 1 : 0,
        config: { duration: 100 },
      })
    
    return (

        // TODO: We definitely need a touch-aware behaviour here
        // In the meantime, we reduce the visible effect
        
        <AnimatedPaper
            elevation={ x.to( x => Math.round(x * 1 + 2) ) }
            onMouseOver={() => toggle(true)}
            onMouseLeave={() => toggle(false)}
            style={{
                scale: x.to({range: [0, 1], output: [1, magnify] }),
                borderRadius: borderRadius,
                cursor: "pointer",
                backgroundColor: backgroundColor,
            }}
        >
            {children}
        </AnimatedPaper>
    );
}

export default AnimatedItem;
