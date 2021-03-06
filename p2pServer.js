const p2p_port = process.env.P2P_PORT || 6001

const WebSocket = require("ws");
const { getLastBlock, createHash, addBlock } = require("./chainedBlock");

function initP2PServer(test_port){
	const server = new WebSocket.Server({port:test_port})
	//console.log(server);
	server.on("connection", (ws)=>{ initConnection(ws);})
	console.log("Listening webSocket port : " + test_port)
}

initP2PServer(6001);
initP2PServer(6002);
initP2PServer(6003);

let sockets = []

function initConnection(ws){
	//console.log(ws._socket.remotePort)
	sockets.push(ws)
	initMessageHandler(ws)
	initErrorHandler(ws)
}

function getSockets(){
	return sockets;
}

function write(ws, message){
	ws.send(JSON.stringify(message))
}

function broadcast(message){
	sockets.forEach(
		// function (socket) {
		// 	write(socket, message);
		// }
		(socket)=>{
			write(socket, message);
		}
	)
}

function connectToPeers(newPeers){
	newPeers.forEach(
		(peer)=>{			
			const ws = new WebSocket(peer)
			console.log(ws);
			ws.on("open", ()=>{ console.log("open"); initConnection(ws); })
			ws.on("error", (errorType)=>{ console.log("connetion Failed!" + errorType)})
		}
	)
}

// Message Handler
const MessageType = {
	QUERY_LATEST:0,
	QUERY_ALL:1,
	RESPONSE_BLOCKCHAIN:2
}

function initMessageHandler(ws){
	ws.on("message", (data)=>{
		const message = JSON.parse(data)

		switch(message.type){
			case MessageType.QUERY_LATEST:
				write(ws, responseLatestMsg());
				break;
			case MessageType.QUERY_ALL:
				write(ws, responseAllChainMsg());
				break;
			case MessageType.RESPONSE_BLOCKCHAIN:
				handleBlockChainResponse(message);
				break;
		}
	})
}

function responseLatestMsg() {
	return ({
		"type": RESPONSE_BLOCKCHAIN,
		"data": JSON.stringify([getLastBlock()])
	})
}

function responseAllChainMsg() {
	return ({
		"type": RESPONSE_BLOCKCHAIN,
		"data": JSON.stringify(getBlocks())
	})
}

function handleBlockChainResponse(message) {
	const receiveBlocks = JSON.parse(message.data)
	const latestReceiveBlock = receiveBlocks[receiveBlocks.length - 1]
	const latesMyBlock = getLastBlock()

	// ???????????? ?????? ?????? ?????? ????????? ????????? ???????????? 
	// ?????? ?????? ?????? ????????? ????????? ??????????????? ??? ??? / ?????? ???
	if (latestReceiveBlock.header.index > latesMyBlock.header.index){
		// ?????? ????????? ????????? ?????? ???????????? ??? ????????? ????????? ???
		if (createHash(latesMyBlock) === latestReceiveBlock.header.previousHash){
			if (addBlock(latestReceiveBlock)){
				broadcast(responseLatestMsg())
			}
			else{
				console.log("Invalid Block!!")
			}
		}
		// ?????? ????????? ?????? ????????? 1??? ???
		else if (receiveBlocks.length === 1){
			broadcast(queryAllMsg())
		}
		else{
			replaceChain(receiveBlocks)
		}
	}
	else{
		console.log("Do nothing.");
	}
}

function queryAllMsg(){
	return ({
		"type": QUERY_ALL,
		"data": null
	})
}

function queryLatestMsg(){
	return ({
		"type": QUERY_LATEST,
		"data": null
	})	
}

function initErrorHandler(ws){
	ws.on("close", ()=>{ closeConnection(ws); })
	ws.on("error", ()=>{ closeConnection(ws); })
}

function closeConnection(ws){
	console.log(`Connection close ${ws.url}`)
	sockets.splice(sockets.indexOf(ws), 1)
}

module.exports={
	connectToPeers, getSockets
}
