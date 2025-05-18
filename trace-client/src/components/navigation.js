'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useNear } from '../context/near-context';
// import logoImage from '../../public/Tracefood.png';
import logoImage from '/public/next.svg';


export default function Navigation() {
  const { accountId, isSignedIn, signIn, signOut } = useNear();

  return (
    <nav className="navbar"> {/* bg-white shadow p-4 flex justify-between items-center */}
      <div className="navbar-brand"> {/* flex items-center space-x-2 */}
        <Link href="/" className="navbar-brand"> {/* flex items-center space-x-2 */}
           <Image src={logoImage} alt="TraceFood Logo" width={120} height={30} className="navbar-logo" /> {/* className="mx-auto mb-6" */}
           {/* Eliminamos el span de texto del logo si solo usamos la imagen */}
        </Link>
        <div className="navbar-links"> {/* ml-6 flex space-x-4 */}
           <Link href="/farmer" className="navbar-link"> {/* text-gray-700 hover:text-trace-dark-green */}
             Agricultor
           </Link>
            <Link href="/actors" className="navbar-link"> {/* text-gray-700 hover:text-trace-dark-green */}
             Actores Cadena
           </Link>
        </div>
      </div>

      <div className="navbar-auth"> {/* flex items-center space-x-2 */}
        {isSignedIn ? (
          <> {/* Fragmento */}
            <span>Loggeado como: <strong>{accountId}</strong></span> {/* text-sm text-gray-600, strong text-trace-dark-green */}
            <button
              onClick={signOut}
              className="btn-secondary" // px-4 py-2 border border-trace-dark-green text-trace-dark-green rounded hover:bg-trace-dark-green hover:text-white transition duration-200
            >
              Desconectar
            </button>
           </>
        ) : (
          <button
            onClick={signIn}
            className="btn-primary" // px-4 py-2 bg-trace-dark-green text-white rounded hover:bg-trace-light-green transition duration-200
          >
            Conectar Wallet
          </button>
        )}
      </div>
    </nav>
  );
}











// import Image from 'next/image';
// import Link from 'next/link';
// import { useEffect, useState } from 'react';

// import NearLogo from '/public/near-logo.svg';
// import { useWalletSelector } from '@near-wallet-selector/react-hook';

// export const Navigation = () => {
//   const { signedAccountId, signIn, signOut } = useWalletSelector();
//   const [action, setAction] = useState(() => { });
//   const [label, setLabel] = useState('Loading...');

//   useEffect(() => {
//     if (signedAccountId) {
//       setAction(() => signOut);
//       setLabel(`Logout ${signedAccountId}`);
//     } else {
//       setAction(() => signIn);
//       setLabel('Login');
//     }
//   }, [signedAccountId, signIn, signOut]);

//   return (
//     <nav className="navbar navbar-expand-lg">
//       <div className="container-fluid">
//         <Link href="/" passHref>
//           <Image priority src={NearLogo} alt="NEAR" width="30" height="24" className="d-inline-block align-text-top" />
//         </Link>
//         <div className='navbar-nav pt-1'>
//           <button className="btn btn-secondary" onClick={action} > {label} </button>
//         </div>
//       </div>
//     </nav>
//   );
// };