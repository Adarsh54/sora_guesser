/**
 * Helper script to convert your Solana wallet secret key to base58 format
 * for use as BACKEND_WALLET_SECRET_KEY in .env.local
 */

import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { getKeypairFromEnvironment } from './helpers';

async function main() {
  console.log('🔑 Getting Backend Wallet Secret Key\n');

  try {
    // Load your wallet from environment
    const keypair = await getKeypairFromEnvironment('SECRET_KEY');
    
    // Get the secret key as Uint8Array
    const secretKeyArray = keypair.secretKey;
    
    // Encode to base58
    const secretKeyBase58 = bs58.encode(secretKeyArray);
    
    console.log('✅ Your wallet public key:', keypair.publicKey.toBase58());
    console.log('\n📋 Add this to your frontend/.env.local file:\n');
    console.log(`BACKEND_WALLET_SECRET_KEY=${secretKeyBase58}`);
    console.log('\n⚠️  IMPORTANT: Keep this secret key private and never commit it to git!');
    console.log('⚠️  This key allows minting tokens from your smart contract.\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure you have SECRET_KEY set in your .env file');
    console.log('   The secret key should be a JSON array, e.g.:');
    console.log('   SECRET_KEY=[123,45,67,...]');
  }
}

main();


