// src/app/actors/page.js
'use client';

import { useEffect, useState } from 'react';
import { useNear } from '@/context/near-context';
import { viewMethod, callMethod } from '@/wallets/web3modal';
import LotDetails from '@/components/LotDetails'; // Reutiliza el componente


export default function ActorsPage() {
  const { accountId, isSignedIn } = useNear();
  const [myPendingLots, setMyPendingLots] = useState([]);
  const [loadingLots, setLoadingLots] = useState(true);
  const [callingMethod, setCallingMethod] = useState(false);
   const [message, setMessage] = useState('');
   const [isError, setIsError] = useState(false);


  // HARDCODEA AQUÍ EL MISMO MAPEO QUE USaste EN CONTRATO INIT (¡con tus IDs REALES!)
  const STAGE_TRANSITIONS = {
      "Cosecha": "distribuidor-abc.testnet", // <-- REEMPLAZA
      "Llegada Distribuidor": "supermercado-abc.testnet", // <-- REEMPLAZA
      "Llegada Supermercado": "comprador-abc.testnet" // <-- REEMPLAZA
  };

   // Helper para obtener el nombre de la siguiente etapa basado en la etapa actual y el mapeo
   const getNextStageName = (currentStage) => {
       const stages = Object.keys(STAGE_TRANSITIONS);
       const currentIndex = stages.indexOf(currentStage);
       if (currentIndex !== -1 && currentIndex < stages.length -1) {
           return stages[currentIndex + 1];
       }
       return null; // No hay siguiente etapa o es la última
   };


  useEffect(() => {
    if (!isSignedIn) {
        setMyPendingLots([]);
        setLoadingLots(false);
        return;
    }

    async function fetchLots() {
      setLoadingLots(true);
       setMessage('');
       setIsError(false);
      try {
        // 1. Obtener todos los IDs de lotes
        const ids = await viewMethod('get_all_lot_ids');

        // 2. Para cada ID, obtener el estado y filtrar si es tu turno
        const pendingLots = [];
        for (const id of ids) {
          const lot = await viewMethod('get_lot_state', { lot_id: id });
          if (lot && lot.expected_next_actor_id === accountId) {
             // Añade el nombre de la próxima etapa esperada para mostrarla en el frontend
             const nextStageToConfirm = getNextStageName(lot.current_stage);
             // Solo añade a la lista si realmente hay una siguiente etapa a confirmar
             if (nextStageToConfirm) {
                 pendingLots.push({...lot, nextStageToConfirm: nextStageToConfirm});
             }
          }
        }
        setMyPendingLots(pendingLots);

      } catch (err) {
        console.error("Error fetching lot IDs or states:", err);
        setMessage(`Error cargando lotes: ${err.message || err}`);
        setIsError(true);
      } finally {
        setLoadingLots(false);
      }
    }

    fetchLots();

    const refreshInterval = setInterval(fetchLots, 30000); // Refrescar cada 30 segundos
    return () => clearInterval(refreshInterval); // Limpiar intervalo

  }, [accountId, isSignedIn]); // Depende de accountId y isSignedIn


   const handleConfirmStage = async (lotId, nextStageName) => {
      setCallingMethod(true);
      setMessage('');
      setIsError(false);
      try {
         await callMethod('confirm_stage', {
            lot_id: lotId,
            stage_name: nextStageName, // Usar el nombre de la siguiente etapa
         });
         setMessage(`Etapa "${nextStageName}" confirmada para el lote "${lotId}"!`);
         setIsError(false);

         // Elimina el lote de la lista localmente para que desaparezca de la vista "Pendientes para Ti"
         setMyPendingLots(prev => prev.filter(lot => lot.lot_id !== lotId));


      } catch (err) {
         console.error("Error confirming stage:", err);
         setMessage(`Error al confirmar etapa: ${err.message || err}`);
         setIsError(true);
      } finally {
         setCallingMethod(false);
      }
   };


  if (!isSignedIn) {
    return <div className="text-center py-8" style={{color: 'var(--gray-600)'}}>Por favor, conecta tu wallet para acceder a esta sección de actores.</div>;
  }

  const actorRole = (() => {
     const myAccount = accountId;
     if (myAccount === STAGE_TRANSITIONS["Cosecha"]) return 'Distribuidor (Siguiente Actor después de Cosecha)';
     if (myAccount === STAGE_TRANSITIONS["Llegada Distribuidor"]) return 'Supermercado (Siguiente Actor después de Distribuidor)';
     if (myAccount === STAGE_TRANSITIONS["Llegada Supermercado"]) return 'Comprador Final (Siguiente Actor después de Supermercado)';
     return 'Actor Desconocido';
  })();


  return (
    <div className="container mx-auto py-8"> {/* container mx-auto py-8 */}
      <h1 style={{fontSize: '2em', marginBottom: '1.5rem'}}>{/* text-3xl font-bold text-trace-dark-green mb-6 */} Panel de Actores de la Cadena</h1>
      <p style={{fontSize: '1.25em', color: 'var(--gray-700)', marginBottom: '1rem'}}>{/* text-xl text-gray-700 mb-4 */} Loggeado como: <strong style={{color: 'var(--trace-dark-green)'}}>{accountId}</strong> (<span style={{fontStyle: 'italic'}}>{actorRole}</span>)</p>


      {message && (
         <div className={`message ${isError ? 'error' : 'success'} mb-6`}> {/* mt-4 p-3 rounded-md text-center mb-6 ${isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} */}
            {message}
         </div>
      )}

      <h2 style={{fontSize: '1.5em', marginBottom: '1rem'}}>{/* text-2xl font-semibold text-gray-700 mb-4 */} Lotes Pendientes para Ti:</h2>

      {loadingLots ? (
        <div className="text-center" style={{color: 'var(--gray-600)'}}>{/* text-center text-gray-600 */} Cargando lotes pendientes...</div>
      ) : myPendingLots.length === 0 ? (
        <div className="text-center" style={{color: 'var(--gray-600)'}}>{/* text-center text-gray-600 */} No hay lotes pendientes para que tú confirmes en este momento.</div>
      ) : (
        <div className="space-y-6"> {/* space-y-6 */}
          {myPendingLots.map(lot => (
            <div key={lot.lot_id} className="panel panel-border-green"> {/* bg-white shadow-md rounded-lg p-6 border border-trace-medium-green */}
               <h3 style={{fontSize: '1.25em', marginBottom: '0.75rem'}}>{/* text-xl font-bold text-trace-dark-green mb-3 */} {lot.description} <span style={{color: 'var(--gray-500)', fontSize: '0.875em'}}>{/* text-gray-500 text-base */} ({lot.lot_id})</span></h3>
               <p style={{color: 'var(--gray-700)', marginBottom: '0.75rem'}}><strong style={{color: 'var(--gray-600)'}}>{/* text-gray-600 */} Etapa Actual:</strong> {lot.current_stage}</p>

               {/* nextStageToConfirm se calcula en useEffect */}
               {lot.nextStageToConfirm ? (
                   <button
                       onClick={() => handleConfirmStage(lot.lot_id, lot.nextStageToConfirm)}
                       className={`btn-primary mt-3 ${callingMethod ? 'opacity-50 cursor-not-allowed' : ''}`} // px-4 py-2 mt-3 bg-trace-dark-green text-white font-semibold rounded-md hover:bg-trace-light-green transition duration-200
                       disabled={callingMethod}
                   >
                       {callingMethod ? 'Confirmando...' : `Confirmar "${lot.nextStageToConfirm}"`}
                   </button>
               ) : (
                   <p style={{color: 'green', marginTop: '0.75rem'}}>{/* text-green-600 mt-3 */} Este lote está en la última etapa asignada a ti.</p>
               )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}