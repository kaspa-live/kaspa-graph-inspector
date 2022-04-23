import FastForwardIcon from "@mui/icons-material/FastForward";
import {IconButton, Tooltip} from "@mui/material";
import './TrackButton.css';

const TrackButton = ({onClick}: { onClick: () => void }) => {
    return (
        <Tooltip title="Track DAG tips" placement="top" arrow>
            <div className="track-button-background">
                <IconButton color="primary" onClick={onClick} size="large">
                    <FastForwardIcon/>
                </IconButton>
            </div>
        </Tooltip>
    );
}

export default TrackButton;
