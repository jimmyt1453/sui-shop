import { createDAppKit } from '@mysten/dapp-kit-react';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { NETWORK, GRPC_URLS } from './config/constants';

export const dAppKit = createDAppKit({
  networks: [NETWORK],
  createClient: (network) =>
    new SuiGrpcClient({
      network: network as 'testnet' | 'mainnet',
      baseUrl: GRPC_URLS[network as keyof typeof GRPC_URLS],
    }),
});

// Register types for hooks
declare module '@mysten/dapp-kit-react' {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}
