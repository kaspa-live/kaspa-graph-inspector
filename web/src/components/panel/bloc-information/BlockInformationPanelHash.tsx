import {Box, Typography, TypographyProps} from "@mui/material";
import { styled } from '@mui/material/styles';
import { BlockColor } from "@mui/material/styles/createPalette";
import BlockInformationPanelTooltip from "./BlockInformationPanelTooltip";

const HashTitle = styled('div')({
    textTransform: "uppercase",
    fontFamily: "monospace",
})

interface HashTypographyProps extends TypographyProps {
    selected?: boolean;
    color?: BlockColor;
}
  
const HashTypography = styled(
    (
        { selected, color, ...props }: HashTypographyProps
    ) => (<Typography {...props} variant="h6"/>),
    {
        name: "HashTypography",
        shouldForwardProp: (prop) => prop !== 'selected',
    }
)<HashTypographyProps>(({ selected, color, theme }) => ({
    fontFamily: "monospace",
    textTransform: "uppercase",
    ...(
        selected && {
            fontWeight: "bold",
        }
    ),
    ...(
        color && {
            color: theme.palette[color].main,
        }
    )
}));

const BlockInformationPanelHash = ({selected, color, hash, onClickHash}: { selected?: boolean, color?: BlockColor, hash: string, onClickHash: (hash: string) => void }) => {
    const hashStart = hash.substring(0, 16);
    const hashEnd = hash.substring(hash.length - 8);

    return <BlockInformationPanelTooltip title={<HashTitle>{hash}</HashTitle>}>
        <Box 
            onClick={ () => { onClickHash(hash) } }
            sx={{
                display: "flex",
                flexDirection: "row",
                textTransform: "uppercase",
                width: "100%",
                cursor: "pointer",
        }}>
            <Box sx={{ alignSelf: "flex-start" }}>
                <HashTypography selected={selected} color={color}>{hashStart}</HashTypography>
            </Box>
            <Box sx={{ flex: "1 1 auto", textAlign: "center" }}>
                <HashTypography selected={selected} color={color}>…</HashTypography>
            </Box>
            <Box sx={{ alignSelf: "flex-end" }}>
                <HashTypography selected={selected} color={color}>{hashEnd}</HashTypography>
            </Box>
        </Box>
    </BlockInformationPanelTooltip>;
};

export default BlockInformationPanelHash;
