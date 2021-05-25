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
                    <ListItem className="block-hash-container" disableGutters>
                        <Typography className="block-hash-label" variant="h6">
                            Block Hash
                        </Typography>
                        <BlockInformationPanelHash hash={block.blockHash}/>
                    </ListItem>
                    <Divider className="block-information-divider"/>
                    <ListItem className="block-hash-container" disableGutters>
                        <Typography className="block-hash-label" variant="h6">
                            Block Hash
                        </Typography>
                        <BlockInformationPanelHash hash={block.blockHash}/>
                    </ListItem>
                </List>
            </div>
            <div className="katnip-link-text">
                See more details on <a href={katnipAddress} target="_blank">Katnip Block Explorer</a>
            </div>
        </div>
    </Paper>
}

export default BlockInformationPanel;
