/**
 * Test the minting logic directly without HTTP to isolate the issue
 */

import { config } from 'dotenv';
import * as path from 'path';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';
import dgenerateIdl from '../lib/dgenerate-idl.json';

config({ path: path.resolve(process.cwd(), '.env.local') });

// Simple wallet for node
class NodeWallet {
  constructor(readonly payer: Keypair) {}
  
  async signTransaction(tx: any): Promise<any> {
    tx.partialSign(this.payer);
    return tx;
  }
  
  async signAllTransactions(txs: any[]): Promise<any[]> {
    return txs.map(tx => {
      tx.partialSign(this.payer);
      return tx;
    });
  }
  
  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }
}

const TOKEN_MINT_ADDRESS = new PublicKey('AvuRwgvgvk4cvUTFhmdJSHAV8BCb4bLYP3DbLB6ugpD7');
const PROGRAM_ID = new PublicKey('EPKw6RHc8Bf7m8BpKxv66NMmzqwnn7tSRwcyJ9cNbNnD');
const GAME_STATE_ADDRESS = new PublicKey('3iJN6JPCgjrhBKyMaRDe9Kjy5X5U562padf1NKEGohhM');
const GAME_AUTHORITY_SEED = 'game_authority';

async function test() {
  console.log('🧪 Direct Minting Test (No HTTP)\n');
  
  const recipientWallet = process.argv[2];
  if (!recipientWallet) {
    console.log('Usage: npx esrun scripts/test-mint-direct-no-http.ts WALLET_ADDRESS');
    process.exit(1);
  }
  
  try {
    // Load backend wallet
    const secretKeyString = process.env.BACKEND_WALLET_SECRET_KEY;
    if (!secretKeyString) {
      throw new Error('BACKEND_WALLET_SECRET_KEY not set');
    }
    
    const secretKey = bs58.decode(secretKeyString);
    const payerKeypair = Keypair.fromSecretKey(secretKey);
    
    console.log(`✅ Backend wallet: ${payerKeypair.publicKey.toBase58()}`);
    console.log(`✅ Recipient: ${recipientWallet}\n`);
    
    // Setup connection
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const wallet = new NodeWallet(payerKeypair);
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    
    // Load program
    const program = new Program(dgenerateIdl as Idl, provider);
    
    // Get game state
    const gameState: any = await program.account.gameState.fetch(GAME_STATE_ADDRESS);
    console.log(`✅ Current reward: ${gameState.currentReward.toNumber()} (${gameState.currentReward.toNumber() / 1e9} DGEN)`);
    
    // Derive PDA
    const [gameAuthorityPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(GAME_AUTHORITY_SEED)],
      PROGRAM_ID
    );
    console.log(`✅ Game Authority PDA: ${gameAuthorityPDA.toBase58()}`);
    
    // Get recipient token account
    const recipientPubkey = new PublicKey(recipientWallet);
    const recipientTokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT_ADDRESS,
      recipientPubkey
    );
    console.log(`✅ Recipient Token Account: ${recipientTokenAccount.toBase58()}\n`);
    
    console.log('🎮 Calling reward_user instruction...\n');
    
    // Call the instruction
    const tx = await program.methods
      .rewardUser()
      .accounts({
        gameState: GAME_STATE_ADDRESS,
        tokenMint: TOKEN_MINT_ADDRESS,
        gameAuthority: gameAuthorityPDA,
        recipientTokenAccount: recipientTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    
    console.log('✅ SUCCESS!');
    console.log(`📝 Signature: ${tx}`);
    console.log(`🔗 https://explorer.solana.com/tx/${tx}?cluster=devnet\n`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.logs) {
      console.error('\nProgram Logs:');
      error.logs.forEach((log: string) => console.error('  ', log));
    }
    process.exit(1);
  }
}

test();


