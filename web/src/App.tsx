import './App.css';
import Canvas from "./Canvas";
import {useState} from "react";
import Header from "./Header";
import {createMuiTheme, ThemeProvider} from '@material-ui/core';

const App = () => {
    const [isTrackingState, setTrackingState] = useState(true);
    const [dag, setDag] = useState();

    return (
        <ThemeProvider theme={theme}>
            <div className="container">
                <Header isTrackingState={isTrackingState} dag={dag}/>
                <Canvas setTrackingState={setTrackingState} setDag={setDag}/>
            </div>
        </ThemeProvider>
    );
}

const theme = createMuiTheme({
    palette: {
        primary: {
            main: "#175676"
        },
        secondary: {
            main: "#d62839"
        }
    }
});

export default App;
