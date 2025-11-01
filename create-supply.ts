import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { createAssociatedTokenAccount, mintTo, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import wallet from "../../phantom-wallet/id.json";

async function supplyToken() {

	const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

	const payer = Keypair.fromSecretKey(Uint8Array.from(wallet));

	const mint = new PublicKey("Gc59RHS7UybGB9NWPKZWyGypQU761vZoEQ1AJjgRXjBP")

	const ata = await getOrCreateAssociatedTokenAccount(
		connection,
		payer,
		mint,
		payer.publicKey,
		false,
		"confirmed",
		undefined,
		TOKEN_2022_PROGRAM_ID
	)




	const tx = await mintTo(
		connection,
		payer,
		mint,
		ata.address,
		payer,
		10000000000000,
		[],
		undefined,
		TOKEN_2022_PROGRAM_ID,
	)

	console.log("Minted supply to the account", ata.address.toBase58());
	console.log("Transaction Signature:", tx)
}

(async () => {
	supplyToken()
})()
