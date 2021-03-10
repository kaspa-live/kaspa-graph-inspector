import express from 'express';
import Database from "./database.js";
import cors from 'cors';

const port = process.env.API_PORT;
if (!port) {
    console.log("The API_PORT environment variable is required");
    process.exit(1);
}

const database = new Database();

const server = express();
server.use(cors());

server.get('/blocksBetweenHeights', async (request, response) => {
    if (!request.query.startHeight) {
        response.status(400).send("missing parameter: startHeight");
        return;
    }
    if (!request.query.endHeight) {
        response.status(400).send("missing parameter: endHeight");
        return;
    }

    try {
        const startHeight = parseInt(request.query.startHeight as string);
        const endHeight = parseInt(request.query.endHeight as string);
        const blocks = await database.getBlocks(startHeight, endHeight)
        response.send(JSON.stringify(blocks));
        return;
    } catch (error) {
        response.status(400).send(`invalid input: ${error}`);
        return;
    }
});

server.get('/head', async (request, response) => {
    if (!request.query.heightDifference) {
        response.status(400).send("missing parameter: heightDifference");
        return;
    }

    try {
        const heightDifference = parseInt(request.query.heightDifference as string);
        const endHeight = await database.getMaxHeight();
        let startHeight = endHeight - heightDifference;
        if (startHeight < 0) {
            startHeight = 0;
        }
        const blocks = await database.getBlocks(startHeight, endHeight);
        response.send(JSON.stringify(blocks));
        return;
    } catch (error) {
        response.status(400).send(`invalid input: ${error}`);
        return;
    }
});

server.get('/blockHash', async (request, response) => {
    if (!request.query.blockHash) {
        response.status(400).send("missing parameter: blockHash");
        return;
    }
    if (!request.query.heightDifference) {
        response.status(400).send("missing parameter: heightDifference");
        return;
    }

    try {
        const height = await database.getBlockHeight(request.query.blockHash as string);
        const heightDifference = parseInt(request.query.heightDifference as string);
        let startHeight = height - heightDifference;
        if (startHeight < 0) {
            startHeight = 0;
        }
        const endHeight = height + heightDifference;
        const blocks = await database.getBlocks(startHeight, endHeight);
        response.send(JSON.stringify(blocks));
        return;
    } catch (error) {
        response.status(400).send(`invalid input: ${error}`);
        return;
    }
});

server.listen(port, () => {
    console.log(`API server listening on port ${port}...`);
});
