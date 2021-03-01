import './App.css';
import Canvas from "./Canvas";

const App = () => {
    return (
        <div className="container">
            <Canvas/>
            <div className="header">
                <div className="logo"/>
                <div className="title">kaspa-dag-visualizer</div>
            </div>
        </div>
    );
}

export default App;
