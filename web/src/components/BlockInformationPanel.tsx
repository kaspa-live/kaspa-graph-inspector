import {Block} from "../dag/model/Block";
import './BlockInformationPanel.css'
import {Paper} from "@material-ui/core";

const BlockInformationPanel = ({block}: { block: Block | null }) => {
    if (!block) {
        return <div/>;
    }

    const katnipAddress = `${window.location.protocol}//${process.env.REACT_APP_KATNIP_ADDRESS}/#/block/${block.blockHash}`;

    return <Paper elevation={4}>
        <div className="block-information-panel">
            <div className="katnip-link-text">
                See more details on <a href={katnipAddress} target="_blank">Katnip Block Explorer</a>
            </div>
        </div>
    </Paper>
}

export default BlockInformationPanel;
