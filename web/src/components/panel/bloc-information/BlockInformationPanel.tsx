import {Box, Divider, IconButton, Link, List, Paper, Typography, useTheme} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import { BlockColor } from '@mui/material/styles/createPalette';
import BlockInformationPanelHash from "./BlockInformationPanelHash";
import BlockInformationPanelListItem from "./BlockInformationPanelListItem";
import {katnipAddress} from "../../../addresses";
import {BlockInformation} from "../../../model/BlockInformation";

const InfoDivider = () => <Divider sx={{backgroundColor: 'primary.contrastText'}}/>

const RedBlock = styled('b')(({ theme }) => ({ color: theme.palette.block.red.main }));
const BlueBlock = styled('b')(({ theme }) => ({ color: theme.palette.block.blue.main }));

const LeftTypography = styled(Typography)({
    alignSelf: "flex-start",
})

const BlockInformationPanel = ({blockInformation, onClose, onClickHash}:
                               { blockInformation: BlockInformation | null, onClose: () => void, onClickHash: (hash: string) => void }) => {
    const theme = useTheme();

    if (!blockInformation) {
        return <div/>;
    }

    const katnipAddressForBlock = `${katnipAddress}/block/${blockInformation.block.blockHash}`;

    let blockColorText = "Undecided";
    let blockColorClass: BlockColor = "gray";
    if (blockInformation.block.color === "blue") {
        blockColorText = "Blue";
        blockColorClass = "blue";
    } else if (blockInformation.block.color === "red") {
        blockColorText = "Red";
        blockColorClass = "red";
    }

    let language = navigator.language || "en-US";
    let blockDAAScore = blockInformation.block.daaScore.toLocaleString(language);

    const blockHashTooltip = <div className="information-tooltip">
        <p>The <b>hash</b> of a block is its unique identifier in the block DAG.</p>
        <p>A block's hash is derived directly from the block itself using a cryptographic hash function. That ensures
            that no two blocks in the DAG have the same hash, and that each hash represents only the original block from
            which it was derived.</p>
    </div>

    const blockParentsTooltip = <div className="information-tooltip">
        <p>Every block in the block DAG (aside from the genesis) has one or more <b>parents.</b> A <b>parent</b> is
            simply the hash of another block that had been added to the DAG at a prior time.</p>
        <p>Here, we represent each parent with an arrow. Note that all arrows point from right to left — from child to
            parent. Moving towards the left in the graph reveals increasingly older generations of blocks until we reach
            the leftmost, and oldest, block. That's the origin of the DAG, or the genesis.</p>
        <p>A block's <b>selected parent</b> is the parent that has the most accumulated proof-of-work.</p>
    </div>;

    const blockMergeSetTooltip = <div className="information-tooltip">
        <p>The <b>merge set</b> of a block is the set of blocks that are an ancestor (either a direct or an indirect
            parent) of the block but are not an ancestor of the block's selected parent. Note that this includes the
            block's selected parent itself.</p>
        <p>Every block in the merge set is classified as one of two <b>colors</b>: <RedBlock>
            red</RedBlock> and <BlueBlock>blue</BlueBlock>.</p>
        <p>For security reasons, only a certain amount of blocks in a block's merge set may
            be <BlueBlock>blue</BlueBlock>. The blocks that do not make the cut are regarded as
            attacker blocks and are marked <RedBlock>red</RedBlock>.</p>
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
            <RedBlock> red (attacker)</RedBlock> and <BlueBlock>blue (honest)</BlueBlock>.
        </p>
        <p>If we were to combine all the merge sets of all the blocks in the VSPC, we would get a combined set of all
            the blocks in the DAG. Therefore, to determine the color of a block, we find the VSPC block that contains
            our block in its merge set. The color of our block in that merge set is the color of the block in the
            DAG.</p>
    </div>;

    const blockDAAScoreTooltip = <div className="information-tooltip">
        <p>Every block in the DAG has a DAA Score.</p>
        <p>The DAA Score is related to the number of honest blocks ever added to the DAG. Since blocks are created at a
            rate of one per second, the score is a metric of the elapsed time since network launch.</p>
    </div>;

    const blockChildrenTooltip = <div className="information-tooltip">
        <p>Every block in the block DAG (aside from the blocks forming the tips) has one or more <b>children.</b> A <b>child</b> is
           simply the hash of another block that has been added to the DAG at a later time and that has the block
            hash in its parents.</p>
        <p>Here, we represent each child with an arrow. Note that all arrows point from right to left — from child to
            parent. Moving towards the right in the graph reveals increasingly younger generations of blocks until we
            reach the rightmosts, and youngest, blocks. That's the tips of the DAG.</p>
    </div>;

    const parentElements = [];
    if (blockInformation.isInformationComplete) {
        for (let parentHash of blockInformation.parentHashes) {
            const selectedParent = (blockInformation.selectedParentHash === parentHash);
            parentElements.push(<BlockInformationPanelHash key={parentHash} selected={selectedParent} hash={parentHash} onClickHash={onClickHash}/>)
        }
    }

    const mergeSetHashElements = [];
    if (blockInformation.isInformationComplete) {
        for (let mergeSetBlueHash of blockInformation.mergeSetBlueHashes) {
            mergeSetHashElements.push(
                <BlockInformationPanelHash key={mergeSetBlueHash} color="blue" hash={mergeSetBlueHash} onClickHash={onClickHash}/>);
        }
        for (let mergeSetRedHash of blockInformation.mergeSetRedHashes) {
            mergeSetHashElements.push(
                <BlockInformationPanelHash key={mergeSetRedHash} color="red" hash={mergeSetRedHash} onClickHash={onClickHash}/>);
        }
    }

    const childElements = [];
    if (blockInformation.isInformationComplete) {
        for (let childHash of blockInformation.childHashes) {
            const selectedChild = (blockInformation.selectedChildHash === childHash);
            childElements.push(<BlockInformationPanelHash key={childHash} selected={selectedChild} hash={childHash}  onClickHash={onClickHash}/>)
        }
    }

    return (
        <Paper elevation={4}>
            <Box className="block-information-panel" sx={{
                height: '100vh',
                width: '100%',
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                flexDirection: 'column',
            }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '20px 20px 0',
                }}>
                    <Typography variant="h4">
                        Block Information
                    </Typography>
                    <IconButton
                        onClick={onClose} 
                        size="large"
                        sx={{
                            color: 'primary.contrastText',
                            padding: '20px',
                            margin: '-20px -20px auto auto',
                        }}
                    >
                        <CloseIcon/>
                    </IconButton>
                </Box>
                <Box sx={{
                    flex: '1 1 auto',
                    overflowY: 'auto',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    scrollbarWidth: 'none', /* Hide the scrollbar in Firefox */
                    msOverflowStyle: 'none', /* Hide the scrollbar in IE */
                    '&::-webkit-scrollbar': {
                        width: '0',
                    }
                }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        {!blockInformation.isInformationComplete
                            ? undefined
                            : <List>
                                <BlockInformationPanelListItem itemKey="block-hash" label="Block Hash" tooltip={blockHashTooltip}>
                                    <BlockInformationPanelHash hash={blockInformation.block.blockHash} onClickHash={onClickHash}/>
                                </BlockInformationPanelListItem>

                                <InfoDivider/>

                                <BlockInformationPanelListItem itemKey="block-parents" label="Block Parents" tooltip={blockParentsTooltip}>
                                    {parentElements.length === 0
                                        ?
                                        <LeftTypography variant="h6">None</LeftTypography>
                                        : parentElements
                                    }
                                </BlockInformationPanelListItem>

                                <InfoDivider/>

                                <BlockInformationPanelListItem itemKey="block-merge-set" label="Block Merge Set" tooltip={blockMergeSetTooltip}>
                                    {mergeSetHashElements.length === 0
                                        ?
                                        <LeftTypography variant="h6">None</LeftTypography>
                                        : mergeSetHashElements
                                    }
                                </BlockInformationPanelListItem>

                                <InfoDivider/>

                                <BlockInformationPanelListItem itemKey="block-children" label="Block Children" tooltip={blockChildrenTooltip}>
                                    {childElements.length === 0
                                        ?
                                        <LeftTypography variant="h6">None</LeftTypography>
                                        : childElements
                                    }
                                </BlockInformationPanelListItem>

                                <InfoDivider/>

                                <BlockInformationPanelListItem itemKey="is-bloc-vspc" label="Is Block In VSPC"
                                                               tooltip={isBlockInVirtualSelectedParentChainTooltip}>
                                    <LeftTypography variant="h6">
                                        {blockInformation.block.isInVirtualSelectedParentChain ? "Yes" : "No"}
                                    </LeftTypography>
                                </BlockInformationPanelListItem>

                                <InfoDivider/>

                                <BlockInformationPanelListItem itemKey="block-color" label="Block Color" tooltip={blockColorTooltip}>
                                    <LeftTypography variant="h6" sx={{ color: theme.palette.block[blockColorClass].main }}>
                                        {blockColorText}
                                    </LeftTypography>
                                </BlockInformationPanelListItem>

                                <InfoDivider/>

                                <BlockInformationPanelListItem itemKey="block-daa-score" label="Block DAA Score" tooltip={blockDAAScoreTooltip}>
                                    <LeftTypography variant="h6">
                                        {blockDAAScore}
                                    </LeftTypography>
                                </BlockInformationPanelListItem>
                            </List>
                        }
                    </Box>
                </Box>
                <Box sx={{
                    alignSelf: 'flex-end',
                    fontWeight: 'bold',
                    textAlign: 'end',
                    width: '100%',
                    padding: '0 20px 20px',
                }}>
                    See more details on <Link href={katnipAddressForBlock} target="_blank" rel="noreferrer" sx={{textDecoration: 'underline', color: 'primary.contrastText'}}>Katnip Block Explorer</Link>
                </Box>
            </Box>
        </Paper>
    );
}

export default BlockInformationPanel;
