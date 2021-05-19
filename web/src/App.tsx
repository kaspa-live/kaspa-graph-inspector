import './App.css';
import Canvas from "./components/Canvas";
import {createMuiTheme, ThemeProvider} from '@material-ui/core';
import Dag from "./dag/Dag";
import {useState} from "react";
import ConnectionIssuesIndicator from "./components/ConnectionIssuesIndicator";
import TrackButton from "./components/TrackButton";

const App = () => {
    const [isTrackingState, setTrackingState] = useState(true);
    const [isHavingConnectionIssuesState, setHavingConnectionIssuesState] = useState(false);

    dag.setIsTrackingChangedListener(isTracking => setTrackingState(isTracking));
    dag.setIsFetchFailingListener(isFailing => setHavingConnectionIssuesState(isFailing));

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
