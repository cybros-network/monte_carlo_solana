const web3 = require("@solana/web3.js");

const { struct, blob, utf8 } = require("@solana/buffer-layout");
const { stringToU8a } = require("@polkadot/util")

const WS_ENDPOINT = "ws://localhost:8900";
const HTTP_ENDPOINT = "http://localhost:8899";
const connection = new web3.Connection(HTTP_ENDPOINT,{ wsEndpoint: WS_ENDPOINT });

const secretKey = Uint8Array.from([
    202, 171, 192, 129, 150, 189, 204, 241, 142, 71, 205, 2, 81, 97, 2, 176, 48,
    81, 45, 1, 96, 138, 220, 132, 231, 131, 120, 77, 66, 40, 97, 172, 91, 245, 84,
    221, 157, 190, 9, 145, 176, 130, 25, 43, 72, 107, 190, 229, 75, 88, 191, 136,
    7, 167, 109, 91, 170, 164, 186, 15, 142, 36, 12, 23,
]);
const signer = web3.Keypair.fromSecretKey(secretKey);

console.log(signer.publicKey.toBase58());

const programId = new web3.PublicKey("9TgeQ1HLSvHF47qYVoh2PMfpLEc2NVe1HEE6tp8b2bSg");
// let helloStruct = utf8(2048, "input") // struct([utf8(2048, "input")]);
// let params = {
//     input: "Hello",
// };

// let data = Buffer.alloc(helloStruct.span > 0 ? helloStruct.span : 4096);
// let layoutFields = Object.assign({}, params);
// helloStruct.encode(layoutFields, data);

const data = Buffer.from(stringToU8a("Hello"));

let transaction = new web3.Transaction({
    feePayer: signer.publicKey,
});
let keys = [{ pubkey: signer.publicKey, isSigner: true, isWritable: true }];
transaction.add(
    new web3.TransactionInstruction({
        keys,
        programId,
        data,
    }),
);

(async () => {
    console.log("Sending")
    await web3.sendAndConfirmTransaction(connection, transaction, [
        signer,
        signer,
    ]);
    console.log("Complete")
})().catch(console.error).finally(() => process.exit());
