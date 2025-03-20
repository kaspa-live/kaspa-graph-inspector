import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { App, dag } from './App';
import { getParams } from './Params';
import { ThemeTypeConst } from './model/ThemeType';
import { setTheme } from './dag/Theme';
import { updateTheme } from './dag/EdgeSprite';

const target = document.getElementById('kgi-root') as HTMLDivElement | null;
if (target) {
    console.log(target.dataset);
    const defaultParams = { interactive: true, scale: 0.4, theme: ThemeTypeConst.LIGHT };
    const params = getParams(target, defaultParams);
    setTheme(params.theme);
    updateTheme();
    dag.setInteractive(params.interactive);
    dag.setInitialScale(params.scale);
    const root = ReactDOM.createRoot(target!);
    root.render(
        <React.StrictMode>
            <App params={params} />
        </React.StrictMode>
    );
}
