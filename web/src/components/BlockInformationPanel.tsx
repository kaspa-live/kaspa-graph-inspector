import {Block} from "../dag/model/Block";
import './BlockInformationPanel.css'

const BlockInformationPanel = ({block}: { block: Block | null }) => {
    if (!block) {
        return <div/>;
    }

    return <div className="block-information-panel">{block.blockHash}</div>
}

export default BlockInformationPanel;
