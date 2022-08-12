import DataSource from "./DataSource";
import {BlocksAndEdgesAndHeightGroups} from "../model/BlocksAndEdgesAndHeightGroups";
import {BlockHashById} from "../model/BlockHashById";
import {Block} from "../model/Block";
import {BlockColorConst} from "../model/BlockColor";
import {Edge} from "../model/Edge";
import {HeightGroup} from "../model/HeightGroup";
import {AppConfig, getDefaultAppConfig} from "../model/AppConfig";

export default class ChainDataSource implements DataSource {
    private readonly blockInterval: number;

    constructor(blockInterval: number) {
        this.blockInterval = blockInterval;

        this.createNextBlockAndReschedule();
    }

    private createNextBlockAndReschedule = () => {
        this.createNextBlock();
        window.setTimeout(this.createNextBlockAndReschedule, this.blockInterval)
    }

    private createNextBlock = () => {
        const lastBlock = this.blocks[this.blocks.length - 1];
        const lastBlockId = lastBlock.id;
        const nextBlockId = lastBlockId + 1;
        const nextBlockHash = `${nextBlockId}`.repeat(8);

        this.blocks.push({
            id: nextBlockId,
            blockHash: nextBlockHash,
            timestamp: nextBlockId * this.blockInterval,
            parentIds: [lastBlockId],
            height: nextBlockId,
            daaScore: nextBlockId,
            heightGroupIndex: 0,
            selectedParentId: lastBlockId,
            color: BlockColorConst.BLUE,
            isInVirtualSelectedParentChain: true,
            mergeSetRedIds: [],
            mergeSetBlueIds: [lastBlockId],
        });
        this.edges.push({
            fromBlockId: nextBlockId,
            toBlockId: lastBlockId,
            fromHeight: nextBlockId,
            toHeight: lastBlockId,
            fromHeightGroupIndex: 0,
            toHeightGroupIndex: 0,
        });
        this.heightGroups.push({
            height: nextBlockId,
            size: 1,
        });
        this.blockHashesByIds[nextBlockId] = nextBlockHash;
        this.blockIdsByHashes[nextBlockHash] = nextBlockId;
    }

    getTickIntervalInMilliseconds = (): number => {
        return this.blockInterval;
    };

    getBlocksBetweenHeights = async (startHeight: number, endHeight: number): Promise<BlocksAndEdgesAndHeightGroups | void> => {
        if (startHeight < 0) {
            startHeight = 0;
        }
        if (endHeight > this.blocks.length) {
            endHeight = this.blocks.length;
        }

        const blocks = this.blocks.slice(startHeight, endHeight);
        const edges = this.edges.slice(startHeight, endHeight - 1);
        const heightGroups = this.heightGroups.slice(startHeight, endHeight);
        return {
            blocks: blocks,
            edges: edges,
            heightGroups: heightGroups,
        };
    };

    getBlockHash = async (targetHash: string, heightDifference: number): Promise<BlocksAndEdgesAndHeightGroups | void> => {
        const targetId = this.blockIdsByHashes[targetHash];
        const startHeight = targetId - heightDifference;
        const endHeight = targetId + heightDifference;

        return this.getBlocksBetweenHeights(startHeight, endHeight);
    };

    getBlockDAAScore = async (targetDAAScore: number, heightDifference: number): Promise<BlocksAndEdgesAndHeightGroups | void> => {
        const targetId = this.blockIdsByDAAScores[targetDAAScore];
        const startHeight = targetId - heightDifference;
        const endHeight = targetId + heightDifference;

        return this.getBlocksBetweenHeights(startHeight, endHeight);
    };

    getHead = async (heightDifference: number): Promise<BlocksAndEdgesAndHeightGroups | void> => {
        return this.getBlocksBetweenHeights(this.blocks.length - heightDifference, this.blocks.length);
    };

    getBlockHashesByIds = async (blockIdsString: string): Promise<BlockHashById[] | void> => {
        const blockIdStrings = blockIdsString.split(",");
        const blockHashesByIds: BlockHashById[] = [];
        for (let blockIdString of blockIdStrings) {
            const blockId = parseInt(blockIdString);
            blockHashesByIds.push({
                id: blockId,
                hash: this.blockHashesByIds[blockId],
            });
        }
        return blockHashesByIds;
    };

    getAppConfig = async (): Promise<AppConfig | void> => {
        return getDefaultAppConfig();
    };

    private blocks: Block[] = [
        {
            id: 0,
            blockHash: "00000000",
            timestamp: 0,
            parentIds: [],
            height: 0,
            daaScore: 0,
            heightGroupIndex: 0,
            selectedParentId: null,
            color: BlockColorConst.BLUE,
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

    private blockHashesByIds: { [id: number]: string } = {
        0: "00000000",
    };

    private blockIdsByHashes: { [hash: string]: number } = {
        "00000000": 0,
    };

    private blockIdsByDAAScores: { [daaScore: number]: number } = {
        1: 1,
    };
};
