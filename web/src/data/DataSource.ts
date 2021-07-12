import {BlocksAndEdgesAndHeightGroups} from "../dag/model/BlocksAndEdgesAndHeightGroups";
import {BlockHashById} from "../dag/model/BlockHashById";

export default interface DataSource {
    blocksBetweenHeights: (startHeight: number, endHeight: number) => Promise<BlocksAndEdgesAndHeightGroups | void>;

    blockHash: (targetHash: string, heightDifference: number) => Promise<BlocksAndEdgesAndHeightGroups | void>;

    head: (heightDifference: number) => Promise<BlocksAndEdgesAndHeightGroups | void>;

    blockHashesByIds: (blockIds: string) => Promise<BlockHashById[] | void>;
};
