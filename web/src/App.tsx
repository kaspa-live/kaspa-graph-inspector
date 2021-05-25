import './App.css';
import Canvas from "./components/Canvas";
import {createMuiTheme, ThemeProvider} from '@material-ui/core';
import Dag from "./dag/Dag";
import {useState} from "react";
import ConnectionIssuesIndicator from "./components/ConnectionIssuesIndicator";
import TrackButton from "./components/TrackButton";
import {Block} from "./dag/model/Block";
import BlockInformationPanel from "./components/BlockInformationPanel";

const App = () => {
    const [isTrackingState, setTrackingState] = useState(true);
    const [isHavingConnectionIssuesState, setHavingConnectionIssuesState] = useState(false);
    const [targetBlockState, setTargetBlockState] = useState<Block | null>(null);
    const [wasBlockSetState, setWasBlockSetState] = useState(false);
    const [isBlockInformationPanelOpenState, setBlockInformationPanelOpenState] = useState(false);

    dag.setIsTrackingChangedListener(isTracking => setTrackingState(isTracking));
    dag.setIsFetchFailingListener(isFailing => setHavingConnectionIssuesState(isFailing));
    dag.setTargetBlockChangedListener(targetBlock => {
        // Exit early if the target block didn't change
        if (targetBlock?.blockHash === targetBlockState?.blockHash) {
            return;
        }

        setBlockInformationPanelOpenState(targetBlock !== null)

        // Only set the target block if it exists to prevent text in an already
        // open panel from disappearing on close
        if (targetBlock) {
            setTargetBlockState(targetBlock);
        }

        // This prevents the panel slide-out animation from occurring on page load
        setWasBlockSetState(wasBlockSetState || targetBlock !== null);
    });

    return (
        <ThemeProvider theme={theme}>
            <div className="container">
                <Canvas dag={dag}/>
                <div className="track-button-container">
                    {isTrackingState ? undefined : <TrackButton onClick={() => dag.setStateTrackHead()}/>}
                </div>
                <div className="connection-issue-indicator-container">
                    {isHavingConnectionIssuesState ? <ConnectionIssuesIndicator/> : undefined}
                </div>
                {!wasBlockSetState ? undefined :
                    <div
                        className={`block-information-container ${isBlockInformationPanelOpenState ? "block-information-open" : "block-information-closed"}`}>
                        <BlockInformationPanel block={targetBlockState}
                                               onClose={() => setBlockInformationPanelOpenState(false)}/>
                    </div>
                }
            </div>
        </ThemeProvider>
    );
};

const theme = createMuiTheme({
    palette: {
        primary: {
            main: "#ffffff"
        },
        secondary: {
            main: "#000000"
        }
    }
});

const dag = new Dag();

export default App;
