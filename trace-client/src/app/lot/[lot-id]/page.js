// src/app/lot/[lot_id]/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import LotDetails from '@/components/LotDetails'; 
import { viewMethod } from '@/wallets/web3modal'; 

export default function LotDetailPage() {
  const { lot_id } = useParams();
  const [lotState, setLotState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    if (!lot_id) return;

    async function fetchLot() {
      setIsLoading(true);
      setError(null);
      try {
        const state = await viewMethod('get_lot_state', { lot_id });
        setLotState(state);
      } catch (err) {
        console.error("Error fetching lot state:", err);
        setError(err?.message || "No se pudo cargar el estado del lote.");
        setLotState(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLot();
  }, [lot_id]);

  if (isLoading) return <div className="text-center py-8" style={{color: 'var(--gray-600)'}}>Cargando detalles del lote...</div>;
  if (error) return <div className="text-center py-8" style={{color: 'red'}}>Error: {error}</div>;
  if (!lotState) return <div className="text-center py-8" style={{color: 'var(--gray-600)'}}>Lote con ID "{lot_id}" no encontrado.</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 style={{fontSize: '2em', marginBottom: '1.5rem'}}>Detalles del Lote</h1>
      <LotDetails lot={lotState} />
      <div className="mt-4 text-center">
        <p style={{color: 'var(--gray-600)'}}>Comparte este lote:</p>
        <p style={{color: 'blue', wordBreak: 'break-all'}}>{currentUrl}</p>
      </div>
    </div>
  );
}