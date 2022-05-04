import './App.css';
import { createTheme, ThemeProvider, StyledEngineProvider, Box } from '@mui/material';
import Dag from "./dag/Dag";
import {useState} from "react";
import BlockInformationPanel from "./components/panel/bloc-information/BlockInformationPanel";
import Canvas from "./components/Canvas";
import Sidebar from './components/sidebar/Sidebar';
import {BlockInformation} from "./model/BlockInformation";


// declare module '@mui/styles/defaultTheme' {
//   // eslint-disable-next-line @typescript-eslint/no-empty-interface
//   interface DefaultTheme extends Theme {}
// }


const App = () => {
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

                    {!wasBlockSetState ? undefined :
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

        blueBlock: {
            main: "#b4cfed"
        },
        redBlock: {
            main: "#ff5972"
        },
        newBlock: {
            main: "#aaaaaa"
        }
    }
});

const dag = new Dag();

export default App;
