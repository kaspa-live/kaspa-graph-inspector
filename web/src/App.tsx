import { createTheme, ThemeProvider, StyledEngineProvider } from '@mui/material';
import Dag from "./dag/Dag";
import { useState, useRef } from "react";
import BlockInformationPanel from "./components/panel/BlockInformation";
import Canvas from "./components/Canvas";
import Sidebar from './components/sidebar/Sidebar';
import { AppConfig } from './model/AppConfig';
import { BlockInformation } from "./model/BlockInformation";
import SlideItem from './components/base/SlideItem';
import AppContainer from './components/base/AppContainer';
import GlobalStyles from '@mui/material/GlobalStyles';
import { theme } from './dag/Theme';
import { Params } from './Params';

export const App = ({ params }: { params: Params }) => {
    const [blockInformationState, setBlockInformationState] = useState<BlockInformation | null>(null);
    const [appConfigState, setAppConfig] = useState<AppConfig | null>(null);
    const [paramsState] = useState(params);
    const [wasBlockSetState, setWasBlockSetState] = useState(false);
    const [wasBlockInformationPanelCloseRequested, setBlockInformationPanelCloseRequested] = useState(false);
    const [isBlockInformationPanelOpenState, setBlockInformationPanelOpenState] = useState(false);
    const appContainerRef = useRef(null);

    dag.setAppConfigChangedListener(appConfig => {
        setAppConfig(appConfig);
    });

    if (paramsState.interactive) {
        dag.setBlockInformationChangedListener(blockInformation => {
            const hasBlockChanged = blockInformation?.block.blockHash !== blockInformationState?.block.blockHash;

            // Reset close requests if the block changed
            if (hasBlockChanged) {
                setBlockInformationPanelCloseRequested(false);
            }

            setBlockInformationPanelOpenState(blockInformation !== null && (!wasBlockInformationPanelCloseRequested || hasBlockChanged));

            // Only set the target block if it exists to prevent text in an already
            // open panel from disappearing on close
            if (blockInformation) {
                setBlockInformationState(blockInformation);
            }

            // This prevents the panel slide-out animation from occurring on page load
            setWasBlockSetState(wasBlockSetState || blockInformation !== null);
        });

        dag.setBlockClickedListener(block => {
            setBlockInformationPanelOpenState(!!block);
            setBlockInformationPanelCloseRequested(!block);
        });
    }

    const muiTheme = createTheme(theme.options);

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={muiTheme}>
                {appGlobalStyles}
                <AppContainer sx={{
                    padding: 0,
                    margin: 0,

                    position: 'absolute',
                    minWidth: '120px',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,

                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
                    ref={appContainerRef}
                >
                    <Canvas dag={dag} />
                    <Sidebar dag={dag} appConfig={appConfigState} params={paramsState} />

                    {!wasBlockSetState || !paramsState.interactive ? undefined :
                        <SlideItem
                            appear={false}
                            direction="right"
                            in={isBlockInformationPanelOpenState}
                            container={appContainerRef.current}
                            unmountOnExit
                        >
                            <BlockInformationPanel
                                blockInformation={blockInformationState}
                                onClose={() => {
                                    setBlockInformationPanelCloseRequested(true);
                                    setBlockInformationPanelOpenState(false);
                                }}
                                onClickHash={(hash: string) => {
                                    dag.setStateTrackTargetHash(hash);
                                }}
                            />
                        </SlideItem>
                    }
                </AppContainer>
            </ThemeProvider>
        </StyledEngineProvider>
    );
};

const appGlobalStyles = <GlobalStyles styles={{
    '*': {
        boxSizing: 'border-box',
    },
}} />

export const dag = new Dag(0.2);