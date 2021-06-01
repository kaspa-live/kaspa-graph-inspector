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

    const blockHashTooltip = <div className="information-tooltip">
        <p>The <b>hash</b> of a block is its unique identifier in the block DAG.</p>
        <p>A block's hash is derived directly from the block itself using a cryptographic hash function. That ensures
            that no two blocks in the DAG have the same hash, and that each hash represents only the block from which it
            was derived.</p>
        <p className="further-information"><a href="https://google.com/" target="_blank">Further Information</a></p>
    </div>

    const blockParentsTooltip = <div className="information-tooltip">
        <p>Every block in the block DAG (aside from the genesis) has one or more <b>parents.</b> A <b>parent</b> is
            simply the hash of another block that had been added to the DAG at a prior time.</p>
        <p>Here, we represent each parent with an arrow. Note that all arrows point from left to right—from child to
            parent. Moving towards the left in the graph reveals increasingly older generations of blocks until we reach
            the leftmost, and oldest, block. That's the origin of the DAG, or the genesis.</p>
        <p>A block's <b>selected parent</b> is the parent that has the most accumulated proof-of-work.</p>
        <p className="further-information"><a href="https://google.com/" target="_blank">Further Information</a></p>
    </div>;

    const blockMergeSetTooltip = <div className="information-tooltip">
        <p>Every block in the DAG (aside from the genesis) has a selected parent. That selected parent likewise has a
            selected parent. Following this <b>chain</b> of selected parents will eventually bring us to the genesis. We
            call this chain the <b>Selected Parent Chain</b> of a block, or its <b>SPC.</b></p>
    </div>;

    const isBlockInVirtualSelectedParentChainTooltip = <div className="information-tooltip">
        <p>The <b>virtual</b> block is a special, invisible block whose parents are always the blocks in the DAG that do
            not yet have any children.</p>
        <p>Like all blocks, the virtual has a selected parent block. That block likewise has a selected parent, and so
            on. This forms a Selected Parent Chain with the Virtual as its origin. We call this special chain the <b>Virtual
                Selected Parent Chain,</b> or the <b>VSPC</b> for short.</p>
        <p className="further-information"><a href="https://google.com/" target="_blank">Further Information</a></p>
    </div>;

    const blockColorTooltip = <div className="information-tooltip">
        A block's color is <a href="https://google.com" target="_blank"> blah blah blah</a> blah blah blah blah
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sit amet rhoncus ipsum. Phasellus sit amet leo
        commodo, mattis urna et, viverra nunc. Vestibulum faucibus pharetra nulla. Nam nisi nibh, tempor id facilisis
        et, cursus eu mauris. Nunc ut magna ex. Sed porta hendrerit sapien, nec mollis erat elementum non. Donec porta
        erat et facilisis vulputate. Vivamus dapibus ipsum quam. Quisque sed tempor mauris, at gravida risus. Ut in
        sodales lorem. Quisque cursus fringilla dictum. Nullam lacus dolor, consequat luctus malesuada id, commodo eget
        est. Morbi blandit lobortis elit a ultrices. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam vel
        felis a magna feugiat venenatis.
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
