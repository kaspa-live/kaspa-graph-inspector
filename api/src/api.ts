import express from 'express';
import Database from "./database.js";

const database = new Database();

const server = express();
server.get('/blocks', async (request, response) => {
    if (!request.query.startTimestamp) {
        response.status(400).send("missing parameter: startTimestamp");
    }
    if (!request.query.endTimestamp) {
        response.status(400).send("missing parameter: endTimestamp");
    }

    try {
        const startTimestamp = parseInt(request.query.startTimestamp as string);
        const endTimestamp = parseInt(request.query.endTimestamp as string);
        const blocks = await database.getBlocks(startTimestamp, endTimestamp)
        response.send(JSON.stringify(blocks));
    }
    catch (error) {
        response.status(400).send(`invalid input: ${error}`);
    }
});

const port = 3001;
server.listen(port, () => {
    console.log(`API server listening on port ${port}...`);
});
