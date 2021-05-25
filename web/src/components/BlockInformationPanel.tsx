import {Block} from "../dag/model/Block";
import './BlockInformationPanel.css'
import {Divider, IconButton, List, ListItem, Paper, Typography} from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';
import BlockInformationPanelHash from "./BlockInformationPanelHash";

const BlockInformationPanel = ({block, onClose}: { block: Block | null, onClose: () => void }) => {
    if (!block) {
        return <div/>;
    }

    const katnipAddress = `${window.location.protocol}//${process.env.REACT_APP_KATNIP_ADDRESS}/#/block/${block.blockHash}`;

    let blockColorText = "Undecided";
    let blockColorClass = "block-color-undecided";
    if (block.color === "blue") {
        blockColorText = "Blue";
        blockColorClass = "block-color-blue";
    } else if (block.color === "red") {
        blockColorText = "Red";
        blockColorClass = "block-color-red";
    }

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
                <List>
                    <ListItem className="block-information-item" disableGutters>
                        <Typography className="block-information-label" variant="h6">
                            Block Hash
                        </Typography>
                        <BlockInformationPanelHash hash={block.blockHash}/>
                    </ListItem>
                    <Divider className="block-information-divider"/>
                    <ListItem className="block-information-item" disableGutters>
                        <Typography className="block-information-label" variant="h6">
                            Color
                        </Typography>
                        <Typography className={`block-color ${blockColorClass}`} variant="h6">
                            {blockColorText}
                        </Typography>
                    </ListItem>
                    <Divider className="block-information-divider"/>
                </List>
            </div>
            <div className="katnip-link-text">
                See more details on <a href={katnipAddress} target="_blank">Katnip Block Explorer</a>
            </div>
        </div>
    </Paper>
}

export default BlockInformationPanel;
