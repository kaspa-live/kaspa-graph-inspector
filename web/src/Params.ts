import { parseBoolean, parseNumber } from './common/tools';

export type Params = {
    interactive: boolean,
    scale: number,
}

export function getParams(target: HTMLDivElement, defaultValues: Params): Params {
    const interactive = parseUrlParamInteractive(parseBoolean(target.dataset[InteractiveParamName], defaultValues.interactive));
    const scale = parseUrlParamScale(parseNumber(target.dataset[ScaleParamName], defaultValues.scale));
    return {
        interactive: interactive,
        scale: scale
    }
}

const InteractiveParamName = "interactive";
const ScaleParamName = "scale";

function parseUrlParamInteractive(defaultValue: boolean): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    const interactiveParam = urlParams.get(InteractiveParamName)
    if (interactiveParam) {
        console.log("Found interactive parameter =", interactiveParam);
        const interactive = JSON.parse(interactiveParam.trim().toLowerCase());
        urlParams.delete(InteractiveParamName);
        window.history.replaceState(null, "", `?${urlParams}`);
        if (typeof interactive == "boolean") {
            console.log("Using interactive", interactive);
            return interactive;
        }
    }
    console.log("No interactive parameter, using default value", defaultValue);
    return defaultValue;
}

function parseUrlParamScale(defaultValue: number): number {
    const urlParams = new URLSearchParams(window.location.search);
    const scaleParam = urlParams.get(ScaleParamName)
    if (scaleParam) {
        console.log("Found scale parameter =", scaleParam);
        const scale = parseFloat(scaleParam);
        urlParams.delete(ScaleParamName);
        window.history.replaceState(null, "", `?${urlParams}`);
        if (!isNaN(scale)) {
            console.log("Using scale", scale);
            return scale;
        }
    }
    console.log("No scale parameter, using default value", defaultValue);
    return defaultValue;
}

