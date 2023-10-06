const { resolve } = require("path");
require('dotenv').config({ path: resolve(__dirname, "../", ".env") })

const { Keyring } = require("@polkadot/api");
const { cryptoWaitReady } = require("@polkadot/util-crypto");
const { hexToU8a } = require("@polkadot/util");
const Solana = require("@solana/web3.js");

async function main() {
    await cryptoWaitReady().catch((e) => {
        console.error(e.message);
        process.exit(1);
    });

    const connection = new Solana.Connection(process.env.SOL_HTTP_ENDPOINT, { wsEndpoint: process.env.SOL_WS_ENDPOINT });

    const dataLogPattern = "Program log: Prompt: ";
    const publicKeyLogPattern = "Program log: PublicKey: ";
    const programId = new Solana.PublicKey(process.env.SOL_PROGRAM_ID);
    const subscriptionId = connection.onLogs(
        programId,
        (logs, _ctx) => {
            console.log(logs)
            const signerPublicKey = logs.logs
                .filter(line => line.startsWith(publicKeyLogPattern))
                .map(line => line.substring(publicKeyLogPattern.length))[0];
            const dataString = logs.logs
                .filter(line => line.startsWith(dataLogPattern))
                .map(line => line.substring(dataLogPattern.length))[0];

            if (!(signerPublicKey && dataString)) {
                return;
            }

            const solAddress = new Solana.PublicKey(hexToU8a(signerPublicKey)).toBase58();
            const subKeyring = new Keyring({ type: "ed25519", ss58Format: 42 });
            const subAddress = subKeyring.encodeAddress(signerPublicKey);

            console.log(`Sender: ${solAddress} ${signerPublicKey} ${subAddress}`);
            console.log(`Input: ${dataString}`);
        },
        "confirmed"
    );
    console.log('Starting web socket, subscription ID: ', subscriptionId);
}

main().catch(console.error);
