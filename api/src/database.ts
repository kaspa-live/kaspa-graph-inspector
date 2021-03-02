import pg from "pg";

export default class Database {
    private client: pg.Client;

    constructor() {
        this.client = new pg.Client();
        this.client.connect();
    }

    async getBlocks(): Promise<Block[]> {
        const result = await this.client.query("SELECT id FROM blocks ORDER BY height LIMIT 100");
        return result.rows.map(item => {
            return {
                id: parseInt(item.id),
            };
        });
    }
}

export type Block = {
    id: number
};
