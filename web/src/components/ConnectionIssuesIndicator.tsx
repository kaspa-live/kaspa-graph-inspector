import {Box, CircularProgress, IconButton, Tooltip, Typography} from "@material-ui/core";
import './ConnectionIssuesIndicator.css';

const ConnectionIssuesIndicator = () => {
    return (
        <Tooltip title="Connection is unstable" arrow>
            <div className="connection-issues-indicator-background">
                <IconButton color="secondary">
                    <Box position="relative" display="inline-flex">
                        <CircularProgress color="secondary" thickness={6.0} size="24px"/>
                        <Box top={3} left={0} bottom={0} right={0} position="absolute" display="flex"
                             alignItems="center" justifyContent="center" fontWeight="fontWeightBold">
                            <Typography variant="button" component="div" color="secondary">!</Typography>
                        </Box>
                    </Box>
                </IconButton>
            </div>
        </Tooltip>
    );
}

export default ConnectionIssuesIndicator;
