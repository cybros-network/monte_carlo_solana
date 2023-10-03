const { Connection, PublicKey, LAMPORTS_PER_SOL } = require("@solana/web3.js");

// const sleep = (ms) => {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

const WS_ENDPOINT = "ws://localhost:8900";
const HTTP_ENDPOINT = "http://localhost:8899";
const connection = new Connection(HTTP_ENDPOINT,{ wsEndpoint: WS_ENDPOINT });

// const ACCOUNT_TO_WATCH = new PublicKey('hGWUfYsyBH3yBUaRNwVgWwcRe4jZ8tFuBrgTGM7jYM7');
// const subscriptionId = solanaConnection.onAccountChange(
//     ACCOUNT_TO_WATCH,
//     (updatedAccountInfo) => console.log(`---Event Notification for ${ACCOUNT_TO_WATCH.toString()}--- \nNew Account Balance:`, updatedAccountInfo.lamports / LAMPORTS_PER_SOL, ' SOL'),
//     "confirmed"
// );
// console.log('Starting web socket, subscription ID: ', subscriptionId);

// await solanaConnection.requestAirdrop(ACCOUNT_TO_WATCH, LAMPORTS_PER_SOL);

const ACCOUNT_TO_WATCH = new PublicKey("9TgeQ1HLSvHF47qYVoh2PMfpLEc2NVe1HEE6tp8b2bSg");
const subscriptionId = connection.onLogs(
    ACCOUNT_TO_WATCH,
    (logs, ctx) => {
      console.log(logs);
      console.log(ctx);
    },
    "confirmed"
);
console.log('Starting web socket, subscription ID: ', subscriptionId);
