import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { App, dag } from './App';
import { getParams } from './Params';

const target = document.getElementById('kgi-root') as HTMLDivElement | null;
if (target) {
    console.log(target.dataset);
    const params = getParams(target, { interactive: true, scale: 0.4 });
    dag.setInteractive(params.interactive);
    dag.setInitialScale(params.scale);
    const root = ReactDOM.createRoot(target!);
    root.render(
        <React.StrictMode>
            <App interactive={params.interactive} />
        </React.StrictMode>
    );
}
