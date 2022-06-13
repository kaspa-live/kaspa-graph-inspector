import './App.css';
import { createTheme, ThemeProvider, StyledEngineProvider, Box } from '@mui/material';
import Dag from "./dag/Dag";
import {useState} from "react";
import BlockInformationPanel from "./components/panel/bloc-information/BlockInformationPanel";
import Canvas from "./components/Canvas";
import Sidebar from './components/sidebar/Sidebar';
import {BlockInformation} from "./model/BlockInformation";

const App = ({interactive}: {interactive: boolean}) => {
    const [blockInformationState, setBlockInformationState] = useState<BlockInformation | null>(null);
    const [wasBlockSetState, setWasBlockSetState] = useState(false);
    const [wasBlockInformationPanelCloseRequested, setBlockInformationPanelCloseRequested] = useState(false);
    const [isBlockInformationPanelOpenState, setBlockInformationPanelOpenState] = useState(false);

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

    console.log(`Starting KGI: interactive=${interactive}`)

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
                <Box sx={{
                        minHeight: '100vh',
                        minWidth: '100vw',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Canvas dag={dag}/>
                    <Sidebar dag={dag}/>

                    {!wasBlockSetState || !interactive ? undefined :
                        <div
                            className={`block-information-container ${isBlockInformationPanelOpenState ? "block-information-open" : "block-information-closed"}`}>
                            <BlockInformationPanel blockInformation={blockInformationState}
                                                   onClose={() => {
                                                       setBlockInformationPanelCloseRequested(true);
                                                       setBlockInformationPanelOpenState(false);
                                                   }}
                                                   onClickHash={(hash: string) => {
                                                        dag.setStateTrackTargetHash(hash);
                                                   }}/>
                        </div>
                    }
                </Box>
            </ThemeProvider>
        </StyledEngineProvider>
    );
};

const theme = createTheme({
    palette: {
        primary: {
            main: "#175676"
        },
        secondary: {
            main: "#26c6da"
        },
        background: {
            paper: "#fff"
        },

        block: {
            blue: {
                main: "#5581AA",
                dark: "#1f5278",        // https://fffuel.co/cccolor/ - #5581AA - Shade palette 4
                light: "#95adc8"        // https://fffuel.co/cccolor/ - #5581AA - Tint palette 4
            },
            red: {
                main: "#B34D50",
                dark: "#82212a",        // https://fffuel.co/cccolor/ - #B34D50 - Shade palette 4
                light: "#d48d8b"        // https://fffuel.co/cccolor/ - #B34D50 - Tint palette 4
            },
            gray: {
                main: "#aaaaaa",
            },
        },
    },
});

const dag = new Dag();

export default App;
