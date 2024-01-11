import pg from "pg";
import {AppConfig, Block, BlockHashById, BlocksAndEdgesAndHeightGroups, Edge, HeightGroup} from "./model";
import { packageVersion } from "./version.js";

/* database environment. */
const postgres_user = process.env.POSTGRES_USER;
const postgres_password = process.env.POSTGRES_PASSWORD;
const postgres_host = process.env.POSTGRES_HOST ?? "localhost";
const postgres_port = process.env.POSTGRES_PORT ?? "5432";
const postgres_database = process.env.POSTGRES_DB;

/* missing check. */
if (!postgres_user) {
    console.log("The POSTGRES_USER environment variable is required");
    process.exit(1);
}
if (!postgres_password) {
    console.log("The POSTGRES_PASSWORD environment variable is required");
    process.exit(1);
}
if (!postgres_database) {
    console.log("The POSTGRES_DB environment variable is required");
    process.exit(1);
}

export default class Database {
    private pool: pg.Pool;

    constructor() {
        this.pool = new pg.Pool({
            user: postgres_user,
            password: postgres_password,
            host: postgres_host,
            port: parseInt(postgres_port),
            database: postgres_database,
        });
    }

    withClient = async (func: (client: pg.PoolClient) => Promise<void>) => {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ');
            await func(client);
        } catch (error) {
            throw error
        } finally {
            await client.query('ROLLBACK');
            client.release();
        }
    }

    getBlocksAndEdgesAndHeightGroups = async (client: pg.PoolClient, startHeight: number, endHeight: number): Promise<BlocksAndEdgesAndHeightGroups> => {
        const blocks = await this.getBlocks(client, startHeight, endHeight);
        const edges = await this.getEdges(client, startHeight, endHeight);

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
        const heightGroups = await this.getHeightGroups(client, heights);

        return {
            blocks: blocks,
            edges: edges,
            heightGroups: heightGroups,
        };
    }

    private getBlocks = async (client: pg.PoolClient, startHeight: number, endHeight: number): Promise<Block[]> => {
        const result = await client.query('SELECT * FROM blocks ' +
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
                daaScore: parseInt(item.daa_score),
                heightGroupIndex: parseInt(item.height_group_index),
                selectedParentId: item.selected_parent_id ? parseInt(item.selected_parent_id) : null,
                color: item.color,
                isInVirtualSelectedParentChain: item.is_in_virtual_selected_parent_chain,
                mergeSetRedIds: item.merge_set_red_ids,
                mergeSetBlueIds: item.merge_set_blue_ids,
            };
        });
    }

    private getEdges = async (client: pg.PoolClient, startHeight: number, endHeight: number): Promise<Edge[]> => {
        const result = await client.query('SELECT * FROM edges ' +
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

    private getHeightGroups = async (client: pg.PoolClient, heights: number[]): Promise<HeightGroup[]> => {
        const result = await client.query('SELECT * FROM height_groups ' +
            'WHERE height = ANY ($1)', [heights]);

        return result.rows.map(item => {
            return {
                height: parseInt(item.height),
                size: parseInt(item.size),
            };
        });
    }

    getMaxHeight = async (client: pg.PoolClient): Promise<number> => {
        const result = await client.query('SELECT MAX(height) AS max_height FROM blocks');
        if (result.rows.length === 0) {
            return 0;
        }
        return parseInt(result.rows[0].max_height);
    }

    getBlockHeight = async (client: pg.PoolClient, blockHash: string): Promise<number> => {
        const result = await client.query('SELECT height FROM blocks ' +
            'WHERE block_hash = $1', [blockHash]);
        if (result.rows.length === 0) {
            throw new Error(`Block ${blockHash} does not exist`);
        }
        return parseInt(result.rows[0].height);
    }

    getBlockHashesByIds = async (client: pg.PoolClient, blockIds: number[]): Promise<BlockHashById[]> => {
        const result = await client.query('SELECT id, block_hash FROM blocks ' +
            'WHERE id = ANY ($1)', [blockIds]);

        return result.rows.map(item => {
            return {
                id: parseInt(item.id),
                hash: item.block_hash,
            };
        });
    }

    getBlockDAAScoreHeight = async (client: pg.PoolClient, daaScore: number): Promise<number> => {
      const result = await client.query('SELECT height FROM blocks ' +
          'ORDER BY ABS(daa_score-($1)) LIMIT 1', [daaScore]);
      if (result.rows.length === 0) {
          throw new Error(`DAA scores ${daaScore} do not exist`);
      }
      return parseInt(result.rows[0].height);
    }

    getAppConfig = async (client: pg.PoolClient): Promise<AppConfig> => {
      const result = await client.query('SELECT * FROM app_config');
      if (result.rows.length === 0) {
        return {
            kaspadVersion: "",
            processingVersion: "",
            network: "",
            apiVersion: "",
        }
      }
      return {
        kaspadVersion: result.rows[0].kaspad_version,
        processingVersion: result.rows[0].processing_version,
        network:  result.rows[0].network,
        apiVersion: packageVersion,
      };
    }
}
