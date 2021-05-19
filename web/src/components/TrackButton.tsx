import FastForwardIcon from "@material-ui/icons/FastForward";
import {IconButton, Tooltip} from "@material-ui/core";
import './TrackButton.css';

const TrackButton = ({onClick}: { onClick: () => void }) => {
    return (
        <Tooltip title="Track DAG tips" placement="top" arrow>
            <div className="track-button-background">
                <IconButton color="primary" onClick={onClick}>
                    <FastForwardIcon/>
                </IconButton>
            </div>
        </Tooltip>
    );
}

export default TrackButton;
