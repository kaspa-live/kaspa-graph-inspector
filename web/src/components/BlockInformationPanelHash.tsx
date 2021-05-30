import './BlockInformationPanelHash.css'
import {makeStyles, Tooltip, Typography} from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
    noMaxWidth: {
        maxWidth: 'none',
    },
}));

const BlockInformationPanelHash = ({className, hash}: { className?: string | undefined, hash: string }) => {
    const hashStart = hash.substring(0, 16);
    const hashEnd = hash.substring(hash.length - 8);

    const classes = useStyles();

    return <Tooltip title={hash} arrow interactive classes={{tooltip: classes.noMaxWidth}}>
        <Typography className={`block-information-panel-hash ${className}`} variant="h6">
            <div className="hash-start">{hashStart}</div>
            <div className="hash-ellipsis">…</div>
            <div className="hash-end">{hashEnd}</div>
        </Typography>
    </Tooltip>;
};

export default BlockInformationPanelHash;
