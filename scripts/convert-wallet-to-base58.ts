/**
 * Simple script to convert Solana wallet to base58 format
 * Reads from the default Solana CLI wallet location
 */

import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

async function main() {
  console.log('🔑 Converting Solana Wallet to Base58 Format\n');

  try {
    // Default Solana wallet path
    const walletPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
    
    console.log(`📂 Reading wallet from: ${walletPath}`);
    
    // Read the wallet file
    const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
    
    // Create keypair from the secret key array
    const keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
    
    // Encode to base58
    const secretKeyBase58 = bs58.encode(keypair.secretKey);
    
    console.log('\n✅ Wallet public key:', keypair.publicKey.toBase58());
    console.log('\n📋 Copy this line to your frontend/.env.local file:\n');
    console.log('='.repeat(80));
    console.log(`BACKEND_WALLET_SECRET_KEY=${secretKeyBase58}`);
    console.log('='.repeat(80));
    console.log('\n⚠️  IMPORTANT: Keep this secret key private and never commit it to git!');
    console.log('⚠️  This key allows minting DGEN tokens from your smart contract.\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure you have a Solana wallet at ~/.config/solana/id.json');
    console.log('   You can generate one with: solana-keygen new');
  }
}

main();


