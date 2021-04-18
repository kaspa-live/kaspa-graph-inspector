import pg from "pg";

export default class Database {
    private client: pg.Client;

    constructor() {
        this.client = new pg.Client();
        this.client.connect();
    }

    async getBlocksAndEdges(startHeight: number, endHeight: number): Promise<BlocksAndEdges> {
        const blocks = await this.getBlocks(startHeight, endHeight);
        const edges = await this.getEdges(startHeight, endHeight);
        return {
            blocks: blocks,
            edges: edges,
        }
    }

    async getBlocks(startHeight: number, endHeight: number): Promise<Block[]> {
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

    async getEdges(startHeight: number, endHeight: number): Promise<Edge[]> {
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

    async getMaxHeight(): Promise<number> {
        const result = await this.client.query('SELECT MAX(height) AS max_height FROM blocks');
        if (result.rows.length === 0) {
            return 0;
        }
        return parseInt(result.rows[0].max_height);
    }

    async getBlockHeight(blockHash: string): Promise<number> {
        const result = await this.client.query('SELECT height FROM blocks ' +
            'WHERE block_hash = $1', [blockHash])
        if (result.rows.length === 0) {
            throw new Error(`Block ${blockHash} does not exist`);
        }
        return parseInt(result.rows[0].height);
    }
}

export type BlocksAndEdges = {
    blocks: Block[],
    edges: Edge[],
}

export type Block = {
    id: number,
    blockHash: string,
    timestamp: number,
    parentIds: number[],
    height: number,
    heightGroupIndex: number,
    selectedParentId: number | null,
    color: string,
    isInVirtualSelectedParentChain: boolean,
};

export type Edge = {
    fromBlockId: number,
    toBlockId: number,
    fromHeight: number,
    toHeight: number,
    fromHeightGroupIndex: number,
    toHeightGroupIndex: number,
}
