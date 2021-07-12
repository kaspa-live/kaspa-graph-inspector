import {BlocksAndEdgesAndHeightGroups} from "../model/BlocksAndEdgesAndHeightGroups";
import {BlockHashById} from "../model/BlockHashById";
import ApiDataSource from "./ApiDataSource";
import ChainDataSource from "./ChainDataSource";

export default interface DataSource {
    getTickIntervalInMilliseconds: () => number;

    getBlocksBetweenHeights: (startHeight: number, endHeight: number) => Promise<BlocksAndEdgesAndHeightGroups | void>;

    getBlockHash: (targetHash: string, heightDifference: number) => Promise<BlocksAndEdgesAndHeightGroups | void>;

    getHead: (heightDifference: number) => Promise<BlocksAndEdgesAndHeightGroups | void>;

    getBlockHashesByIds: (blockIds: string) => Promise<BlockHashById[] | void>;
};

const resolveDataSource = (): DataSource => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataSource = urlParams.get("dataSource");
    if (dataSource === "chain") {
        return resolveChainDataSource(urlParams);
    }
    return new ApiDataSource();
};

const resolveChainDataSource = (urlParams: URLSearchParams): ChainDataSource => {
    let blockInterval = 1000;
    const blockIntervalString = urlParams.get("blockInterval");
    if (blockIntervalString) {
        const parsedBlockInterval = parseInt(blockIntervalString);
        if (parsedBlockInterval) {
            blockInterval = parsedBlockInterval;
        }
    }
    return new ChainDataSource(blockInterval);
}

export {
    resolveDataSource,
};
