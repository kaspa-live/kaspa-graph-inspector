import {Block} from "../dag/model/Block";
import './BlockInformationPanel.css'
import {IconButton, Paper, Typography} from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';

const BlockInformationPanel = ({block, onClose}: { block: Block | null, onClose: () => void }) => {
    if (!block) {
        return <div/>;
    }

    const katnipAddress = `${window.location.protocol}//${process.env.REACT_APP_KATNIP_ADDRESS}/#/block/${block.blockHash}`;

    return <Paper elevation={4}>
        <div className="block-information-panel">
            <div className="block-information-header">
                <Typography variant="h4">
                    Block Information
                </Typography>
                <IconButton className="close-button" color="primary" onClick={onClose}>
                    <CloseIcon/>
                </IconButton>
            </div>
            <div className="block-information-content">

            </div>
            <div className="katnip-link-text">
                See more details on <a href={katnipAddress} target="_blank">Katnip Block Explorer</a>
            </div>
        </div>
    </Paper>
}

export default BlockInformationPanel;
