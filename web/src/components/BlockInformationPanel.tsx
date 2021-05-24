import {Block} from "../dag/model/Block";
import './BlockInformationPanel.css'
import {Paper} from "@material-ui/core";

const BlockInformationPanel = ({block}: { block: Block | null }) => {
    if (!block) {
        return <div/>;
    }

    return <Paper elevation={4}>
        <div className="block-information-panel">
            {block.blockHash}
        </div>
    </Paper>
}

export default BlockInformationPanel;
