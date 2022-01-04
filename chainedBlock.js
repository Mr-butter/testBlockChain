const fs = require("fs");
const merkle = require("merkle");
const cryptojs = require("crypto-js");
const random = require("random");

const BLOCK_GENERATION_INTERVAL = 10; //단위시간 초
const DIIFFICULTY_ADJUSTMENT_INTERVAL = 10;

class Block {
    constructor(header, body) {
        this.header = header;
        this.body = body;
    }
}

class BlockHeader {
    constructor(
        version,
        index,
        previousHash,
        timestamp,
        merkleRoot,
        difficulty,
        nonce
    ) {
        this.version = version;
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.merkleRoot = merkleRoot;
        this.difficulty = difficulty;
        this.nonce = nonce;
    }
}

function getVersion() {
    const package = fs.readFileSync("package.json");
    //console.log(JSON.parse(package).version)
    return JSON.parse(package).version;
}

//getVersion()

function createGenesisBlock() {
    const version = getVersion();
    const index = 0;
    const previousHash = "0".repeat(64);
    // const timestamp = 1231006505; // 2009/01/03 6:15pm (UTC)
    const timestamp = parseInt(Date.now() / 1000);

    const body = [
        "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks",
    ];
    const tree = merkle("sha256").sync(body);
    const merkleRoot = tree.root() || "0".repeat(64);
    const difficulty = 0;
    const nonce = 0;

    //console.log("version : %s, timestamp : %d, body : %s", version, timestamp, body)
    //console.log("previousHash : %d", previousHash)
    //console.log("tree : ")
    //console.log(tree)
    //console.log("merkleRoot : %d", merkleRoot.toString('hex'))

    const header = new BlockHeader(
        version,
        index,
        previousHash,
        timestamp,
        merkleRoot,
        difficulty,
        nonce
    );
    return new Block(header, body);
}

//const block = createGenesisBlock()
//console.log(block)

let Blocks = [createGenesisBlock()];

function getBlocks() {
    return Blocks;
}

function getLastBlock() {
    return Blocks[Blocks.length - 1];
}

function createHash(block) {
    const {
        version,
        index,
        previousHash,
        timestamp,
        merkleRoot,
        difficulty,
        nonce,
    } = block.header;
    const blockString =
        version +
        index +
        previousHash +
        timestamp +
        merkleRoot +
        difficulty +
        nonce;
    const hash = cryptojs.SHA256(blockString).toString();
    return hash;
}

function calculateHash(
    version,
    index,
    previousHash,
    timestamp,
    merkleRoot,
    difficulty,
    nonce
) {
    const blockString =
        version +
        index +
        previousHash +
        timestamp +
        merkleRoot +
        difficulty +
        nonce;
    const hash = cryptojs.SHA256(blockString).toString();
    return hash;
}

const genesisBlock = createGenesisBlock();
//const testHash = createHash(block)
// console.log(genesisBlock);

function nextBlock(bodyData) {
    const prevBlock = getLastBlock();

    const version = getVersion();
    const index = prevBlock.header.index + 1;
    const previousHash = createHash(prevBlock);
    const timestamp = parseInt(Date.now() / 1000);
    const tree = merkle("sha256").sync(bodyData);
    const merkleRoot = tree.root() || "0".repeat(64);
    const difficulty = getDifficulty(getBlocks());
    //const nonce = 0

    const header = findBlock(
        version,
        index,
        previousHash,
        timestamp,
        merkleRoot,
        difficulty
    );

    return new Block(header, bodyData);
}

//const block1 = nextBlock(["tranjactio1"])
//console.log(block1)

// function addBlock(bodyData){
// 	const newBlock = nextBlock(bodyData)
// 	Blocks.push(newBlock)
// }

function replaceChain(newBlocks) {
    if (isValidChain(newBlocks)) {
        if (
            newBlocks.length > Blocks.length ||
            (newBlocks.length === Blocks.length && random.boolean())
        ) {
            Blocks = newBlocks;
            broadcast(responseLatestMsg());
        }
    } else {
        console.log("받은 원장에 문제가 있음");
    }
}

function hexToBinary(s) {
    const lookupTable = {
        0: "0000",
        1: "0001",
        2: "0010",
        3: "0011",
        4: "0100",
        5: "0101",
        6: "0110",
        7: "0111",
        8: "1000",
        9: "1001",
        A: "1010",
        B: "1011",
        C: "1100",
        D: "1101",
        E: "1110",
        F: "1111",
    };

    var ret = "";
    for (var i = 0; i < s.length; i++) {
        if (lookupTable[s[i]]) {
            ret += lookupTable[s[i]];
        } else {
            return null;
        }
    }
    return ret;
}

function hashMatchesDifficulty(hash, difficulty) {
    const hashBinary = hexToBinary(hash.toUpperCase());
    const requirePrefix = "0".repeat(difficulty);
    return hashBinary.startsWith(requirePrefix);
}

function findBlock(
    currentVersion,
    nextIndex,
    previousHash,
    nextTimestamp,
    merkleRoot,
    difficulty
) {
    var nonce = 0;

    while (true) {
        var hash = calculateHash(
            currentVersion,
            nextIndex,
            previousHash,
            nextTimestamp,
            merkleRoot,
            difficulty,
            nonce
        );
        if (hashMatchesDifficulty(hash, difficulty)) {
            return new BlockHeader(
                currentVersion,
                nextIndex,
                previousHash,
                nextTimestamp,
                merkleRoot,
                difficulty,
                nonce
            );
        }
        nonce++;
        console.log(nonce);
    }
}

function getDifficulty(blocks) {
    const lastBlock = blocks[blocks.length - 1];
    if (
        lastBlock.header.index !== 0 &&
        lastBlock.header.index % DIIFFICULTY_ADJUSTMENT_INTERVAL === 0
    ) {
        return getAdjustDifficulty(lastBlock, blocks);
    }
    return lastBlock.header.difficulty;
}

function getAdjustDifficulty(lastBlock, blocks) {
    const prevAdjustmentBlock =
        blocks[blocks.length - DIIFFICULTY_ADJUSTMENT_INTERVAL];
    const elapsedTime =
        lastBlock.header.timestamp - prevAdjustmentBlock.header.timestamp;
    const expectedTime =
        BLOCK_GENERATION_INTERVAL * DIIFFICULTY_ADJUSTMENT_INTERVAL;
    if (expectedTime / 2 > elapsedTime) {
        return prevAdjustmentBlock.header.difficulty + 1;
    } else if (expectedTime * 2 < elapsedTime) {
        return prevAdjustmentBlock.header.difficulty - 1;
    } else {
        return prevAdjustmentBlock.header.difficulty;
    }
}

module.exports = {
    Blocks,
    getLastBlock,
    createHash,
    nextBlock,
    getVersion,
    getBlocks,
    hexToBinary,
    hashMatchesDifficulty,
};
