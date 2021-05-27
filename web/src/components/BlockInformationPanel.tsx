import './BlockInformationPanel.css'
import {Divider, IconButton, List, Paper, Typography} from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';
import BlockInformationPanelHash from "./BlockInformationPanelHash";
import BlockInformationPanelListItem from "./BlockInformationPanelListItem";
import {katnipAddress} from "../addresses";
import {BlockInformation} from "../dag/model/BlockInformation";

const BlockInformationPanel = ({blockInformation, onClose}:
                                   { blockInformation: BlockInformation | null, onClose: () => void }) => {

    if (!blockInformation) {
        return <div/>;
    }

    const katnipAddressForBlock = `${katnipAddress}/#/block/${blockInformation.block.blockHash}`;

    let blockColorText = "Undecided";
    let blockColorClass = "block-color-undecided";
    if (blockInformation.block.color === "blue") {
        blockColorText = "Blue";
        blockColorClass = "block-color-blue";
    } else if (blockInformation.block.color === "red") {
        blockColorText = "Red";
        blockColorClass = "block-color-red";
    }

    const tooltip = <div>
        Blah blah blah <a href="https://google.com" target="_blank"> blah blah blah</a> blah blah blah blah
    </div>;

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
                    <BlockInformationPanelListItem label="Block Hash" tooltip={tooltip}>
                        <BlockInformationPanelHash hash={blockInformation.block.blockHash}/>
                    </BlockInformationPanelListItem>

                    <Divider className="block-information-divider"/>

                    <BlockInformationPanelListItem label="Block Color" tooltip={tooltip}>
                        <Typography className={`block-color ${blockColorClass}`} variant="h6">
                            {blockColorText}
                        </Typography>
                    </BlockInformationPanelListItem>

                    <Divider className="block-information-divider"/>

                    <BlockInformationPanelListItem label="Is Block In VSPC" tooltip={tooltip}>
                        <Typography className="is-block-in-virtual-selected-parent-chain" variant="h6">
                            {blockInformation.block.isInVirtualSelectedParentChain ? "Yes" : "No"}
                        </Typography>
                    </BlockInformationPanelListItem>

                    {!blockInformation.isInformationComplete
                        ? undefined
                        : <div>
                            <Divider className="block-information-divider"/>

                            <BlockInformationPanelListItem label="Selected Parent Hash" tooltip={tooltip}>
                                {!blockInformation.selectedParentHash
                                    ?
                                    <Typography className="block-information-panel-hash" variant="h6">None</Typography>
                                    : <BlockInformationPanelHash hash={blockInformation.selectedParentHash}/>
                                }
                            </BlockInformationPanelListItem>

                            <Divider className="block-information-divider"/>

                            <BlockInformationPanelListItem label="Block Parents" tooltip={tooltip}>
                                {blockInformation.parentHashes.length === 0
                                    ?
                                    <Typography className="block-information-panel-hash" variant="h6">None</Typography>
                                    : blockInformation.parentHashes.map(parentHash =>
                                        <BlockInformationPanelHash hash={parentHash}/>)
                                }
                            </BlockInformationPanelListItem>
                        </div>
                    }
                </List>
            </div>
            <div className="katnip-link-text">
                See more details on <a href={katnipAddressForBlock} target="_blank">Katnip Block Explorer</a>
            </div>
        </div>
    </Paper>
}

export default BlockInformationPanel;
