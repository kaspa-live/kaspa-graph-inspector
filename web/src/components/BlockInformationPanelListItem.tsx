import {ListItem, Typography} from "@material-ui/core";
import './BlockInformationPanelListItem.css'
import {ReactNode} from "react";

const BlockInformationPanelListItem = ({children, label}: { children: ReactNode, label: string }) => {
    return <ListItem className="block-information-panel-list-item" disableGutters>
        <Typography className="label" variant="h6">
            {label}
        </Typography>
        {children}
    </ListItem>
};

export default BlockInformationPanelListItem;
