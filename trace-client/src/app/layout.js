
'use client'


import '@/app/globals.css';


import '@near-wallet-selector/modal-ui/styles.css';

import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';

import { setupSender } from '@near-wallet-selector/sender'; 
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet'; 
import nearConfig from '@/config'; 



import { WalletSelectorProvider } from '@near-wallet-selector/react-hook';
import { NearProvider } from '@/context/near-context';
import Navigation from '@/components/navigation';


const walletSelectorConfig = {
  network: nearConfig.networkId,
  // createAccessKeyFor: nearConfig.contractName,
   createAccessKeyFor: nearConfig.contractName,

  modules: [
    setupMyNearWallet(), 
     setupSender(),
     setupMeteorWallet()
  ],
};

// Layout Component
export default function RootLayout({ children }) {

  return (
    <html lang="en">
      <body>
        <WalletSelectorProvider config={walletSelectorConfig}>
          <NearProvider>
            <Navigation />
             <main className="container" style={{paddingTop: '1rem', paddingBottom: '1rem'}}> 
               {children}
             </main>
          </NearProvider>
        </WalletSelectorProvider>
      </body>
    </html>
  );
}