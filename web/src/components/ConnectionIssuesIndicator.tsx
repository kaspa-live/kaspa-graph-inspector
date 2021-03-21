import {Box, CircularProgress, Typography} from "@material-ui/core";

const ConnectionIssuesIndicator = () => {
    return (
        <Box position="relative" display="inline-flex">
            <CircularProgress color="inherit" thickness={6.0} size="24px"/>
            <Box top={3} left={0} bottom={0} right={0} position="absolute" display="flex"
                 alignItems="center" justifyContent="center" fontWeight="fontWeightBold">
                <Typography variant="button" component="div" color="inherit">!</Typography>
            </Box>
        </Box>
    );
}

export default ConnectionIssuesIndicator;
