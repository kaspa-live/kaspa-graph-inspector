import './BlockInformationPanelHash.css'
import {Typography} from "@material-ui/core";

const BlockInformationPanelHash = ({hash}: { hash: string }) => {
    const hashStart = hash.substring(0, 16);
    const hashEnd = hash.substring(hash.length - 8);

    return <Typography className="block-information-panel-hash" variant="h6">
        <div className="hash-start">{hashStart}</div>
        <div className="hash-ellipsis">…</div>
        <div className="hash-end">{hashEnd}</div>
    </Typography>;
};

export default BlockInformationPanelHash;
