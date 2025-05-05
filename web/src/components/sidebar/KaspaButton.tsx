import { Box, ButtonBase, Tooltip, useTheme } from "@mui/material";
import { AppConfig, isMainnet, isTestnet } from "../../model/AppConfig";
import AnimatedItem from "../base/AnimatedItem";
import { kaspaLiveAddress } from "../../addresses";
import { Params } from "../../Params";
import { ThemeTypeConst } from "../../model/ThemeType";

const KaspaLogo = ({ appConfig, params, withLinkToKGI }: { appConfig: AppConfig | null, params: Params, withLinkToKGI: boolean }) => {
    const theme = useTheme();
    let logoColor = theme.palette.brand.logo.main;
    let logoBkgColor = theme.palette.brand.logo.contrastText;
    let buttonBkgColor = theme.palette.background.paper;

    if (appConfig) {
        if (!params.interactive && params.theme === ThemeTypeConst.DARK) {
            // Supposedly this is the kaspa.org config
            // Do nothing
        } else if (isMainnet(appConfig)) {
            // Do nothing
        } else if (isTestnet(appConfig)) {
            logoColor = theme.palette.brand.logo.contrastText;
            logoBkgColor = theme.palette.brand.logo.main;
            buttonBkgColor = theme.palette.brand.logo.main;
        } else {
            logoColor = theme.palette.primary.light;
        }
    }

    const kgiUrl = `${kaspaLiveAddress}/`;

    return (
        <AnimatedItem borderRadius={"50px"} magnify={1.03}>
            <Tooltip
                title={
                    <Box sx={{
                        fontWeight: 'normal',
                        fontSize: '1.2em'
                    }}>
                        <strong>Kaspa Graph Inspector (KGI)</strong><br />
                        <br />
                        KGI: v{appConfig ? appConfig.webVersion : "n/a"}<br />
                        Kaspad: v{appConfig ? appConfig.kaspadVersion : "n/a"}<br />
                        <br />
                        Network: <strong>{appConfig ? appConfig.network : "n/a"}</strong>
                        {withLinkToKGI &&
                            <strong>
                                <br /><br />
                                Click to browse the standalone interactive site
                            </strong>
                        }
                    </Box>
                }
                placement="left"
                arrow
                enterDelay={theme.transitions.duration.enteringScreen * 1.5}
            >
                <ButtonBase color="primary" sx={{ borderRadius: '50%' }} focusRipple target={withLinkToKGI ? "blank" : ""} href={withLinkToKGI ? kgiUrl : ""}>
                    <Box sx={{
                        borderRadius: '50%',
                        borderStyle: 'solid',
                        borderColor: buttonBkgColor,
                        borderWidth: '6px',
                        height: '92px',
                        backgroundColor: buttonBkgColor
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="-4 -4 132 132">
                            <g>
                                <circle fill={logoBkgColor} cx="62" cy="62" r="40"></circle>
                                <path fill={logoColor} d="M116.27,38.3A59.47,59.47,0,0,0,103.17,19c-5.4-5.4-12.4-9.5-19.6-12.5a58.81,58.81,0,0,0-22.7-4.3c-8,0-16.2.3-23.2,3.2-7.2,3-13.3,8.7-18.7,14.1S7.17,30.7,4.17,37.9c-2.8,7-1.9,15.5-1.9,23.5s.6,15.8,3.5,22.8c3,7.3,9.1,12.4,14.5,17.8s10.4,11.9,17.6,14.9a61.11,61.11,0,0,0,23,4.9c8,0,15.8-2.4,22.8-5.3a60.41,60.41,0,0,0,32-32.4c2.9-7,6.2-14.7,6.2-22.7S119.17,45.4,116.27,38.3ZM77.57,95.6l-12.7-1.9,3.7-24.6L42,89.6l-7.8-10.2,23.3-18L34.17,43.5,42,33.3l26.6,20.5-3.7-24.6,12.7-1.9,5.1,34.1Z" style={{ fill: logoColor }} />
                            </g>
                        </svg>
                    </Box>
                </ButtonBase>
            </Tooltip>
        </AnimatedItem>
    );
}

export default KaspaLogo;
