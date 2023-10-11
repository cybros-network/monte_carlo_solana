const { resolve } = require("path");
require('dotenv').config({ path: resolve(__dirname, "../", ".env") })

const { Keyring } = require("@polkadot/api");
const { cryptoWaitReady } = require("@polkadot/util-crypto");
const { hexToU8a } = require("@polkadot/util");
const solana = require("@solana/web3.js");

async function main() {
    await cryptoWaitReady().catch((e) => {
        console.error(e.message);
        process.exit(1);
    });

    const connection = new solana.Connection(process.env.SOL_HTTP_ENDPOINT, { wsEndpoint: process.env.SOL_WS_ENDPOINT });

    const publicKeyLogPattern = "Program log: PublicKey: ";
    const dataLogPattern = "Program log: Data: ";
    const dataHashLogPattern = "Program log: Data hash: ";
    const programId = new solana.PublicKey(process.env.SOL_PROGRAM_ID);
    const subscriptionId = connection.onLogs(
        programId,
        (logs, _ctx) => {
            console.log(logs)

            const rawSignerPublicKey = logs.logs
                .filter(line => line.startsWith(publicKeyLogPattern))
                .map(line => line.substring(publicKeyLogPattern.length))[0];
            const rawData = logs.logs
                .filter(line => line.startsWith(dataLogPattern))
                .map(line => line.substring(dataLogPattern.length))[0];
            const rawDataHash = logs.logs
                .filter(line => line.startsWith(dataHashLogPattern))
                .map(line => line.substring(dataHashLogPattern.length))[0];

            if (!(rawSignerPublicKey && rawData && rawDataHash)) {
                return;
            }

            const solAddress = new solana.PublicKey(hexToU8a(rawSignerPublicKey)).toBase58();
            const subKeyring = new Keyring({ type: "ed25519", ss58Format: 42 });
            const subAddress = subKeyring.encodeAddress(rawSignerPublicKey);

            console.log(`Sender: ${solAddress} ${rawSignerPublicKey} ${subAddress}`);
            console.log(`Data: ${rawData}`);
            console.log(`Data hash: ${rawDataHash.substring(0, 36)}`);
        },
        "confirmed"
    );
    console.log('Starting web socket, subscription ID: ', subscriptionId);
}

main().catch(console.error);
