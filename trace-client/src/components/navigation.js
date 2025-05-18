'use client';

import Link from 'next/link';
import Image from 'next/image';

import logoImage from '/public/next.svg';
import { useEffect, useState, useContext } from 'react';
import { NearContext } from '@/context/near-context';

export default function Navigation() {
   const { signedAccountId, wallet } = useContext(NearContext);
  const [buttonAction, setAction] = useState(() => { });
   const [label, setLabel] = useState('Loading...');

  useEffect(() => {
    if (!wallet) return;

    if (signedAccountId) {
      setAction(() => wallet.signOut);
       setLabel(`Desconectar`);
    } else {
      setAction(() => wallet.signIn);
    
        setLabel('Conectar Wallet');
    }
  }, [signedAccountId, wallet]);


  
  return (
     <nav className="navbar">
      <div className="navbar-brand">
        <Link href="/" className="navbar-brand">
           <Image src={logoImage} alt="TraceFood Logo" width={120} height={30} className="navbar-logo" />
        </Link>
        <div className="navbar-links">
           <Link href="/farmer" className="navbar-link">Agricultor</Link>
           <Link href="/actors" className="navbar-link">Actores Cadena</Link>
           <Link href="/scan" className="navbar-link">Consultar Lote (QR)</Link>
        </div>
      </div>

      <div className="navbar-auth">
        {wallet && signedAccountId  ? ( 
          <>
            <span style={{marginRight: '10px', fontSize: '0.9em'}}>Loggeado como: <strong>{signedAccountId}</strong></span>
            <button
              onClick={buttonAction}
              className="btn-secondary"
            >
             {label}
            </button>
           </>
        ) : wallet ? ( 
          <button
            onClick={buttonAction}
            className="btn-primary"
          >
            {label}
          </button>
        ) : ( 
           <button className="btn-primary" disabled>
            Cargando...
          </button>
        )}
      </div>
    </nav>
  );
}











