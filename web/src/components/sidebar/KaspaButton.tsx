import { Box, ButtonBase } from "@mui/material";
import AnimatedCircle from "../base/AnimatedCircle";
import Logo from "../../assets/kaspa-logo.svg"

const KaspaLogo = () => {
    return (
        <AnimatedCircle>
            <ButtonBase color="primary" sx={{borderRadius: '50%'}} focusRipple>
                <Box sx={{
                    borderRadius: '50%',
                    borderStyle: 'solid',
                    borderColor: '#5a5a5a',
                    borderWidth: '6px',
                    height: '92px',
                    backgroundColor: '#5a5a5a'
                }}>
                    <img src={Logo} alt="Kaspa Logo" style={{height:"100%", width:"100%"}} draggable="false" />
                </Box>
            </ButtonBase>
        </AnimatedCircle>
    );
}

export default KaspaLogo;
