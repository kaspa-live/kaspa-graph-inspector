import './BlockInformationPanelHash.css'
import {Tooltip, Typography} from "@material-ui/core";

const BlockInformationPanelHash = ({hash}: { hash: string }) => {
    const hashStart = hash.substring(0, 16);
    const hashEnd = hash.substring(hash.length - 8);

    return <Tooltip title={hash} arrow interactive>
        <Typography className="block-information-panel-hash" variant="h6">
            <div className="hash-start">{hashStart}</div>
            <div className="hash-ellipsis">…</div>
            <div className="hash-end">{hashEnd}</div>
        </Typography>
    </Tooltip>;
};

export default BlockInformationPanelHash;
