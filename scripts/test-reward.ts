import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, getAccount } from "@solana/spl-token";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { Dgenerate } from "../target/types/dgenerate";
import TOKEN_CONFIG from "./token-config";
import { getKeypairFromEnvironment, getExplorerLink } from "./helpers";
import "dotenv/config";
import * as fs from "fs";

async function main() {
  console.log("🧪 Testing DGEN Token Reward System\n");
  
  // Setup
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const wallet = getKeypairFromEnvironment("SECRET_KEY");
  
  console.log(`🔑 Your Wallet: ${wallet.publicKey.toBase58()}`);
  console.log(`🪙 Token Mint: ${TOKEN_CONFIG.MINT_ADDRESS.toBase58()}`);
  console.log(`🎮 Game State: ${TOKEN_CONFIG.GAME_STATE_ADDRESS.toBase58()}\n`);
  
  // Load program
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);
  
  const idl = JSON.parse(fs.readFileSync("./target/idl/dgenerate.json", "utf-8"));
  const program = new Program(idl, provider) as Program<Dgenerate>;
  
  // STEP 1: Create/get token account
  console.log("📦 Step 1: Checking token account...");
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    TOKEN_CONFIG.MINT_ADDRESS,
    wallet.publicKey
  );
  
  console.log(`✅ Token Account: ${tokenAccount.address.toBase58()}`);
  console.log(`   🔗 ${getExplorerLink("address", tokenAccount.address.toBase58(), "devnet")}\n`);
  
  // Check initial balance
  const initialBalance = Number(tokenAccount.amount) / (10 ** TOKEN_CONFIG.DECIMALS);
  console.log(`💰 Initial Balance: ${initialBalance} DGEN\n`);
  
  // STEP 2: Call reward_user
  console.log("🎁 Step 2: Calling reward_user instruction...");
  
  try {
    const tx = await program.methods
      .rewardUser()
      .accounts({
        gameState: TOKEN_CONFIG.GAME_STATE_ADDRESS,
        tokenMint: TOKEN_CONFIG.MINT_ADDRESS,
        gameAuthority: TOKEN_CONFIG.GAME_AUTHORITY_PDA,
        recipientTokenAccount: tokenAccount.address,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    
    console.log(`✅ Transaction successful!`);
    console.log(`   TX: ${tx}`);
    console.log(`   🔗 ${getExplorerLink("transaction", tx, "devnet")}\n`);
    
    // Wait for confirmation
    console.log("⏳ Waiting for confirmation...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // STEP 3: Check new balance
    console.log("💰 Step 3: Checking new balance...");
    const updatedAccount = await getAccount(connection, tokenAccount.address);
    const newBalance = Number(updatedAccount.amount) / (10 ** TOKEN_CONFIG.DECIMALS);
    const earned = newBalance - initialBalance;
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎉 SUCCESS! You earned ${earned} DGEN tokens!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Initial Balance: ${initialBalance} DGEN`);
    console.log(`New Balance:     ${newBalance} DGEN`);
    console.log(`Tokens Earned:   ${earned} DGEN`);
    console.log(`Raw Amount:      ${Number(updatedAccount.amount)} units`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    console.log("✅ Your smart contract and token mint are working perfectly!");
    console.log("🎮 You can now integrate this into your frontend!\n");
    
  } catch (error: any) {
    console.error("\n❌ Error calling reward_user:");
    console.error(error);
    
    if (error.logs) {
      console.log("\n📋 Transaction logs:");
      error.logs.forEach((log: string) => console.log(`   ${log}`));
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


