import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value) {
        return JSON.parse(value);
    }
    return defaultValue;
}

function parseNumber(value: string | undefined, defaultValue: number): number {
    if (value) {
        return JSON.parse(value);
    }
    return defaultValue;
}

const target = document.getElementById('kgi-root') as HTMLDivElement | null;
if (target) {
    console.log(target.dataset);
    const interactive = parseBoolean(target.dataset["interactive"], false);
    const scale = parseNumber(target.dataset["scale"], 0.4);
    console.log(scale);
    const root = ReactDOM.createRoot(target!);
    root.render(
        <React.StrictMode>
            <App interactive={interactive} scale={scale}/>
        </React.StrictMode>
    );
}
