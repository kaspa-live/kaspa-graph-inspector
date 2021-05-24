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

    dag.setIsTrackingChangedListener(isTracking => setTrackingState(isTracking));
    dag.setIsFetchFailingListener(isFailing => setHavingConnectionIssuesState(isFailing));
    dag.setTargetBlockChangedListener(targetBlock => setTargetBlockState(targetBlock));

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
                <div className="block-information-container">
                    {targetBlockState ? <BlockInformationPanel block={targetBlockState}/> : undefined}
                </div>
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
