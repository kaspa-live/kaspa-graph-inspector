import express from 'express'

const server = express();
server.get('/', (request, response) => {
    response.send("Hello world!");
});

const port = 3001;
server.listen(port, () => {
    console.log(`API server listening on port ${port}...`);
});
