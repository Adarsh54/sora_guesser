# Token Minting Integration Guide

## Overview

The dgenerate app now automatically mints DGEN tokens to users' wallets when they correctly guess image/video prompts! 🎉

## How It Works

### User Flow
1. User connects their Solana wallet (via Phantom, Solflare, etc.)
2. User views an image or video challenge
3. User submits a guess for the prompt
4. System calculates similarity score using Levenshtein distance
5. **If correct** (≥70% similarity):
   - DGEN tokens are automatically minted to the user's wallet
   - Transaction signature is displayed
   - User receives instant feedback

### Technical Flow

```
Frontend (ReelCard.tsx)
    ↓
    submits guess
    ↓
/api/submit-guess
    ↓
    calculates similarity
    ↓
    if correct → calls /api/mint-tokens
    ↓
/api/mint-tokens
    ↓
    loads BACKEND_WALLET_SECRET_KEY
    ↓
    creates Anchor Program instance
    ↓
    calls reward_user instruction
    ↓
Solana Program (dgenerate)
    ↓
    verifies authority
    ↓
    mints tokens via game_authority PDA
    ↓
    tokens arrive in user's wallet ✨
```

## Token Rewards

- **Correct Guess**: 100 DGEN tokens (0.0000001 DGEN)
- Rewards implement halving mechanism (defined in smart contract)
- All transactions happen on Solana Devnet

## Configuration

### Required Environment Variables (frontend/.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://fjdttygzjctxuvaujbqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Backend Wallet (for server-side minting)
BACKEND_WALLET_SECRET_KEY=<base58-encoded-secret-key>
```

### Important Notes

⚠️ **BACKEND_WALLET_SECRET_KEY must be from the same wallet that initialized the smart contract!**

This wallet is stored as the `authority` in the game state and is the only wallet authorized to call the `reward_user` instruction.

## Token & Program Addresses

| Component | Address |
|-----------|---------|
| Token Mint | `AvuRwgvgvk4cvUTFhmdJSHAV8BCb4bLYP3DbLB6ugpD7` |
| Program ID | `EPKw6RHc8Bf7m8BpKxv66NMmzqwnn7tSRwcyJ9cNbNnD` |
| Game State | `3iJN6JPCgjrhBKyMaRDe9Kjy5X5U562padf1NKEGohhM` |
| Game Authority PDA | `FvLbjrPUZzvz3N1YbE136XbqdzMphSHY2rXUuWRWoicY` |

## Testing

### 1. Verify Configuration

```bash
cd frontend
npx esrun scripts/test-mint-integration.ts
```

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

### 3. Test in Browser

1. Open `http://localhost:3000`
2. Connect your Solana wallet
3. View a challenge
4. Submit a guess
5. Check browser console for logs
6. Check terminal for backend logs
7. Verify tokens in your wallet (use Solana Explorer or wallet UI)

## API Endpoints

### POST /api/submit-guess

Processes user guesses and handles token minting.

**Request:**
```json
{
  "imageId": "uuid",
  "walletId": "base58-pubkey",
  "guessText": "user's guess",
  "actualPrompt": "correct prompt"
}
```

**Response:**
```json
{
  "success": true,
  "isCorrect": true,
  "similarityScore": 95.5,
  "tokensEarned": 100,
  "guess": { /* guess record */ },
  "userStats": { /* user stats */ },
  "minting": {
    "success": true,
    "amount": 100,
    "recipient": "base58-pubkey",
    "signature": "transaction-signature",
    "explorerUrl": "https://explorer.solana.com/tx/..."
  }
}
```

### POST /api/mint-tokens

Server-side endpoint for minting tokens (called by submit-guess).

**Request:**
```json
{
  "recipientWallet": "base58-pubkey",
  "amount": 100
}
```

**Response:**
```json
{
  "success": true,
  "amount": 100,
  "recipient": "base58-pubkey",
  "signature": "transaction-signature",
  "explorerUrl": "https://explorer.solana.com/tx/..."
}
```

## Troubleshooting

### "Backend wallet not configured"
- Make sure `BACKEND_WALLET_SECRET_KEY` is set in `frontend/.env.local`
- Restart the dev server after changing environment variables

### "Authority mismatch" or "Unauthorized"
- Ensure `BACKEND_WALLET_SECRET_KEY` is from the wallet that initialized the contract
- Check that the public key matches the `authority` in the game state

### "Failed to fetch program IDL"
- Verify the program is deployed to devnet
- Check that `PROGRAM_ID` is correct

### "Token account not found"
- The system automatically creates token accounts
- If issues persist, check that the recipient wallet is valid

### Transaction Fails
- Check devnet is operational
- Verify backend wallet has SOL for transaction fees
- Check Solana Explorer for detailed error logs

## Security Notes

🔐 **NEVER commit `.env.local` to git!**

- The `.env.local` file is already in `.gitignore`
- `BACKEND_WALLET_SECRET_KEY` controls token minting
- Keep this key secure and rotate if compromised
- Only use this setup on devnet for testing

## Viewing Transactions

All transactions can be viewed on Solana Explorer:

**Devnet Explorer:**
`https://explorer.solana.com/?cluster=devnet`

Look up by:
- Transaction signature (returned in API response)
- Token mint address
- User's wallet address

## Next Steps

- [ ] Add transaction history UI
- [ ] Display user's DGEN balance on frontend
- [ ] Add leaderboard showing top earners
- [ ] Implement token halving visualization
- [ ] Add transaction confirmation modals
- [ ] Support mainnet deployment (when ready)

---

Built with ❤️ using Solana, Anchor, Next.js, and Supabase


