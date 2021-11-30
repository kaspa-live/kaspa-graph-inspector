import './BlockInformationPanel.css'
import {Divider, IconButton, List, Paper, Typography} from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';
import BlockInformationPanelHash from "./BlockInformationPanelHash";
import BlockInformationPanelListItem from "./BlockInformationPanelListItem";
import {kaspaLiveAddress, katnipAddress} from "../addresses";
import {BlockInformation} from "../model/BlockInformation";

const BlockInformationPanel = ({blockInformation, onClose}:
                                   { blockInformation: BlockInformation | null, onClose: () => void }) => {

    if (!blockInformation) {
        return <div/>;
    }

    const katnipAddressForBlock = `${katnipAddress}/block/${blockInformation.block.blockHash}`;
    const kaspaLiveDocsAddress = `${kaspaLiveAddress}/docs`;
    const howDoesKaspaWorkAddress = `${kaspaLiveDocsAddress}#how-does-kaspa-work`

    let blockColorText = "Undecided";
    let blockColorClass = "block-color-undecided";
    if (blockInformation.block.color === "blue") {
        blockColorText = "Blue";
        blockColorClass = "block-color-blue";
    } else if (blockInformation.block.color === "red") {
        blockColorText = "Red";
        blockColorClass = "block-color-red";
    }

    const blockHashTooltip = <div className="information-tooltip">
        <p>The <b>hash</b> of a block is its unique identifier in the block DAG.</p>
        <p>A block's hash is derived directly from the block itself using a cryptographic hash function. That ensures
            that no two blocks in the DAG have the same hash, and that each hash represents only the original block from
            which it was derived.</p>
    </div>

    const blockParentsTooltip = <div className="information-tooltip">
        <p>Every block in the block DAG (aside from the genesis) has one or more <b>parents.</b> A <b>parent</b> is
            simply the hash of another block that had been added to the DAG at a prior time.</p>
        <p>Here, we represent each parent with an arrow. Note that all arrows point from right to left—from child to
            parent. Moving towards the left in the graph reveals increasingly older generations of blocks until we reach
            the leftmost, and oldest, block. That's the origin of the DAG, or the genesis.</p>
        <p>A block's <b>selected parent</b> is the parent that has the most accumulated proof-of-work.</p>
    </div>;

    const blockMergeSetTooltip = <div className="information-tooltip">
        <p>The <b>merge set</b> of a block is the set of blocks that are an ancestor (either a direct or an indirect
            parent) of the block but are not an ancestor of the block's selected parent. Note that this includes the
            block's selected parent itself.</p>
        <p>Every block in the merge set is classified as one of two <b>colors</b>: <b className="block-color-red">
            red</b> and <b className="block-color-blue">blue</b>.</p>
        <p>For security reasons, only a certain amount of blocks in a block's merge set may
            be <b className="block-color-blue">blue</b>. The blocks that do not make the cut are regarded as
            attacker blocks and are marked <b className="block-color-red">red</b>.</p>
    </div>;

    const isBlockInVirtualSelectedParentChainTooltip = <div className="information-tooltip">
        <p>Every block in the DAG (aside from the genesis) has a selected parent. That selected parent likewise has a
            selected parent. Following this <b>chain</b> of selected parents will eventually bring us to the genesis. We
            call this chain the <b>Selected Parent Chain</b> of a block, or its <b>SPC.</b></p>
        <p>The <b>virtual</b> block is a special, invisible block whose parents are always the blocks in the DAG that do
            not yet have any children.</p>
        <p>Like all blocks, the virtual has a selected parent block. The Selected Parent Chain of the virtual is plainly
            called the <b>Virtual Selected Parent Chain,</b> or the <b>VSPC.</b></p>
    </div>;

    const blockColorTooltip = <div className="information-tooltip">
        <p>Every block in the DAG is classified as one of two <b>colors:</b>
            <b className="block-color-red"> red (attacker)</b> and <b className="block-color-blue">blue (honest)</b>.
        </p>
        <p>If we were to combine all the merge sets of all the blocks in the VSPC, we would get a combined set of all
            the blocks in the DAG. Therefore, to determine the color of a block, we find the VSPC block that contains
            our block in its merge set. The color of our block in that merge set is the color of the block in the
            DAG.</p>
    </div>;

    const parentElements = [];
    if (blockInformation.isInformationComplete) {
        for (let parentHash of blockInformation.parentHashes) {
            const className = blockInformation.selectedParentHash === parentHash ? "selected-parent-hash" : "";
            parentElements.push(<BlockInformationPanelHash hash={parentHash} className={className}/>)
        }
    }

    const mergeSetHashElements = [];
    if (blockInformation.isInformationComplete) {
        for (let mergeSetBlueHash of blockInformation.mergeSetBlueHashes) {
            mergeSetHashElements.push(
                <BlockInformationPanelHash className="block-color-blue" hash={mergeSetBlueHash}/>);
        }
        for (let mergeSetRedHash of blockInformation.mergeSetRedHashes) {
            mergeSetHashElements.push(
                <BlockInformationPanelHash className="block-color-red" hash={mergeSetRedHash}/>);
        }
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
            <div className="block-information-content-container">
                <div className="block-information-content">
                    {!blockInformation.isInformationComplete
                        ? undefined
                        : <List>
                            <BlockInformationPanelListItem label="Block Hash" tooltip={blockHashTooltip}>
                                <BlockInformationPanelHash hash={blockInformation.block.blockHash}/>
                            </BlockInformationPanelListItem>

                            <Divider className="block-information-divider"/>

                            <BlockInformationPanelListItem label="Block Parents" tooltip={blockParentsTooltip}>
                                {parentElements.length === 0
                                    ?
                                    <Typography className="block-information-panel-hash"
                                                variant="h6">None</Typography>
                                    : parentElements
                                }
                            </BlockInformationPanelListItem>

                            <Divider className="block-information-divider"/>

                            <BlockInformationPanelListItem label="Block Merge Set" tooltip={blockMergeSetTooltip}>
                                {mergeSetHashElements.length === 0
                                    ?
                                    <Typography className="block-information-panel-hash"
                                                variant="h6">None</Typography>
                                    : mergeSetHashElements
                                }
                            </BlockInformationPanelListItem>

                            <Divider className="block-information-divider"/>

                            <BlockInformationPanelListItem label="Is Block In VSPC"
                                                           tooltip={isBlockInVirtualSelectedParentChainTooltip}>
                                <Typography className="is-block-in-virtual-selected-parent-chain" variant="h6">
                                    {blockInformation.block.isInVirtualSelectedParentChain ? "Yes" : "No"}
                                </Typography>
                            </BlockInformationPanelListItem>

                            <Divider className="block-information-divider"/>

                            <BlockInformationPanelListItem label="Block Color" tooltip={blockColorTooltip}>
                                <Typography className={`block-color ${blockColorClass}`} variant="h6">
                                    {blockColorText}
                                </Typography>
                            </BlockInformationPanelListItem>
                        </List>
                    }
                </div>
            </div>
            <div className="katnip-link-text">
                See more details on <a href={katnipAddressForBlock} target="_blank">Katnip Block Explorer</a>
            </div>
        </div>
    </Paper>
}

export default BlockInformationPanel;
