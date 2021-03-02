import express from 'express';
import Database from "./database.js";

const database = new Database();

const server = express();
server.get('/', async (request, response) => {
    const blocks = await database.getBlocks()
    response.send(JSON.stringify(blocks));
});

const port = 3001;
server.listen(port, () => {
    console.log(`API server listening on port ${port}...`);
});
