import FastForwardIcon from "@mui/icons-material/FastForward";
import PauseIcon from '@mui/icons-material/Pause';
import {Box, IconButton, Theme, Tooltip, useTheme} from "@mui/material";
import React from "react";
import AnimatedCircle from "../base/AnimatedCircle";

interface TrackButtonProps {
    isTracking: boolean;
    onClick: () => void;
}

const TrackButton = React.forwardRef<typeof Box, TrackButtonProps>(
    (
        { isTracking, onClick }: TrackButtonProps,
        ref: React.ForwardedRef<typeof Box>,
    ): JSX.Element => {
        const theme = useTheme();
        return (
            <Box ref={ref}>
                <AnimatedCircle>
                    <Tooltip
                        title={ isTracking ? "Pause on current DAA score" : "Track DAG tips" }
                        placement="left"
                        arrow
                        enterDelay={theme.transitions.duration.enteringScreen*1.5}
                    >
                        <Box
                            sx={{
                                backgroundColor: (theme: Theme) => {
                                    return isTracking
                                        ? theme.palette.background.paper
                                        : theme.palette.primary.main
                                },
                                borderRadius: "50%",
                            }}
                        >
                            <IconButton
                                color="primary"
                                onClick={onClick}
                                size="large"
                                centerRipple
                                sx={{
                                    color: (theme: Theme) => { 
                                        return !isTracking
                                            ? theme.palette.background.paper
                                            : theme.palette.primary.main
                                    },
                                }}>
                                { isTracking ? <PauseIcon/> : <FastForwardIcon/> }
                            </IconButton>
                        </Box>
                    </Tooltip>
                </AnimatedCircle>
            </Box>
        );
    },
);

export default TrackButton;
