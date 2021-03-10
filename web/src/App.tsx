import './App.css';
import Canvas from "./Canvas";
import {useState} from "react";
import Header from "./Header";

const App = () => {
    const [isTrackingState, setTrackingState] = useState(true);
    const [dag, setDag] = useState();

    return (
        <div className="container">
            <Header isTrackingState={isTrackingState} dag={dag}/>
            <Canvas setTrackingState={setTrackingState} setDag={setDag}/>
        </div>
    );
}

export default App;
