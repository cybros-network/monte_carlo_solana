const { resolve } = require("path");
require('dotenv').config({ path: resolve(__dirname, "../", ".env") })

const { Keyring } = require("@polkadot/api");
const { cryptoWaitReady } = require("@polkadot/util-crypto");
const { u8aToHex } = require("@polkadot/util");
const Solana = require("@solana/web3.js");
const BufferLayout = require("@solana/buffer-layout");
const { Buffer } = require("buffer");

const rustString = function rustString(property) {
    const rsl = BufferLayout.struct([
        BufferLayout.u32('length'),
        BufferLayout.blob(BufferLayout.offset(BufferLayout.u32(), -4), 'chars')
    ], property);
    const _decode = rsl.decode.bind(rsl);
    const _encode = rsl.encode.bind(rsl);
    const rslShim = rsl;
    rslShim.decode = function (b, offset) {
        const data = _decode(b, offset);
        return data['chars'].toString();
    };
    rslShim.encode = function (str, b, offset) {
        const data = {
            chars: Buffer.from(str)
        };
        return _encode(data, b, offset);
    };
    rslShim.alloc = function (str) {
        return BufferLayout.u32().span + Buffer.from(str, 'utf8').length;
    };
    return rslShim;
};

function getAlloc(type, fields) {
    const getItemAlloc = function getItemAlloc(item) {
        if (item.span >= 0) {
            return item.span;
        } else if (typeof item.alloc === 'function') {
            return item.alloc(fields[item.property]);
        } else if ('count' in item && 'elementLayout' in item) {
            var field = fields[item.property];
            if (Array.isArray(field)) {
                return field.length * getItemAlloc(item.elementLayout);
            }
        } else if ('fields' in item) {
            // This is a `Structure` whose size needs to be recursively measured.
            return getAlloc({
                layout: item
            }, fields[item.property]);
        }
        // Couldn't determine allocated size of layout
        return 0;
    };
    let alloc = 0;
    type.layout.fields.forEach(function (item) {
        alloc += getItemAlloc(item);
    });
    return alloc;
}

const connection = new Solana.Connection(process.env.SOL_HTTP_ENDPOINT, { wsEndpoint: process.env.SOL_WS_ENDPOINT });

const secretKey = Uint8Array.from([
    202, 171, 192, 129, 150, 189, 204, 241, 142, 71, 205, 2, 81, 97, 2, 176, 48,
    81, 45, 1, 96, 138, 220, 132, 231, 131, 120, 77, 66, 40, 97, 172, 91, 245, 84,
    221, 157, 190, 9, 145, 176, 130, 25, 43, 72, 107, 190, 229, 75, 88, 191, 136,
    7, 167, 109, 91, 170, 164, 186, 15, 142, 36, 12, 23,
]);
const signer = Solana.Keypair.fromSecretKey(secretKey);

console.log(u8aToHex(signer.publicKey.toBytes()));
console.log(signer.publicKey.toBase58());

const programId = new Solana.PublicKey(process.env.SOL_PROGRAM_ID);
const promptStruct = {
    index: 0,
    layout: BufferLayout.struct([
        BufferLayout.u8('instruction'),
        rustString("input"),
    ])
};

const params = {
    instruction: promptStruct.index,
    input: JSON.stringify({
        "sd_model_name": "AnythingV5Ink_v5PrtRE",
        "prompt": "(masterpiece), best quality, high resolution, highly detailed, detailed background, perfect lighting, The student council girl with twin braids and glasses whom you don't know that she's a pervert until looking prompts",
        "negative_prompt": "(EasyNegative), (bad-hands-5), an6, verybadimagenegative_v1.3, (worst quality, low quality:1.2), (missing fingers, missing hands, missing legs:1.4) (extra limbs, extra fingers, extra hands, extra legs:1.4), (mutate fingers, mutated hands, mutated legs:1.4), (malformed hands, malformed fingers, malformed legs:1.4), (poorly drawn hands, poorly drawn face), (text, signature, watermark, username), (logo:1.5)",
        "sampler_name": "DPM++ 2M SDE Karras",
        "width": 512,
        "height": 768,
        "seed": 6967186,
        "steps": 20,
        "cfg_scale": 7.5,
        "hr_fix": true,
        "hr_fix_upscaler_name": "8x_NMKD-Superscale_150000_G",
        "hr_fix_upscale": 2.5,
        "hr_fix_steps": 21,
        "hr_fix_denoising": 0.21
    })
};
const data = Buffer.alloc(promptStruct.layout.span > 0 ? promptStruct.layout.span : getAlloc(promptStruct, params) );
promptStruct.layout.encode(params, data);

let transaction = new Solana.Transaction({
    feePayer: signer.publicKey,
});
let keys = [{ pubkey: signer.publicKey, isSigner: true, isWritable: true }];
transaction.add(
    new Solana.TransactionInstruction({
        keys,
        programId,
        data,
    }),
);

(async () => {
    await cryptoWaitReady().catch((e) => {
        console.error(e.message);
        process.exit(1);
    });

    const subKeyring = new Keyring({ type: "ed25519", ss58Format: 42 })
    subKeyring.addFromSeed(signer.secretKey.subarray(0, 32), undefined, "ed25519");
    console.log(`Substrate PubKey: ${u8aToHex(subKeyring.publicKeys[0])}`)
    console.log(`Substrate Address: ${subKeyring.encodeAddress(signer.publicKey.toBytes())}`)

    console.log("Sending")
    await Solana.sendAndConfirmTransaction(connection, transaction, [
        signer,
        signer,
    ]);
    console.log("Complete")
})().catch(console.error).finally(() => process.exit());
