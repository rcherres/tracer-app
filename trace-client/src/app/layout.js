
'use client'


import '@/app/globals.css';


import '@near-wallet-selector/modal-ui/styles.css';


import  { NetworkId } from '@/config'; 




import { NearContext } from '@/context/near-context';
import Navigation from '@/components/navigation';
import { Wallet } from '@/wallets/web3modal';
import { useEffect, useState } from 'react';




const wallet = new Wallet({ networkId: NetworkId });

// Layout Component
export default function RootLayout({ children }) {

  const [signedAccountId, setSignedAccountId] = useState('');

  useEffect(() => { wallet.startUp(setSignedAccountId) }, []);  
  return (
    <html lang="en">
      <body>
       
         <NearContext.Provider value={{ wallet, signedAccountId }}>
            <Navigation />
             <main className="container" style={{paddingTop: '1rem', paddingBottom: '1rem'}}> 
               {children}
             </main>
          </NearContext.Provider>
      
      </body>
    </html>
  );
}