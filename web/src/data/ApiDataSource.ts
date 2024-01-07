import DataSource from "./DataSource";
import {BlockHashById} from "../model/BlockHashById";
import {apiAddress} from "../addresses";
import {BlocksAndEdgesAndHeightGroups} from "../model/BlocksAndEdgesAndHeightGroups";
import {AppConfig} from "../model/AppConfig";
import {packageVersion} from "../version";

export default class ApiDataSource implements DataSource {
    getTickIntervalInMilliseconds = (): number => {
        return 50;
    };

    getBlocksBetweenHeights = (startHeight: number, endHeight: number): Promise<BlocksAndEdgesAndHeightGroups | void> => {
        return this.fetch(`${apiAddress}/blocksBetweenHeights?startHeight=${startHeight}&endHeight=${endHeight}`);
    };

    getBlockHash = (targetHash: string, heightDifference: number): Promise<BlocksAndEdgesAndHeightGroups | void> => {
        return this.fetch(`${apiAddress}/blockHash?blockHash=${targetHash}&heightDifference=${heightDifference}`);
    };

    getBlockDAAScore = (targetDAAScore: number, heightDifference: number): Promise<BlocksAndEdgesAndHeightGroups | void> => {
        return this.fetch(`${apiAddress}/blockDAAScore?blockDAAScore=${targetDAAScore}&heightDifference=${heightDifference}`);
    };

    getHead = (heightDifference: number): Promise<BlocksAndEdgesAndHeightGroups | void> => {
        return this.fetch(`${apiAddress}/head?heightDifference=${heightDifference}`);
    };

    getBlockHashesByIds = (blockIds: string): Promise<BlockHashById[] | void> => {
        return this.fetch(`${apiAddress}/blockHashesByIds?blockIds=${blockIds}`);
    };

    getAppConfig = (): Promise<AppConfig | void> => {
        return this.fetch<AppConfig>(`${apiAddress}/appConfig`)
            .then(config => {
                if (config) {
                    (config as AppConfig).webVersion = packageVersion;
                }
                return config;
            });
    };

    private fetch = async <T>(url: string): Promise<T | void> => {
        const response = await fetch(url)
            .catch(_ => {
                // Do nothing
            })
            .then(response => {
                return response;
            });
        if (!response) {
            return Promise.resolve();
        }
        return response.json();
    };
}