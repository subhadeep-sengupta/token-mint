import {
	clusterApiUrl,
	Connection,
	Keypair,
	LAMPORTS_PER_SOL,
	sendAndConfirmTransaction,
	SystemProgram,
	Transaction,
} from '@solana/web3.js';
import {
	createInitializeMetadataPointerInstruction,
	createInitializeMintInstruction,
	ExtensionType,
	getMintLen,
	LENGTH_SIZE,
	TOKEN_2022_PROGRAM_ID,
	TYPE_SIZE,
} from '@solana/spl-token';
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import type { TokenMetadata } from '@solana/spl-token-metadata';

import wallet from "../../phantom-wallet/id.json"

async function createTokenWithMetadata() {
	const payer = Keypair.fromSecretKey(Uint8Array.from(wallet));
	const mint = Keypair.generate();

	const decimals = 9;

	const metadata: TokenMetadata = {
		name: "Ichigo Kurosaki",
		symbol: "IK",
		uri: "https://gist.githubusercontent.com/subhadeep-sengupta/1ce01f407dcbc67e35d40d04b733835e/raw/332327d56936607ed245ee9e22b16c71fab895a9/IchigoKurosaki.json",
		mint: mint.publicKey,
		additionalMetadata: [["Final Form", "Thousand year blood war arc"]]
	};

	const connection = new Connection(clusterApiUrl("devnet"), 'confirmed');

	const mintLen = getMintLen([ExtensionType.MetadataPointer]);

	const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

	try {
		const balance = await connection.getBalance(payer.publicKey)

		if (balance / 1e9 < 2) {
			const airdropSignature = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
			await connection.confirmTransaction({
				signature: airdropSignature,
				...(await connection.getLatestBlockhash())
			})
		}
	} catch (e) {
		console.log("Request Airdrop failed", e)
	}

	const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

	const mintTransaction = new Transaction().add(
		SystemProgram.createAccount({
			fromPubkey: payer.publicKey,
			newAccountPubkey: mint.publicKey,
			space: mintLen,
			lamports: mintLamports,
			programId: TOKEN_2022_PROGRAM_ID,
		}),
		createInitializeMetadataPointerInstruction(mint.publicKey, payer.publicKey, mint.publicKey, TOKEN_2022_PROGRAM_ID),
		createInitializeMintInstruction(mint.publicKey, decimals, payer.publicKey, null, TOKEN_2022_PROGRAM_ID),
		createInitializeInstruction({
			programId: TOKEN_2022_PROGRAM_ID,
			mint: mint.publicKey,
			metadata: mint.publicKey,
			name: metadata.name,
			symbol: metadata.symbol,
			uri: metadata.uri,
			mintAuthority: payer.publicKey,
			updateAuthority: payer.publicKey
		}),
	);
	const txSignature = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mint])
	console.log("Token created successfully!");
	console.log("Mint Address:", mint.publicKey.toBase58());
	console.log("Transaction Signature:", txSignature);
}

(async () => {
	createTokenWithMetadata()
})();
