import {BlocksAndEdgesAndHeightGroups} from "../model/BlocksAndEdgesAndHeightGroups";
import {BlockHashById} from "../model/BlockHashById";
import {AppConfig} from "../model/AppConfig";
import ApiDataSource from "./ApiDataSource";
import ChainDataSource from "./ChainDataSource";
import ReplayDataSource, {buildReplayDataSource} from "./ReplayDataSource";

export default interface DataSource {
    getTickIntervalInMilliseconds: () => number;

    getBlocksBetweenHeights: (startHeight: number, endHeight: number) => Promise<BlocksAndEdgesAndHeightGroups | void>;

    getBlockHash: (targetHash: string, heightDifference: number) => Promise<BlocksAndEdgesAndHeightGroups | void>;

    getBlockDAAScore: (targetDAAScore: number, heightDifference: number) => Promise<BlocksAndEdgesAndHeightGroups | void>;

    getHead: (heightDifference: number) => Promise<BlocksAndEdgesAndHeightGroups | void>;

    getBlockHashesByIds: (blockIds: string) => Promise<BlockHashById[] | void>;

    getAppConfig: () => Promise<AppConfig | void>;
};

const resolveDataSource = (): Promise<DataSource> => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataSource = urlParams.get("dataSource");
    switch (dataSource) {
        case "chain":
            return resolveChainDataSource(urlParams);
        case "replay":
            return resolveReplayDataSource(urlParams);
        default:
            return Promise.resolve(new ApiDataSource());
    }
};

const resolveChainDataSource = (urlParams: URLSearchParams): Promise<ChainDataSource> => {
    let blockInterval = 1000;
    const blockIntervalString = urlParams.get("blockInterval");
    if (blockIntervalString) {
        const parsedBlockInterval = parseInt(blockIntervalString);
        if (parsedBlockInterval) {
            blockInterval = parsedBlockInterval;
        }
    }
    return Promise.resolve(new ChainDataSource(blockInterval));
}

const resolveReplayDataSource = async (urlParams: URLSearchParams): Promise<ReplayDataSource> => {
    const name = urlParams.get("name");
    return buildReplayDataSource(name);
}

export {
    resolveDataSource,
};
