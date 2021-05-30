import {ListItem, Typography} from "@material-ui/core";
import './BlockInformationPanelListItem.css'
import {ReactFragment, ReactNode} from "react";
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import BlockInformationPanelTooltip from "./BlockInformationPanelTooltip";

const BlockInformationPanelListItem = ({children, label, tooltip}:
                                           { children: ReactNode, label: string, tooltip: ReactFragment }) => {

    return <ListItem className="block-information-panel-list-item" disableGutters>
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
