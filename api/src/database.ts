import pg from "pg";
import {Block, BlocksAndEdgesAndHeightGroups, Edge, HeightGroup} from "./model";

export default class Database {
    private client: pg.Client;

    constructor() {
        this.client = new pg.Client();
        this.client.connect();
    }

    getBlocksAndEdgesAndHeightGroups = async (startHeight: number, endHeight: number): Promise<BlocksAndEdgesAndHeightGroups> => {
        const blocks = await this.getBlocks(startHeight, endHeight);
        const edges = await this.getEdges(startHeight, endHeight);

        const heights: number[] = [];
        const heightsMap: { [height: number]: boolean } = {};
        const addHeight = (height: number) => {
            if (!heightsMap[height]) {
                heightsMap[height] = true;
                heights.push(height);
            }
        };
        for (let block of blocks) {
            addHeight(block.height);
        }
        for (let edge of edges) {
            addHeight(edge.fromHeight);
            addHeight(edge.toHeight);
        }
        const heightGroups = await this.getHeightGroups(heights);

        return {
            blocks: blocks,
            edges: edges,
            heightGroups: heightGroups,
        };
    }

    getBlocks = async (startHeight: number, endHeight: number): Promise<Block[]> => {
        const result = await this.client.query('SELECT * FROM blocks ' +
            'WHERE height >= $1 AND height <= $2 ' +
            'ORDER BY height',
            [startHeight, endHeight]);

        return result.rows.map(item => {
            return {
                id: parseInt(item.id),
                blockHash: item.block_hash,
                timestamp: parseInt(item.timestamp),
                parentIds: item.parent_ids,
                height: parseInt(item.height),
                heightGroupIndex: parseInt(item.height_group_index),
                selectedParentId: item.selected_parent_id ? parseInt(item.selected_parent_id) : null,
                color: item.color,
                isInVirtualSelectedParentChain: item.is_in_virtual_selected_parent_chain,
            };
        });
    }

    getEdges = async (startHeight: number, endHeight: number): Promise<Edge[]> => {
        const result = await this.client.query('SELECT * FROM edges ' +
            'WHERE from_height >= $1 AND to_height <= $2 ' +
            'ORDER BY to_height',
            [startHeight, endHeight]);

        return result.rows.map(item => {
            return {
                fromBlockId: parseInt(item.from_block_id),
                toBlockId: parseInt(item.to_block_id),
                fromHeight: parseInt(item.from_height),
                toHeight: parseInt(item.to_height),
                fromHeightGroupIndex: parseInt(item.from_height_group_index),
                toHeightGroupIndex: parseInt(item.to_height_group_index),
            };
        });
    }

    getMaxHeight = async (): Promise<number> => {
        const result = await this.client.query('SELECT MAX(height) AS max_height FROM blocks');
        if (result.rows.length === 0) {
            return 0;
        }
        return parseInt(result.rows[0].max_height);
    }

    getBlockHeight = async (blockHash: string): Promise<number> => {
        const result = await this.client.query('SELECT height FROM blocks ' +
            'WHERE block_hash = $1', [blockHash]);
        if (result.rows.length === 0) {
            throw new Error(`Block ${blockHash} does not exist`);
        }
        return parseInt(result.rows[0].height);
    }

    getHeightGroups = async (heights: number[]): Promise<HeightGroup[]> => {
        const result = await this.client.query('SELECT * FROM height_groups ' +
            'WHERE height = ANY ($1)', [heights]);

        return result.rows.map(item => {
            return {
                height: parseInt(item.height),
                size: parseInt(item.size),
            };
        });
    }
}
