import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import * as fs from 'fs';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const idl = JSON.parse(fs.readFileSync('./target/idl/dgenerate.json', 'utf-8'));
const programId = new PublicKey('EPKw6RHc8Bf7m8BpKxv66NMmzqwnn7tSRwcyJ9cNbNnD');
const gameStateAddress = new PublicKey('3iJN6JPCgjrhBKyMaRDe9Kjy5X5U562padf1NKEGohhM');

const dummyKeypair = Keypair.generate();
const wallet = { 
  publicKey: dummyKeypair.publicKey, 
  signTransaction: async (tx: any) => tx, 
  signAllTransactions: async (txs: any[]) => txs 
};
const provider = new AnchorProvider(connection, wallet as any, {});
const program = new Program(idl, provider);

async function check() {
  const gameState: any = await program.account.gameState.fetch(gameStateAddress);
  console.log('Game State Details:');
  console.log('  Authority:', gameState.authority.toBase58());
  console.log('  Token Mint:', gameState.tokenMint.toBase58());
  console.log('  Current Reward:', gameState.currentReward.toString());
  console.log('  Total Minted:', gameState.totalMinted.toString());
}

check();


