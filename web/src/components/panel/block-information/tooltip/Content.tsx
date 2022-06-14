import { Box, BoxProps } from "@mui/material";
import { styled } from '@mui/material/styles';

const Container = styled(Box)({
    display: "flex",
    flexDirection: "column",
    minWidth: "200px",
    maxWidth: "320px",

    '& p': {
        marginTop: "5px",
        marginBottom: "5px",
    },

    '& a': {
        textDecoration: "underline",
    },
});

const Contents = (props: BoxProps) => {
    return (
        <Container>
            {props.children}
        </Container>
    );
};

export default Contents;
