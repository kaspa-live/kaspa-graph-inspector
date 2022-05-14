import {ReactChild, ReactElement, ReactFragment, ReactPortal} from "react";
import { Tooltip, TooltipProps } from "@mui/material";
import { styled } from '@mui/material/styles';

const StyledTooltip = styled(
        ({ className, ...props }: TooltipProps) => (<Tooltip {...props} classes={{ popper: className }}/>),
        {name: "StyledTooltip"}
    )<TooltipProps>(({ theme }) => ({

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

const BlockInformationPanelTooltip = ({children, title}:
                                      { children: ReactElement, title: boolean | ReactChild | ReactFragment | ReactPortal }) => {

    // To help debug tooltip CSS, add property open={true} to StyledTooltip
    return <StyledTooltip title={title} arrow placement="right">
        {children}
    </StyledTooltip>
};

export default BlockInformationPanelTooltip;
