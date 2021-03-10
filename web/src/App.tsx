import './App.css';
import Canvas from "./Canvas";
import {useState} from "react";
import Header from "./Header";

const App = () => {
    const [appState, setAppState] = useState(newAppState())

    return (
        <div className="container">
            <Header appState={appState} setAppState={setAppState}/>
            <Canvas appState={appState} setAppState={setAppState}/>
        </div>
    );
}

export type AppState = {
    isTracking: boolean,
};

const newAppState = (): AppState => {
    return {
        isTracking: true,
    };
}

export default App;
