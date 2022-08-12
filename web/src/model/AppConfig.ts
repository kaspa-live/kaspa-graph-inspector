import { packageVersion } from "../version";

export type AppConfig = {
    kaspadVersion: string,
    processingVersion: string,
    apiVersion: string,
    webVersion: string,
};

export function getDefaultAppConfig(): AppConfig {
    return {
        kaspadVersion: "n/a",
        processingVersion: "n/a",
        apiVersion: "n/a",
        webVersion: packageVersion,
    };
}

export function areAppConfigsEqual(left: AppConfig, right: AppConfig): boolean {
    return left.kaspadVersion === right.kaspadVersion
        && left.processingVersion === right.processingVersion
        && left.apiVersion === right.apiVersion
        && left.webVersion === right.webVersion;
}
 