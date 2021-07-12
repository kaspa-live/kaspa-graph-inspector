import {BlocksAndEdgesAndHeightGroups} from "../model/BlocksAndEdgesAndHeightGroups";
import {BlockHashById} from "../model/BlockHashById";
import ApiDataSource from "./ApiDataSource";
import ChainDataSource from "./ChainDataSource";
import ReplayDataSource from "./ReplayDataSource";
import {test} from "./replay/test";
import {replay} from "./replay/replay";

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
    switch (dataSource) {
        case "chain":
            return resolveChainDataSource(urlParams);
        case "replay":
            return resolveReplayDataSource(urlParams);
        default:
            return new ApiDataSource();
    }
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

const resolveReplayDataSource = (urlParams: URLSearchParams): ReplayDataSource => {
    const name = urlParams.get("name");
    if (name) {
        const replayData = replay[name];
        if (replayData) {
            return new ReplayDataSource(replayData);
        }
    }
    return new ReplayDataSource(test);
}

export {
    resolveDataSource,
};
