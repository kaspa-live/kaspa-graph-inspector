import pg from "pg";

export default class Database {
    private client: pg.Client;

    constructor() {
        this.client = new pg.Client();
        this.client.connect();
    }

    async getBlocks(startHeight: number, endHeight: number): Promise<Block[]> {
        const result = await this.client.query('SELECT * FROM blocks ' +
            'WHERE height >= $1 AND height < $2 ' +
            'ORDER BY height',
            [startHeight, endHeight]);

        return result.rows.map(item => {
            return {
                id: parseInt(item.id),
                blockHash: item.block_hash,
                timestamp: parseInt(item.timestamp),
                parentIds: item.parent_ids,
                height: parseInt(item.height),
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
}

export type Block = {
    id: number,
    blockHash: string,
    timestamp: number,
    parentIds: number[],
    height: number
};
