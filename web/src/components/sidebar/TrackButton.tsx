import FastForwardIcon from "@mui/icons-material/FastForward";
import {Box, IconButton, Theme, Tooltip, useTheme} from "@mui/material";
import React from "react";
import AnimatedCircle from "../base/AnimatedCircle";

interface TrackButtonProps { 
    onClick: () => void;
}

const TrackButton = React.forwardRef<typeof Box, TrackButtonProps>(
    (
        { onClick }: TrackButtonProps,
        ref: React.ForwardedRef<typeof Box>,
    ): JSX.Element => {
        const theme = useTheme();
        return (
            <Box ref={ref}>
                <AnimatedCircle>
                    <Tooltip title="Track DAG tips" placement="left" arrow enterDelay={theme.transitions.duration.enteringScreen*1.5}>
                        <Box
                            sx={{
                                backgroundColor: (theme: Theme) => theme.palette.background.paper,
                                borderRadius: "50%",
                            }}
                        >
                            <IconButton color="primary" onClick={onClick} size="large" centerRipple>
                                <FastForwardIcon/>
                            </IconButton>
                        </Box>
                    </Tooltip>
                </AnimatedCircle>
            </Box>
        );
    },
);

export default TrackButton;
