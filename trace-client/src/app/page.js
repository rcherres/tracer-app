import Image from 'next/image';

import NearLogo from '/public/near.svg';
import NextLogo from '/public/next.svg';
import styles from './app.module.css';
import { Cards } from '/public/next.svg';

import Link from 'next/link';

import logoImage from '/public/next.svg';

export default function Home() {
  return (
     <div className="flex-col-center min-h-screen-adjusted py-2"> 
      <div className="text-center"> 
         <Image src={logoImage} alt="TraceFood Logo grande" width={250} height={60} style={{margin: '0 auto 1.5rem'}} /> 
        <h1 style={{fontSize: '2.5em', marginBottom: '1rem'}} className="md:text-5xl"> 
          Transparencia del Campo a Tu Mesa
        </h1>
        <p style={{fontSize: '1.25em', color: 'var(--gray-700)', marginBottom: '2rem'}} className="md:text-xl"> 
          Rastrea el origen y el viaje de tus alimentos orgánicos usando la tecnología blockchain de NEAR.
        </p>

        <div className="flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 flex-center"> 
          <Link href="/scan" className="btn-primary" style={{backgroundColor: 'var(--trace-light-green)', color: 'var(--trace-dark-green)', fontWeight: '600', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>{/* inline-block px-6 py-3 bg-trace-light-green text-trace-dark-green font-semibold rounded-lg shadow hover:bg-trace-medium-green transition duration-200 text-center */}
             Escanear QR (Ver Lote)
          </Link>
          <Link href="/farmer" className="btn-secondary" style={{fontWeight: '600', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>{/* inline-block px-6 py-3 border border-trace-dark-green text-trace-dark-green font-semibold rounded-lg shadow hover:bg-trace-dark-green hover:text-white transition duration-200 text-center */}
            Soy Agricultor
          </Link>
           <Link href="/actors" className="btn-outline-gray" style={{fontWeight: '600', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>{/* inline-block px-6 py-3 border border-gray-400 text-gray-700 font-semibold rounded-lg shadow hover:border-trace-dark-green hover:text-trace-dark-green transition duration-200 text-center */}
             Soy Actor Cadena
           </Link>
        </div>
      </div>
    </div>
  );
}