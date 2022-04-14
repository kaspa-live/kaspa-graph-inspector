import './BlockInformationPanelHash.css'
import {Typography} from "@material-ui/core";
import BlockInformationPanelTooltip from "./BlockInformationPanelTooltip";

const BlockInformationPanelHash = ({className, hash}: { className?: string | undefined, hash: string }) => {
    const hashStart = hash.substring(0, 16);
    const hashEnd = hash.substring(hash.length - 8);
    const addressForHash = `/?hash=${hash.toLowerCase()}`;

    return <BlockInformationPanelTooltip title={<div className="block-information-panel-tooltip">{hash}</div>}>
        <Typography className={`block-information-panel-hash ${className}`} variant="h6">
              <div className="hash-start"><a href={addressForHash}>{hashStart}</a></div>
              <div className="hash-ellipsis"><a href={addressForHash}>…</a></div>
              <div className="hash-end"><a href={addressForHash}>{hashEnd}</a></div>
        </Typography>
    </BlockInformationPanelTooltip>;
};

export default BlockInformationPanelHash;
