import {ListItem, Typography} from "@mui/material";
import './BlockInformationPanelListItem.css'
import {ReactChild, ReactNode} from "react";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BlockInformationPanelTooltip from "./BlockInformationPanelTooltip";

const BlockInformationPanelListItem = ({itemKey, children, label, tooltip}:
                                           { itemKey: string, children: ReactNode, label: string, tooltip: ReactChild }) => {

    return <ListItem key={itemKey} className="block-information-panel-list-item" disableGutters>
        <div className="header">
            <Typography className="label" variant="h6">
                {label}
            </Typography>
            <BlockInformationPanelTooltip title={tooltip}>
                <InfoOutlinedIcon className="info-icon"/>
            </BlockInformationPanelTooltip>
        </div>
        {children}
    </ListItem>
};

export default BlockInformationPanelListItem;
