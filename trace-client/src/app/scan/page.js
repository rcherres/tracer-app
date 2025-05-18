// src/app/scan/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ScanPage() {
  const [lotId, setLotId] = useState('');
  const router = useRouter();

  const handleScan = (e) => {
    e.preventDefault();
    if (lotId.trim()) {
      router.push(`/lot/${encodeURIComponent(lotId.trim())}`);
    }
  };

  return (
    <div className="flex-col-center min-h-screen-more-adjusted p-4"> 
      <div className="panel max-w-md w-full text-center"> 
        <h2 style={{fontSize: '1.5em'}}> Consultar Lote por ID</h2>
        <p style={{color: 'var(--gray-700)', marginBottom: '1rem'}}> Simula el escaneo de un código QR ingresando el ID del lote.</p>
        <form onSubmit={handleScan} className="space-y-4"> 
          <div className="form-group"> 
            <input
              id="lotId"
              type="text"
              value={lotId}
              onChange={(e) => setLotId(e.target.value)}
              placeholder="Ingresa el ID del Lote"
              className="text-input" 
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full" 
          >
            Ver Lote
          </button>
        </form>
      </div>
    </div>
  );
}