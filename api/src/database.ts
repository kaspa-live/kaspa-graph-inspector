import pg from "pg";

export default class Database {
    private client: pg.Client;

    constructor() {
        this.client = new pg.Client();
        this.client.connect();
    }

    async getBlocks(startTimestamp: number, endTimestamp: number): Promise<Block[]> {
        const result = await this.client.query('SELECT * FROM blocks ' +
            'WHERE "timestamp" >= $1 AND "timestamp" < $2 ' +
            'ORDER BY height',
            [startTimestamp, endTimestamp]);

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
}

export type Block = {
    id: number,
    blockHash: string,
    timestamp: number,
    parentIds: number[],
    height: number
};
