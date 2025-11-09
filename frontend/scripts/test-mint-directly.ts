/**
 * Direct test of token minting to verify it works
 * This bypasses the guess system and directly mints tokens
 */

import { config } from 'dotenv';
import * as path from 'path';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

const TOKEN_MINT = new PublicKey('AvuRwgvgvk4cvUTFhmdJSHAV8BCb4bLYP3DbLB6ugpD7');

async function testDirectMint() {
  console.log('🧪 Direct Token Minting Test\n');
  console.log('='.repeat(80));
  
  // Get your wallet address
  const yourWallet = process.argv[2];
  
  if (!yourWallet) {
    console.log('\n❌ Please provide your wallet address as an argument:');
    console.log('\n   npx esrun scripts/test-mint-directly.ts YOUR_WALLET_ADDRESS\n');
    console.log('💡 You can find your wallet address in Phantom or your wallet app');
    process.exit(1);
  }

  console.log(`\n1️⃣ Testing mint to wallet: ${yourWallet}\n`);

  try {
    // Check if wallet has a token account for DGEN
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const walletPubkey = new PublicKey(yourWallet);
    const tokenAccountAddress = await getAssociatedTokenAddress(TOKEN_MINT, walletPubkey);
    
    console.log(`   📋 Token Account Address: ${tokenAccountAddress.toBase58()}`);
    
    // Check current balance
    let currentBalance = 0;
    try {
      const tokenAccount = await getAccount(connection, tokenAccountAddress);
      currentBalance = Number(tokenAccount.amount);
      console.log(`   💰 Current DGEN Balance: ${currentBalance / 1e9} DGEN`);
    } catch (error) {
      console.log(`   ℹ️  Token account does not exist yet (will be created on first mint)`);
    }

    // Call the mint API
    console.log('\n2️⃣ Calling mint API...\n');
    
    const mintAmount = 100; // 100 lamports = 0.0000001 DGEN
    
    const response = await fetch('http://localhost:3000/api/mint-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientWallet: yourWallet,
        amount: mintAmount,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.log('❌ Minting failed!');
      console.log('\n   Error:', result.error);
      console.log('   Details:', result.details);
      if (result.logs) {
        console.log('\n   Program Logs:');
        result.logs.forEach((log: string) => console.log('   ', log));
      }
      process.exit(1);
    }

    console.log('✅ Minting successful!\n');
    console.log('   📝 Transaction Signature:', result.signature);
    console.log('   🔗 Explorer:', result.explorerUrl);
    console.log(`   💰 Amount Minted: ${mintAmount} lamports (${mintAmount / 1e9} DGEN)`);

    // Wait a moment for transaction to confirm
    console.log('\n3️⃣ Waiting for confirmation...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check new balance
    try {
      const tokenAccount = await getAccount(connection, tokenAccountAddress);
      const newBalance = Number(tokenAccount.amount);
      console.log(`   💰 New DGEN Balance: ${newBalance / 1e9} DGEN`);
      console.log(`   📈 Change: +${(newBalance - currentBalance) / 1e9} DGEN`);
    } catch (error) {
      console.log('   ⏳ Token account not found yet, transaction may still be processing');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Test Complete!');
    console.log('\n💡 Check your wallet app (Phantom, Solflare, etc.) to see the DGEN tokens');
    console.log('💡 You may need to manually add the token mint address to see it:');
    console.log(`   Token Mint: ${TOKEN_MINT.toBase58()}\n`);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  }
}

testDirectMint();


