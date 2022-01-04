const fs = require("fs");
const ecdsa = require("elliptic");
const ec = new ecdsa.ec("secp256k1");

const privateKeyLocation = "wallet/" + (process.env.PRIVATE_KEY || "default");
const privateKeyFile = privateKeyLocation + "/private_key";

function initWallet() {
    if (fs.existsSync(privateKeyFile)) {
        console.log("기존 지갑 경로 : " + privateKeyFile);
        return;
    }
    if (!fs.existsSync("wallet/")) {
        fs.mkdirSync("wallet/");
    }
    if (!fs.existsSync(privateKeyLocation)) {
        fs.mkdirSync(privateKeyLocation);
    }

    const newPrivateKey = generatePrivatekey();
    fs.writeFileSync(privateKeyFile, newPrivateKey);
    console.log("새로운 지갑경로 생성 경로 : " + privateKeyFile);
}

function generatePrivatekey() {
    const keyPair = ec.genKeyPair();
    const privatekey = keyPair.getPrivate();
    return privatekey.toString(16);
}

function getPrivateKeyFromWallet() {
    const buffer = fs.readFileSync(privateKeyFile, "utf8");
    return buffer.toString();
}

function getPublicKeyFromWallet() {
    const privatekey = getPrivateKeyFromWallet();
    const key = ec.keyFromPrivate(privatekey, "hex");
    return key.getPublic().encode("hex");
}

module.exports = {
    initWallet,
    generatePrivatekey,
    getPrivateKeyFromWallet,
    getPublicKeyFromWallet,
};
