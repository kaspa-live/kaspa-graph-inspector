import {ListItem, Tooltip, Typography} from "@material-ui/core";
import './BlockInformationPanelListItem.css'
import {ReactFragment, ReactNode} from "react";
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';

const BlockInformationPanelListItem = ({children, label, tooltip}:
                                           { children: ReactNode, label: string, tooltip: ReactFragment }) => {

    return <ListItem className="block-information-panel-list-item" disableGutters>
        <div className="header">
            <Typography className="label" variant="h6">
                {label}
            </Typography>
            <Tooltip title={tooltip} arrow interactive>
                <InfoOutlinedIcon className="info-icon"/>
            </Tooltip>
        </div>
        {children}
    </ListItem>
};

export default BlockInformationPanelListItem;
