import FastForwardIcon from "@material-ui/icons/FastForward";
import {IconButton} from "@material-ui/core";

const TrackButton = ({onClick}: { onClick: () => void }) => {
    return (
        <IconButton color="inherit" onClick={onClick}>
            <FastForwardIcon/>
        </IconButton>
    );
}

export default TrackButton;
