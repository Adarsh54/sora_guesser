import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import bs58 from 'bs58';
import dgenerateIdl from '@/lib/dgenerate-idl.json';

// Token and Program Configuration
const TOKEN_MINT_ADDRESS = new PublicKey('AvuRwgvgvk4cvUTFhmdJSHAV8BCb4bLYP3DbLB6ugpD7');
const PROGRAM_ID = new PublicKey('EPKw6RHc8Bf7m8BpKxv66NMmzqwnn7tSRwcyJ9cNbNnD');
const GAME_STATE_ADDRESS = new PublicKey('3iJN6JPCgjrhBKyMaRDe9Kjy5X5U562padf1NKEGohhM');

// Game Authority PDA seeds
const GAME_AUTHORITY_SEED = 'game_authority';

// Server-side wallet implementation matching Anchor's interface
class ServerWallet {
  constructor(public payer: Keypair) {}

  async signTransaction(tx: Transaction): Promise<Transaction> {
    tx.partialSign(this.payer);
    return tx;
  }

  async signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
    return txs.map((tx) => {
      tx.partialSign(this.payer);
      return tx;
    });
  }

  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { recipientWallet, amount } = await request.json();

    if (!recipientWallet || !amount) {
      return NextResponse.json(
        { error: 'Missing recipientWallet or amount' },
        { status: 400 }
      );
    }

    console.log(`🪙 Minting ${amount} DGEN tokens to ${recipientWallet}`);

    // Load backend wallet from environment
    const secretKeyString = process.env.BACKEND_WALLET_SECRET_KEY;
    if (!secretKeyString) {
      console.error('BACKEND_WALLET_SECRET_KEY not found in environment');
      return NextResponse.json(
        { error: 'Backend wallet not configured' },
        { status: 500 }
      );
    }

    const secretKey = bs58.decode(secretKeyString);
    const payerKeypair = Keypair.fromSecretKey(secretKey);

    // Setup connection and provider
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const wallet = new ServerWallet(payerKeypair);
    const provider = new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
    });

    // Load the program with the IDL
    const program = new Program(dgenerateIdl as Idl, provider);

    // Fetch the current game state to get the reward amount
    const gameState = await program.account.gameState.fetch(GAME_STATE_ADDRESS);
    const actualRewardAmount = gameState.currentReward.toNumber();

    // Derive the game authority PDA
    const [gameAuthorityPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(GAME_AUTHORITY_SEED)],
      PROGRAM_ID
    );

    // Get recipient public key
    const recipientPubkey = new PublicKey(recipientWallet);

    // Get or create recipient's token account
    console.log('📋 Getting recipient token account...');
    const recipientTokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT_ADDRESS,
      recipientPubkey
    );

    // Check if token account exists, if not, create it
    try {
      const accountInfo = await connection.getAccountInfo(recipientTokenAccount);
      if (!accountInfo) {
        console.log('📝 Creating token account for recipient...');
        // We'll let the program handle account creation or do it here
        await getOrCreateAssociatedTokenAccount(
          connection,
          payerKeypair,
          TOKEN_MINT_ADDRESS,
          recipientPubkey
        );
      }
    } catch (error) {
      console.log('Creating token account...', error);
    }

    // Call the reward_user instruction
    // NOTE: reward_user doesn't take amount as parameter - it uses game_state.current_reward
    console.log('🎮 Calling reward_user instruction...');
    console.log('   Game State:', GAME_STATE_ADDRESS.toBase58());
    console.log('   Token Mint:', TOKEN_MINT_ADDRESS.toBase58());
    console.log('   Game Authority PDA:', gameAuthorityPDA.toBase58());
    console.log('   Recipient Token Account:', recipientTokenAccount.toBase58());
    console.log('   Payer:', payerKeypair.publicKey.toBase58());
    
    const tx = await program.methods
      .rewardUser()
      .accounts({
        gameState: GAME_STATE_ADDRESS,
        tokenMint: TOKEN_MINT_ADDRESS,
        gameAuthority: gameAuthorityPDA,
        recipientTokenAccount: recipientTokenAccount,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc();

    console.log('✅ Transaction successful!');
    console.log('📝 Signature:', tx);
    console.log(`💰 Minted ${actualRewardAmount} DGEN (${actualRewardAmount / 1e9} tokens)`);

    return NextResponse.json({
      success: true,
      amount: actualRewardAmount,
      requestedAmount: amount,
      recipient: recipientWallet,
      signature: tx,
      explorerUrl: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
    });

  } catch (error: any) {
    console.error('❌ Error minting tokens:', error);
    
    // Extract detailed error information
    const errorDetails: any = {
      message: error.message,
      logs: error.logs || [],
      code: error.code,
      name: error.name,
    };
    
    // If it's an Anchor error, try to get more details
    if (error.logs && error.logs.length > 0) {
      console.error('Program Logs:');
      error.logs.forEach((log: string) => console.error('  ', log));
    }
    
    // Check for common errors
    if (error.message?.includes('Assertion failed') || error.message?.includes('0x1')) {
      errorDetails.hint = 'This usually means a constraint in the program failed. Check that all accounts are correct and have the right permissions.';
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to mint tokens',
        details: errorDetails
      },
      { status: 500 }
    );
  }
}

