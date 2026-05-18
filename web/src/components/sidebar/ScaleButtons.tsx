import {Box, ButtonGroup, IconButton, useTheme} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import React from "react";
import AnimatedItem from "../base/AnimatedItem";

interface ScaleButtonsProps {
    scale: number;
    minScale: number;
    maxScale: number;
    onIncrease: () => void;
    onDecrease: () => void;
}

const ScaleButtons = React.forwardRef<typeof Box, ScaleButtonsProps>(
    (
        { scale, minScale, maxScale, onIncrease, onDecrease }: ScaleButtonsProps,
        ref: React.ForwardedRef<typeof Box>,
    ): JSX.Element => {
        const theme = useTheme();
        console.log(scale, minScale, maxScale);
        return (
            <Box
                ref={ref}
                sx={{ minHeight: '72px' }}
            >
                <AnimatedItem borderRadius={"4px"} magnify={1.05} backgroundColor={theme.palette.primary.main}>
                    <ButtonGroup
                        variant="text"
                        orientation="vertical"
                        size="small" 
                        sx={{
                            color: theme.palette.primary.main,
                            backgroundColor: theme.palette.background.paper,
                            width: '28px',
                        }}
                >
                        <IconButton
                            onClick={onIncrease}
                            disabled={scale >= maxScale}
                            size="small"
                            centerRipple
                            sx={{
                                color: theme.palette.primary.main,
                                backgroundColor: theme.palette.background.paper,
                                padding: '2px',
                            }}
                        >
                            <AddIcon/>
                        </IconButton>
                        <IconButton
                            color="primary"
                            onClick={onDecrease}
                            disabled={scale <= minScale}
                            size="small"
                            centerRipple
                            sx={{
                                color: theme.palette.primary.main,
                                backgroundColor: theme.palette.background.paper,
                                padding: '2px',
                            }}
                        >
                            <RemoveIcon/>
                        </IconButton>
                    </ButtonGroup>
                </AnimatedItem>
            </Box>
        );
    },
);

export default ScaleButtons;
