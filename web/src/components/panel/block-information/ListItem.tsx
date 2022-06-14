import { Box, ListItem as ListItemMUI, Typography } from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { styled } from '@mui/material/styles';
import { ReactChild, ReactNode } from "react";
import Tooltip from "./Tooltip";

const Item = styled(ListItemMUI)({
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

const ListItem = ({itemKey, children, label, tooltip}:
                                           { itemKey: string, children: ReactNode, label: string, tooltip: ReactChild }) => {

    return (
        <Item key={itemKey} disableGutters>
            <Header>
                <Label variant="subtitle1">
                    {label}
                </Label>
                <Tooltip title={tooltip}>
                    <InfoOutlinedIcon sx={{marginRight: "0", marginLeft: "auto"}}/>
                </Tooltip>
            </Header>
            {children}
        </Item>
    );
};

export default ListItem;
