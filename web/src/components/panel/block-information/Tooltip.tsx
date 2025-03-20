import {ReactChild, ReactElement, ReactFragment, ReactPortal} from "react";
import { Tooltip as TooltipMUI, TooltipProps as TooltipPropsMUI } from "@mui/material";
import { styled } from '@mui/material/styles';
import { BorderColor } from "@mui/icons-material";

const StyledTooltip = styled(
        ({ className, ...props }: TooltipPropsMUI) => (<TooltipMUI {...props} classes={{ popper: className }}/>),
        {name: "StyledTooltip"}
    )<TooltipPropsMUI>(({ theme }) => ({

    '& .MuiTooltip-tooltip': {
        maxWidth: "none",
        backgroundColor: theme.palette.tooltip.background.main,
        border: "1px solid",
        borderColor: theme.palette.tooltip.border.main,
        fontSize: "0.9rem",
    },
    
    '& .MuiTooltip-arrow': {
        "&::before": {
            backgroundColor: theme.palette.tooltip.background.main,
            border: "1px solid",
            borderColor: theme.palette.tooltip.border.main,
        }
    }
}));

const Tooltip = ({children, title}: { children: ReactElement, title: boolean | ReactChild | ReactFragment | ReactPortal }) => {
    return (
        <StyledTooltip title={title} arrow placement="right">
            {children}
        </StyledTooltip>
    );
};

export default Tooltip;
