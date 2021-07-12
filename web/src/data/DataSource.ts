import {BlocksAndEdgesAndHeightGroups} from "../dag/model/BlocksAndEdgesAndHeightGroups";
import {BlockHashById} from "../dag/model/BlockHashById";
import TestDataSource from "./TestDataSource";
import ApiDataSource from "./ApiDataSource";

export default interface DataSource {
    getBlocksBetweenHeights: (startHeight: number, endHeight: number) => Promise<BlocksAndEdgesAndHeightGroups | void>;

    getBlockHash: (targetHash: string, heightDifference: number) => Promise<BlocksAndEdgesAndHeightGroups | void>;

    getHead: (heightDifference: number) => Promise<BlocksAndEdgesAndHeightGroups | void>;

    getBlockHashesByIds: (blockIds: string) => Promise<BlockHashById[] | void>;
};

const resolveDataSource = (): DataSource => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataSource = urlParams.get("dataSource");
    if (dataSource) {
        return new TestDataSource();
    }
    return new ApiDataSource();
};

export {
    resolveDataSource,
};
