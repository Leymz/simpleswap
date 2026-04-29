import { NextRequest, NextResponse } from 'next/server';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

const TOKEN_ADDRESSES = {
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  EURC: '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4',
};

export async function POST(request: NextRequest) {
  try {
    const { walletId, tokenSymbol } = await request.json();

    if (!walletId || !tokenSymbol) {
      return NextResponse.json(
        { error: 'Missing walletId or tokenSymbol' },
        { status: 400 }
      );
    }

    const client = initiateDeveloperControlledWalletsClient({
      apiKey: process.env.CIRCLE_API_KEY!,
      entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
    });

    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];

    if (!tokenAddress) {
      return NextResponse.json(
        { error: 'Invalid token symbol' },
        { status: 400 }
      );
    }

    const balanceResponse = await client.getWalletTokenBalance({
      id: walletId,
      tokenAddress,
    });

    const balance = balanceResponse.data?.tokenBalance?.amount || '0';

    return NextResponse.json({ success: true, balance });
  } catch (error: any) {
    console.error('Balance API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}