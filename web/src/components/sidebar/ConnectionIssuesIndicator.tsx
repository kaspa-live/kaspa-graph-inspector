import {Box, CircularProgress, IconButton, Tooltip, useTheme} from "@mui/material";
import React from "react";
import AnimatedItem from "../base/AnimatedItem";
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';

interface ConnectionIssuesIndicatorProps { 
}

const ConnectionIssuesIndicator = React.forwardRef<typeof Box, ConnectionIssuesIndicatorProps>(
    (
        props: ConnectionIssuesIndicatorProps,
        ref: React.ForwardedRef<typeof Box>,
    ): JSX.Element => {
        const theme = useTheme();
        return (
            <Box ref={ref}>
                <AnimatedItem borderRadius={"50%"} magnify={1.05} backgroundColor={theme.palette.primary.main}>
                    <Tooltip title="Connection is unstable" placement="left" arrow enterDelay={theme.transitions.duration.enteringScreen*1.5}>
                        <Box sx={{
                                backgroundColor: 'warning.light',
                                borderRadius: '50%',
                                borderStyle: 'solid',
                                borderColor: '#ffffff',
                                borderWidth: '5px',
                        }}>
                            <IconButton color="error" size="large">
                                <Box position="relative" display="inline-flex">
                                    <CircularProgress color="error" thickness={6.0} size="36px"/>
                                    <Box top={3} left={0} bottom={0} right={0} position="absolute" display="flex"
                                        alignItems="center" justifyContent="center">
                                        <PriorityHighRoundedIcon />
                                    </Box>
                                </Box>
                            </IconButton>
                        </Box>
                    </Tooltip>
                </AnimatedItem>
            </Box>
        );
    },
);

export default ConnectionIssuesIndicator;
