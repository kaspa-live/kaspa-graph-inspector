import './App.css';
import Canvas from "./Canvas";
import Header from "./Header";
import {createMuiTheme, ThemeProvider} from '@material-ui/core';
import Dag from "./dag/Dag";

const App = () => {
    return (
        <ThemeProvider theme={theme}>
            <div className="container">
                <Header dag={dag}/>
                <Canvas dag={dag}/>
            </div>
        </ThemeProvider>
    );
};

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

const dag = new Dag();

export default App;
