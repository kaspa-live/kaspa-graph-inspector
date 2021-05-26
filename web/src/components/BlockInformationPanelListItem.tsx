import {ListItem, Typography} from "@material-ui/core";
import './BlockInformationPanelListItem.css'
import {ReactNode} from "react";
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';

const BlockInformationPanelListItem = ({children, label}: { children: ReactNode, label: string }) => {
    return <ListItem className="block-information-panel-list-item" disableGutters>
        <div className="header">
            <Typography className="label" variant="h6">
                {label}
            </Typography>
            <InfoOutlinedIcon className="info-icon"/>
        </div>
        {children}
    </ListItem>
};

export default BlockInformationPanelListItem;
