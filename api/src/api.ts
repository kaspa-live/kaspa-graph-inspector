import express from 'express';
import Database from "./database.js";
import cors from 'cors';

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

const port = 3001;
server.listen(port, () => {
    console.log(`API server listening on port ${port}...`);
});
