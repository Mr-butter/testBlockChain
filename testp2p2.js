const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:6002');

ws.on('open', () => {
    ws.send('6002연결');
});

ws.on('message', (message) => {
    console.log(`received:${message}`);
});
