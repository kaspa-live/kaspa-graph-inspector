import {ReactChild, ReactElement, ReactFragment, ReactPortal} from "react";
import { Tooltip as TooltipMUI, TooltipProps as TooltipPropsMUI } from "@mui/material";
import { styled } from '@mui/material/styles';

const StyledTooltip = styled(
        ({ className, ...props }: TooltipPropsMUI) => (<TooltipMUI {...props} classes={{ popper: className }}/>),
        {name: "StyledTooltip"}
    )<TooltipPropsMUI>(({ theme }) => ({

    '& .MuiTooltip-tooltip': {
        maxWidth: "none",
        backgroundColor: theme.palette.primary.main,
        border: "1px solid #ffffff",
        fontSize: "0.9rem",
    },
    
    '& .MuiTooltip-arrow': {
        "&::before": {
            backgroundColor: theme.palette.primary.main,
            border: "1px solid #ffffff",
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
