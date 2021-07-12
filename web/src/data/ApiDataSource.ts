import DataSource from "./DataSource";
import {BlockHashById} from "../dag/model/BlockHashById";
import {apiAddress} from "../addresses";
import {BlocksAndEdgesAndHeightGroups} from "../dag/model/BlocksAndEdgesAndHeightGroups";

export default class ApiDataSource implements DataSource {
    getBlocksBetweenHeights = (startHeight: number, endHeight: number): Promise<BlocksAndEdgesAndHeightGroups | void> => {
        return this.fetch(`${apiAddress}/blocksBetweenHeights?startHeight=${startHeight}&endHeight=${endHeight}`);
    };

    getBlockHash = (targetHash: string, heightDifference: number): Promise<BlocksAndEdgesAndHeightGroups | void> => {
        return this.fetch(`${apiAddress}/blockHash?blockHash=${targetHash}&heightDifference=${heightDifference}`);
    };

    getHead = (heightDifference: number): Promise<BlocksAndEdgesAndHeightGroups | void> => {
        return this.fetch(`${apiAddress}/head?heightDifference=${heightDifference}`);
    };

    getBlockHashesByIds = (blockIds: string): Promise<BlockHashById[] | void> => {
        return this.fetch(`${apiAddress}/blockHashesByIds?blockIds=${blockIds}`);
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