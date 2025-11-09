import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, clusterApiUrl, Keypair } from "@solana/web3.js";
import { Dgenerate } from "../target/types/dgenerate";
import TOKEN_CONFIG from "./token-config";
import { getKeypairFromEnvironment } from "./helpers";
import "dotenv/config";
import * as fs from "fs";

async function main() {
  // Setup connection and provider
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const payer = getKeypairFromEnvironment("SECRET_KEY");
  
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(payer),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  console.log(`🔑 Using wallet: ${payer.publicKey.toBase58()}`);

  // Load the program
  const programId = TOKEN_CONFIG.PROGRAM_ID;
  const idl = JSON.parse(
    fs.readFileSync("./target/idl/dgenerate.json", "utf-8")
  );
  const program = new Program(idl, provider) as Program<Dgenerate>;

  console.log(`📋 Program ID: ${programId.toBase58()}`);

  // Generate a keypair for the game state account
  const gameStateKeypair = Keypair.generate();
  console.log(`🎮 Game State Address: ${gameStateKeypair.publicKey.toBase58()}`);

  // Verify the PDA matches
  const [gameAuthorityPDA, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("game_authority")],
    programId
  );
  
  console.log(`🔐 Game Authority PDA: ${gameAuthorityPDA.toBase58()}`);
  console.log(`📊 Expected PDA: ${TOKEN_CONFIG.GAME_AUTHORITY_PDA.toBase58()}`);
  
  if (!gameAuthorityPDA.equals(TOKEN_CONFIG.GAME_AUTHORITY_PDA)) {
    throw new Error("PDA mismatch! Please check your token config.");
  }

  console.log("\n🚀 Initializing program...");
  console.log(`   Token Mint: ${TOKEN_CONFIG.MINT_ADDRESS.toBase58()}`);
  console.log(`   Authority: ${payer.publicKey.toBase58()}`);

  try {
    const tx = await program.methods
      .initialize()
      .accounts({
        gameState: gameStateKeypair.publicKey,
        tokenMint: TOKEN_CONFIG.MINT_ADDRESS,
        gameAuthority: TOKEN_CONFIG.GAME_AUTHORITY_PDA,
        authority: payer.publicKey,
        payer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([payer, gameStateKeypair])
      .rpc();

    console.log("✅ Program initialized successfully!");
    console.log(`📝 Transaction: ${tx}`);
    console.log(`🔗 https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    // Fetch and display the initialized state
    console.log("\n⏳ Fetching game state...");
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for confirmation
    
    const gameState = await program.account.gameState.fetch(
      gameStateKeypair.publicKey
    );
    
    console.log("\n📊 Game State Initialized:");
    console.log("━".repeat(60));
    console.log(`Token Mint:        ${gameState.tokenMint.toBase58()}`);
    console.log(`Total Minted:      ${gameState.totalMinted.toString()}`);
    console.log(`Current Reward:    ${gameState.currentReward.toString()} (${gameState.currentReward.toNumber() / 1e9} DGEN)`);
    console.log(`Halving Threshold: ${gameState.halvingThreshold.toString()}`);
    console.log(`Authority:         ${gameState.authority.toBase58()}`);
    console.log("━".repeat(60));

    // Save the game state address
    console.log("\n📝 IMPORTANT - Save this game state address:");
    console.log("━".repeat(60));
    console.log(`GAME_STATE_ADDRESS="${gameStateKeypair.publicKey.toBase58()}"`);
    console.log("━".repeat(60));
    
    console.log("\n💡 Next Steps:");
    console.log("1. Add GAME_STATE_ADDRESS to your .env file");
    console.log("2. Update scripts/token-config.ts with the game state address");
    console.log("3. Your program is now ready to reward users!");

  } catch (error: any) {
    console.error("\n❌ Initialization failed!");
    console.error(error);
    
    if (error.message?.includes("already in use")) {
      console.log("\n💡 The program might already be initialized.");
      console.log("   If you need to reinitialize, you'll need to generate a new game state keypair.");
    }
    
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


