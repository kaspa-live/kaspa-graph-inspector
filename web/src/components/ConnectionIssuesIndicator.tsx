import {Box, CircularProgress, IconButton, Tooltip, Typography} from "@material-ui/core";

const ConnectionIssuesIndicator = () => {
    return (
        <Tooltip title="Connection is unstable">
            <IconButton color="inherit">
                <Box position="relative" display="inline-flex">
                    <CircularProgress color="inherit" thickness={6.0} size="24px"/>
                    <Box top={3} left={0} bottom={0} right={0} position="absolute" display="flex"
                         alignItems="center" justifyContent="center" fontWeight="fontWeightBold">
                        <Typography variant="button" component="div" color="inherit">!</Typography>
                    </Box>
                </Box>
            </IconButton>
        </Tooltip>
    );
}

export default ConnectionIssuesIndicator;
