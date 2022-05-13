import { Box,  useTheme, Zoom } from '@mui/material';
import { ReactElement } from 'react'

const ZoomItem = ( {visible, children}: { visible: boolean, children: ReactElement } ) => {
    const theme = useTheme();
    const transitionDuration = {
        enter: theme.transitions.duration.enteringScreen,
        exit: theme.transitions.duration.leavingScreen*2,
    };

    return (
        <Box sx={{ minHeight: '48px' }}>
            <Zoom
                in={visible}
                timeout={transitionDuration}
                style={{
                    transitionDelay: `${visible ? 0 : theme.transitions.duration.leavingScreen}ms`,
                }}
                unmountOnExit
            >
                {children}
            </Zoom>
        </Box>
    );
}

export default ZoomItem;
