import { 
  Connection, 
  clusterApiUrl, 
  PublicKey, 
  Transaction, 
  TransactionInstruction 
} from "@solana/web3.js";
import { getKeypairFromEnvironment, getExplorerLink } from "./helpers";
import TOKEN_CONFIG from "./token-config";
import "dotenv/config";

async function main() {
  const NEW_IMAGE_URL = "https://i.ibb.co/m5V4jS8D/dgenerate.png";
  
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const payer = getKeypairFromEnvironment("SECRET_KEY");
  const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
  
  console.log("🖼️  Updating DGEN Token Metadata\n");
  console.log(`Token Mint: ${TOKEN_CONFIG.MINT_ADDRESS.toBase58()}`);
  console.log(`New Image URL: ${NEW_IMAGE_URL}\n`);
  
  // Derive metadata PDA
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      TOKEN_CONFIG.MINT_ADDRESS.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  
  console.log(`Metadata Account: ${metadataPDA.toBase58()}`);
  console.log(`Update Authority: ${payer.publicKey.toBase58()}\n`);
  
  // Create update instruction (discriminator 15 = UpdateMetadataAccountV2)
  const data = Buffer.alloc(1000);
  let offset = 0;
  
  // Instruction discriminator for UpdateMetadataAccountV2
  data.writeUInt8(15, offset);
  offset += 1;
  
  // Data Option (Some = 1, means we're updating data)
  data.writeUInt8(1, offset);
  offset += 1;
  
  // Name
  const nameBuffer = Buffer.from("dgenerate");
  data.writeUInt32LE(nameBuffer.length, offset);
  offset += 4;
  nameBuffer.copy(data, offset);
  offset += nameBuffer.length;
  
  // Symbol
  const symbolBuffer = Buffer.from("DGEN");
  data.writeUInt32LE(symbolBuffer.length, offset);
  offset += 4;
  symbolBuffer.copy(data, offset);
  offset += symbolBuffer.length;
  
  // URI (new image URL)
  const uriBuffer = Buffer.from(NEW_IMAGE_URL);
  data.writeUInt32LE(uriBuffer.length, offset);
  offset += 4;
  uriBuffer.copy(data, offset);
  offset += uriBuffer.length;
  
  // Seller fee basis points
  data.writeUInt16LE(0, offset);
  offset += 2;
  
  // Creators (None = 0)
  data.writeUInt8(0, offset);
  offset += 1;
  
  // Collection (None = 0)
  data.writeUInt8(0, offset);
  offset += 1;
  
  // Uses (None = 0)
  data.writeUInt8(0, offset);
  offset += 1;
  
  // Update authority (None = 0, means keep same)
  data.writeUInt8(0, offset);
  offset += 1;
  
  // Primary sale happened (None = 0)
  data.writeUInt8(0, offset);
  offset += 1;
  
  // Is mutable (Some(true) = 1, 1)
  data.writeUInt8(1, offset);
  offset += 1;
  data.writeUInt8(1, offset);
  offset += 1;
  
  console.log("📝 Creating update transaction...");
  
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: metadataPDA, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
    ],
    programId: TOKEN_METADATA_PROGRAM_ID,
    data: data.slice(0, offset),
  });
  
  try {
    const tx = new Transaction().add(instruction);
    const signature = await connection.sendTransaction(tx, [payer], {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    
    console.log("\n✅ Metadata updated successfully!");
    console.log(`Transaction: ${signature}`);
    console.log(`🔗 ${getExplorerLink("transaction", signature, "devnet")}\n`);
    
    // Wait for confirmation
    console.log("⏳ Waiting for confirmation...");
    await connection.confirmTransaction(signature, "confirmed");
    
    console.log("━".repeat(60));
    console.log("✅ Update Complete!");
    console.log("━".repeat(60));
    console.log(`Token: dgenerate (DGEN)`);
    console.log(`New Image: ${NEW_IMAGE_URL}`);
    console.log(`Metadata: ${metadataPDA.toBase58()}`);
    console.log("━".repeat(60));
    
    console.log("\n💡 Your token image has been updated!");
    console.log("   It may take a few minutes for wallets and explorers to refresh.\n");
    
  } catch (error: any) {
    console.error("\n❌ Failed to update metadata:");
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


