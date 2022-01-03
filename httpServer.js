const express = require('express');
const bodyParser = require('body-parser');
const { getBlocks, nextBlock, getVersion } = require('./chainedBlock.js');
const { addBlock } = require('./checkValidBlock.js');
const { connectToPeers, getSockets } = require('./p2pServer.js');

const http_port = process.env.HTTP_PORT || 3001;

function initHttpServer() {
    const app = express();
    app.use(bodyParser.json());

    // curl -H "Content-type:application/json"
    //	--data "{\"data\" : [ \"ws://localhost:6002\", \"ws://localhost:6003\" ] }"

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });

    app.post('/addPeers', (req, res) => {
        const data = req.body.data || [];
        connectToPeers(data);
        res.send(data);
    });

    app.get('/peers', (req, res) => {
        let sockInfo = [];

        getSockets().forEach((s) => {
            sockInfo.push(s._socket.remoteAddress + ':' + s._socket.remotePort);
        });
        res.send(sockInfo);
    });

    app.get('/blocks', (req, res) => {
        res.send(getBlocks());
    });

    app.post('/mineBlock', (req, res) => {
        const data = req.body.data || [];
        console.log(data);
        const block = nextBlock(data);
        addBlock(block);

        res.send(block);
    });

    app.get('/version', (req, res) => {
        res.send(getVersion());
    });

    app.get('/stop', (req, res) => {
        res.send({ msg: 'Stop Server!' });
        process.exit();
    });

    app.listen(http_port, () => {
        console.log('Listening Http Port : ' + http_port);
    });
}

initHttpServer();
