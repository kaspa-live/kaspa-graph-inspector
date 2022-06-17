import Box, { BoxProps } from "@mui/material/Box";
import React from "react";

const AppContainer = React.forwardRef((props: BoxProps, ref) => {
    return (
        <Box {...props} ref={ref}>
            {props.children}
        </Box>
    );
}
)

export default AppContainer;