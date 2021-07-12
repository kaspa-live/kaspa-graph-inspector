import DataSource from "./DataSource";
import {BlocksAndEdgesAndHeightGroups} from "../dag/model/BlocksAndEdgesAndHeightGroups";
import {BlockHashById} from "../dag/model/BlockHashById";
import {Block} from "../dag/model/Block";
import {BlockColor} from "../dag/model/BlockColor";
import {Edge} from "../dag/model/Edge";
import {HeightGroup} from "../dag/model/HeightGroup";

export default class TestDataSource implements DataSource {
    getBlocksBetweenHeights = async (startHeight: number, endHeight: number): Promise<BlocksAndEdgesAndHeightGroups | void> => {
        return this.blocksAndEdgesAndHeightGroups;
    };

    getBlockHash = async (targetHash: string, heightDifference: number): Promise<BlocksAndEdgesAndHeightGroups | void> => {
        return this.blocksAndEdgesAndHeightGroups;
    };

    getHead = async (heightDifference: number): Promise<BlocksAndEdgesAndHeightGroups | void> => {
        return this.blocksAndEdgesAndHeightGroups;
    };

    getBlockHashesByIds = async (blockIds: string): Promise<BlockHashById[] | void> => {
        return this.blockHashesByIds;
    };

    private blocks: Block[] = [
        {
            id: 0,
            blockHash: "0",
            timestamp: 0,
            parentIds: [],
            height: 0,
            heightGroupIndex: 0,
            selectedParentId: null,
            color: BlockColor.BLUE,
            isInVirtualSelectedParentChain: true,
            mergeSetRedIds: [],
            mergeSetBlueIds: [],
        },
    ];

    private edges: Edge[] = [];

    private heightGroups: HeightGroup[] = [
        {
            height: 0,
            size: 1,
        },
    ];

    private blocksAndEdgesAndHeightGroups: BlocksAndEdgesAndHeightGroups = {
        blocks: this.blocks,
        edges: this.edges,
        heightGroups: this.heightGroups,
    };

    private blockHashesByIds: BlockHashById[] = [
        {
            id: 0,
            hash: "0",
        },
    ];
};
