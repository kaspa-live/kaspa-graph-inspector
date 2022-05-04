import {Box, ListItem, Typography} from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { styled } from '@mui/material/styles';
import {ReactChild, ReactNode} from "react";
import BlockInformationPanelTooltip from "./BlockInformationPanelTooltip";

const Item = styled(ListItem)({
    display: "flex",
    flexDirection: "column",
})

const Header = styled(Box)({
    display: "flex",
    flexDirection: "row",
    width: "100%",
})

const Label = styled(Typography)({
    marginLeft: "0",
    marginRight: "auto",
})

const BlockInformationPanelListItem = ({itemKey, children, label, tooltip}:
                                           { itemKey: string, children: ReactNode, label: string, tooltip: ReactChild }) => {

    return <Item key={itemKey} className="block-information-panel-list-item" disableGutters>
        <Header>
            <Label variant="h6">
                {label}
            </Label>
            <BlockInformationPanelTooltip title={tooltip}>
                <InfoOutlinedIcon sx={{marginRight: "0", marginLeft: "auto"}}/>
            </BlockInformationPanelTooltip>
        </Header>
        {children}
    </Item>
};

export default BlockInformationPanelListItem;
