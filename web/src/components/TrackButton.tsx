import FastForwardIcon from "@material-ui/icons/FastForward";
import {IconButton, Tooltip} from "@material-ui/core";

const TrackButton = ({onClick}: { onClick: () => void }) => {
    return (
        <Tooltip title="Track DAG tips">
            <IconButton color="inherit" onClick={onClick}>
                <FastForwardIcon/>
            </IconButton>
        </Tooltip>
    );
}

export default TrackButton;
