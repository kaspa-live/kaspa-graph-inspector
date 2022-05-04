import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {Box, IconButton, Theme, Tooltip, useTheme} from "@mui/material";
import React from "react";
import AnimatedCircle from "../base/AnimatedCircle";

interface SearchButtonProps { 
    onClick: () => void;
}

const SearchButton = React.forwardRef<typeof Box, SearchButtonProps>(
    (
        { onClick }: SearchButtonProps,
        ref: React.ForwardedRef<typeof Box>,
    ): JSX.Element => {
        const theme = useTheme();
        return (
            <Box ref={ref}>
                <AnimatedCircle>
                    <Tooltip title="Search the DAG" placement="left" arrow enterDelay={theme.transitions.duration.enteringScreen*1.5}>
                        <Box
                            sx={{
                                backgroundColor: (theme: Theme) => theme.palette.background.paper,
                                borderRadius: "50%",
                            }}
                        >
                            <IconButton color="primary" onClick={onClick} size="large" centerRipple>
                                <SearchRoundedIcon/>
                            </IconButton>
                        </Box>
                    </Tooltip>
                </AnimatedCircle>
            </Box>
        );
    },
);

export default SearchButton;
