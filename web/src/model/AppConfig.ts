import { packageVersion } from "../version";

export type AppConfig = {
    kaspadVersion: string,
    processingVersion: string,
    network: string,
    apiVersion: string,
    webVersion: string,
};

export function getDefaultAppConfig(): AppConfig {
    return {
        kaspadVersion: "n/a",
        processingVersion: "n/a",
        network: "n/a",
        apiVersion: "n/a",
        webVersion: packageVersion,
    };
}

export function areAppConfigsEqual(left: AppConfig, right: AppConfig): boolean {
    return left.kaspadVersion === right.kaspadVersion
        && left.processingVersion === right.processingVersion
        && left.network === right.network
        && left.apiVersion === right.apiVersion
        && left.webVersion === right.webVersion;
}

export function isTestnet(appConfig: AppConfig): boolean {
    return appConfig.network.startsWith("kaspa-testnet");
}

export function isMainnet(appConfig: AppConfig): boolean {
    return appConfig.network === "kaspa-mainnet";
}
