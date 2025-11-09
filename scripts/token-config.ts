import { PublicKey } from "@solana/web3.js";

/**
 * DGEN Token Configuration
 * Generated on devnet
 */

export const TOKEN_CONFIG = {
  // Token Mint Address
  MINT_ADDRESS: new PublicKey("AvuRwgvgvk4cvUTFhmdJSHAV8BCb4bLYP3DbLB6ugpD7"),
  
  // Program ID (dgenerate smart contract)
  PROGRAM_ID: new PublicKey("EPKw6RHc8Bf7m8BpKxv66NMmzqwnn7tSRwcyJ9cNbNnD"),
  
  // Game State Account (initialized)
  GAME_STATE_ADDRESS: new PublicKey("3iJN6JPCgjrhBKyMaRDe9Kjy5X5U562padf1NKEGohhM"),
  
  // Game Authority PDA (mint authority)
  GAME_AUTHORITY_PDA: new PublicKey("FvLbjrPUZzvz3N1YbE136XbqdzMphSHY2rXUuWRWoicY"),
  
  // Metadata Account
  METADATA_ACCOUNT: new PublicKey("BERwVg9gZQ3Sr5D1vmXfPHvLX7MJi9LNaMEiP8tcvyyr"),
  
  // Token Info
  NAME: "dgenerate",
  SYMBOL: "DGEN",
  DECIMALS: 9,
  IMAGE_URI: "https://i.ibb.co/m5V4jS8D/dgenerate.png",
  
  // PDA Seeds
  GAME_AUTHORITY_SEED: "game_authority",
  GAME_AUTHORITY_BUMP: 254,
};

// Helper function to get the mint address as a string
export function getMintAddress(): string {
  return TOKEN_CONFIG.MINT_ADDRESS.toBase58();
}

// Helper function to get the program ID as a string
export function getProgramId(): string {
  return TOKEN_CONFIG.PROGRAM_ID.toBase58();
}

// Helper function to get the game authority PDA as a string
export function getGameAuthorityPDA(): string {
  return TOKEN_CONFIG.GAME_AUTHORITY_PDA.toBase58();
}

// Export as default for convenience
export default TOKEN_CONFIG;

