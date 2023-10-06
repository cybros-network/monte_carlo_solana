const { resolve } = require("path");
require('dotenv').config({ path: resolve(__dirname, "../", ".env") })

const { Connection, PublicKey } = require("@solana/web3.js");
const connection = new Connection(process.env.SOL_HTTP_ENDPOINT, { wsEndpoint: process.env.SOL_WS_ENDPOINT });

const promptLogPattern = "Program log: Prompt: ";
const programId = new PublicKey(process.env.SOL_PROGRAM_ID);
const subscriptionId = connection.onLogs(
    programId,
    (logs, _ctx) => {
      for (const line of logs.logs) {
          if (!line.startsWith("Program log: Prompt: ")) {
              continue;
          }
          const prompt = line.substring(promptLogPattern.length)
          console.log(prompt)
      }
    },
    "confirmed"
);
console.log('Starting web socket, subscription ID: ', subscriptionId);
