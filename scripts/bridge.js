const { resolve } = require("path");
require('dotenv').config({ path: resolve(__dirname, "../", ".env") })

const { ApiPromise, HttpProvider, Keyring, WsProvider } = require("@polkadot/api");
const { cryptoWaitReady } = require("@polkadot/util-crypto");
const { Connection, PublicKey } = require("@solana/web3.js");

const jobPoolId = parseInt(process.env.JOB_POOL_ID)
if (Number.isNaN(jobPoolId) || jobPoolId <= 0) {
    console.error("JOB_POOL_ID is invalid.")
    process.exit(1)
}
const jobPolicyId = parseInt(process.env.JOB_POLICY_ID)
if (Number.isNaN(jobPolicyId) || jobPolicyId <= 0) {
    console.error("JOB_POLICY_ID is invalid.")
    process.exit(1)
}
const jobSpecVersion = parseInt(process.env.JOB_SPEC_VERSION)
if (Number.isNaN(jobSpecVersion) || jobSpecVersion <= 0) {
    console.error("JOB_SPEC_VERSION is invalid.")
    process.exit(1)
}
const jobMaxInputSize = parseInt(process.env.JOB_MAX_INPUT_SIZE)
if (Number.isNaN(jobMaxInputSize) || jobMaxInputSize <= 0) {
    console.error("JOB_MAX_INPUT_SIZE is invalid.")
    process.exit(1)
}

function createSubstrateApi(rpcUrl) {
    let provider = null;
    if (rpcUrl.startsWith("wss://") || rpcUrl.startsWith("ws://")) {
        provider = new WsProvider(rpcUrl);
    } else if (
        rpcUrl.startsWith("https://") || rpcUrl.startsWith("http://")
    ) {
        provider = new HttpProvider(rpcUrl);
    } else {
        return null;
    }

    return new ApiPromise({
        provider,
        throwOnConnect: true,
        throwOnUnknown: true,
    });
}

async function main() {
    await cryptoWaitReady().catch((e) => {
        console.error(e.message);
        process.exit(1);
    });

    const operatorKeyPair = (() => {
        const operatorMnemonic = process.env.SUB_OPERATOR_MNEMONIC;
        if (operatorMnemonic === undefined || operatorMnemonic === "") {
            console.error("Mnemonic is blank")
            process.exit(1)
        }

        try {
            return new Keyring({ type: "sr25519" }).addFromUri(operatorMnemonic, { name: "The operator" });
        } catch (e) {
            console.error(`Operator mnemonic invalid: ${e.message}`);
            process.exit(1)
        }
    })();
    console.log(`Operator: ${operatorKeyPair.address}`);

    const api = createSubstrateApi(process.env.SUB_NODE_RPC_URL);
    if (api === null) {
        console.error(`Invalid RPC URL "${process.env.SUB_NODE_RPC_URL}"`);
        process.exit(1);
    }

    api.on("error", (e) => {
        console.error(`Polkadot.js error: ${e.message}"`);
        process.exit(1);
    });

    await api.isReady.catch((e) => {
        console.error(e);
        process.exit(1);
    });
    console.log(`Connected to RPC: ${process.env.SUB_NODE_RPC_URL}`);

    let { nonce } = await api.query.system.account(operatorKeyPair.address);
    nonce = nonce.toNumber();
    console.log(`Nonce: ${nonce}`);

    const connection = new Connection(process.env.SOL_HTTP_ENDPOINT, { wsEndpoint: process.env.SOL_WS_ENDPOINT });
    const promptLogPattern = "Program log: Prompt: ";
    const programId = new PublicKey(process.env.SOL_PROGRAM_ID);
    const subscriptionId = connection.onLogs(
        programId,
        async (logs, _ctx) => {
            for (const line of logs.logs) {
                if (!line.startsWith("Program log: Prompt: ")) {
                    continue;
                }
                const dataString = line.substring(promptLogPattern.length)
                console.log()
                console.log(dataString)

                const data = (() => {
                    try {
                        return JSON.parse(dataString)
                    } catch (_e) {
                        return null
                    }
                })();
                if (!data) {
                    console.error("Data is invalid, skip.");
                    continue;
                }

                const input = JSON.stringify({
                    e2e: false,
                    v: 1,
                    data,
                });
                if (input.length > jobMaxInputSize) {
                    console.error(`Data too large, skip.`);
                    continue;
                }

                console.info(`Sending offchainComputingPool.createJob(poolId, policyId, uniqueTrackId, beneficiary, implSpecVersion, input, softExpiresIn)`);
                const txPromise = api.tx.offchainComputingPool.createJob(
                    jobPoolId, jobPolicyId, null, null, jobSpecVersion, input, null
                );

                const callHash = txPromise.toHex();
                console.info(`Call hash: ${callHash}`);

                if (process.env.DRY_RUN) {
                    console.info("Dry run, skip.");
                    continue;
                }

                const currentNonce = nonce;
                nonce += 1;
                try {
                    const txHash = await txPromise.signAndSend(operatorKeyPair, { nonce: currentNonce });
                    console.info(`Transaction hash: "${txHash.toHex()}" Nonce: "${currentNonce}"`);
                } catch (e) {
                    console.error(e.message);
                }
            }
        },
        "confirmed"
    );
    console.log('Starting web socket, subscription ID: ', subscriptionId);
}

main().catch(console.error);