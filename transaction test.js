const CryptoJS = require("crypto-js");
const ecdsa = require("elliptic");
const ec = new ecdsa.ec("secp256k1");

class TxOut {
    constructor(address, amount) {
        this.address = address;
        this.amount = amount;
    }
}
class TxIn {
    constructor(txOutId, txOutIndex, signature) {
        this.txOutId = txOutId;
        this.txOutIndex = txOutIndex;
        this.signature = signature;
    }
}

class Transaction {
    constructor(id, txIns, txOuts) {
        this.id = id;
        this.txIns = txIns;
        this.txOuts = txOuts;
    }
}

class UnspentTxOut {
    constructor(txOutId, txOutIndex, address, amount) {
        this.txOutId = txOutId;
        this.txOutIndex = txOutIndex;
        this.address = address;
        this.amount = amount;
    }
}

const COINBASE_AMOUNT = 5000;

const getTransactionId = (transaction) => {
    const txInContent = transaction.txIns
        .map((txIn) => txIn.txOutId + txIn.txOutIndex)
        .reduce((a, b) => a + b, "");

    const txOutContent = transaction.txOuts
        .map((txOut) => txOut.address + txOut.amount)
        .reduce((a, b) => a + b, "");

    // return { txInContent, txOutContent };
    return CryptoJS.SHA256(txInContent + txOutContent).toString();
};

const testtxIns = [
    new TxIn("iD_1번", 0, ""),
    new TxIn("iD_2번", 1, ""),
    new TxIn("iD_3번", 2, ""),
    new TxIn("iD_4번", 3, ""),
    new TxIn("iD_5번", 4, ""),
];
const testtxOuts = [
    new TxOut("6번주소", 10),
    new TxOut("7번주소", 10),
    new TxOut("8번주소", 10),
    new TxOut("9번주소", 10),
    new TxOut("10번주소", 10),
];

const testTransaction = new Transaction("1번트랜잭션", testtxIns, testtxOuts);
const testUnspentTxOut = new UnspentTxOut("iD_3번", 2, "7번주소", 10);

const findUnspentTxOut = (transactionId, index, aUnspentTxOuts) => {
    return aUnspentTxOuts.find(
        (uTxO) => uTxO.txOutId === transactionId && uTxO.txOutIndex === index
    );
};

const toHexString = (byteArray) => {
    return Array.from(byteArray, (byte) => {
        return ("0" + (byte & 0xff).toString(16)).slice(-2);
    }).join("");
};

const signTxIn = (transaction, txInIndex, privateKey, aUnspentTxOuts) => {
    const txIn = transaction.txIns[txInIndex];
    const dataToSign = transaction.id;

    const referencedUnspentTxOut = findUnspentTxOut(
        txIn.txOutId,
        txIn.txOutIndex,
        aUnspentTxOuts
    );
    const referencedAddress = referencedUnspentTxOut.address;
    const key = ec.keyFromPrivate(privateKey, "hex");
    const signature = toHexString(key.sign(dataToSign).toDER());
    return signature;
};

// console.log(getTransactionId(testTransaction));

// console.log(
//     signTxIn(
//         testTransaction,
//         2,
//         "19f128debc1b9122da0635954488b208b829879cf13b3d6cac5d1260c0fd967c",
//         [testUnspentTxOut]
//     )
// );

const updateUnspentTxOuts = (newTransactions, aUnspentTxOuts) => {
    const newUnspentTxOuts = newTransactions
        .map((t) => {
            return t.txOuts.map(
                (txOut, index) =>
                    new UnspentTxOut(t.id, index, txOut.address, txOut.amount)
            );
        })
        .reduce((a, b) => a.concat(b), []);

    const consumedTxOuts = newTransactions
        .map((t) => t.txIns)
        .reduce((a, b) => a.concat(b), [])
        .map((txIn) => new UnspentTxOut(txIn.txOutId, txIn.txOutIndex, "", 0));

    const resultingUnspentTxOuts = aUnspentTxOuts
        .filter(
            (uTxO) =>
                !findUnspentTxOut(uTxO.txOutId, uTxO.txOutIndex, consumedTxOuts)
        )
        .concat(newUnspentTxOuts);

    return resultingUnspentTxOuts;
};

// console.log(updateUnspentTxOuts([testTransaction], [testUnspentTxOut]));

const validateTransaction = (transaction, aUnspentTxOuts) => {
    ////////////////////////////////////////질문사항////////////////////////////////////////
    if (getTransactionId(transaction) !== transaction.id) {
        console.log("invalid tx id: " + transaction.id);
        return false;
    }
    const hasValidTxIns = transaction.txIns
        .map((txIn) => validateTxIn(txIn, transaction, aUnspentTxOuts))
        .reduce((a, b) => a && b, true);

    if (!hasValidTxIns) {
        console.log("some of the txIns are invalid in tx: " + transaction.id);
        return false;
    }

    const totalTxInValues = transaction.txIns
        .map((txIn) => getTxInAmount(txIn, aUnspentTxOuts))
        .reduce((a, b) => a + b, 0);

    const totalTxOutValues = transaction.txOuts
        .map((txOut) => txOut.amount)
        .reduce((a, b) => a + b, 0);

    if (totalTxOutValues !== totalTxInValues) {
        console.log(
            "totalTxOutValues !== totalTxInValues in tx: " + transaction.id
        );
        return false;
    }

    return true;
};
// console.log(validateTransaction(testTransaction, [testUnspentTxOut]));

const isValidTxInStructure = (txIn) => {
    if (txIn == null) {
        console.log("txIn is null");
        return false;
    } else if (typeof txIn.signature !== "string") {
        console.log("invalid signature type in txIn");
        return false;
    } else if (typeof txIn.txOutId !== "string") {
        console.log("invalid txOutId type in txIn");
        return false;
    } else if (typeof txIn.txOutIndex !== "number") {
        console.log("invalid txOutIndex type in txIn");
        return false;
    } else {
        return true;
    }
};

console.log(isValidTxInStructure(testtxIns[0]));

const isValidTxOutStructure = (txOut) => {
    if (txOut == null) {
        console.log("txOut is null");
        return false;
    } else if (typeof txOut.address !== "string") {
        console.log("invalid address type in txOut");
        return false;
        // } else if (!isValidAddress(txOut.address)) {
        //     console.log("invalid TxOut address");
        //     return false;
    } else if (typeof txOut.amount !== "number") {
        console.log("invalid amount type in txOut");
        return false;
    } else {
        return true;
    }
};
console.log(isValidTxOutStructure(testtxOuts[0]));

const isValidTransactionStructure = (transaction) => {
    if (typeof transaction.id !== "string") {
        console.log("transactionId missing");
        return false;
    }
    if (!(transaction.txIns instanceof Array)) {
        console.log("invalid txIns type in transaction");
        return false;
    }
    if (
        !transaction.txIns
            .map(isValidTxInStructure)
            .reduce((a, b) => a && b, true)
    ) {
        return false;
    }

    if (!(transaction.txOuts instanceof Array)) {
        console.log("invalid txIns type in transaction");
        return false;
    }

    if (
        !transaction.txOuts
            .map(isValidTxOutStructure)
            .reduce((a, b) => a && b, true)
    ) {
        return false;
    }
    return true;
};

console.log(isValidTransactionStructure(testTransaction));
