import './BlockInformationPanelHash.css'
import {Typography} from "@material-ui/core";
import BlockInformationPanelTooltip from "./BlockInformationPanelTooltip";

const BlockInformationPanelHash = ({className, hash, onSelect}: { className?: string | undefined, hash: string, onSelect: (hash: string) => void }) => {
    const hashStart = hash.substring(0, 16);
    const hashEnd = hash.substring(hash.length - 8);

    return <BlockInformationPanelTooltip title={<div className="block-information-panel-tooltip">{hash}</div>}>
        <Typography className={`block-information-panel-hash ${className}`} variant="h6">
              <div onClick={ () => { onSelect(hash) } } className="hash-start">{hashStart}</div>
              <div onClick={ () => { onSelect(hash) } } className="hash-ellipsis">…</div>
              <div onClick={ () => { onSelect(hash) } } className="hash-end">{hashEnd}</div>
        </Typography>
    </BlockInformationPanelTooltip>;
};

export default BlockInformationPanelHash;
