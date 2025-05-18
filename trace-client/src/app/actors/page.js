// src/app/actors/page.js
'use client';

import { useEffect, useState, useContext } from 'react'; 

import nearConfig from '@/config'; 
import LotDetails from '@/components/LotDetails';
import { NearContext } from '@/context/near-context';

export default function ActorsPage() {
  const { wallet, signedAccountId } = useContext(NearContext);

  // Estado local del componente
  const [myPendingLots, setMyPendingLots] = useState([]);
  const [loadingLots, setLoadingLots] = useState(true);
  const [callingMethod, setCallingMethod] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Opcional: Estado para saber si la instancia de 'wallet' del contexto está lista
  const [isWalletReady, setIsWalletReady] = useState(false);

  useEffect(() => {
    // La instancia de 'wallet' del contexto puede ser undefined inicialmente
    // hasta que el RootLayout la inicialice.
    if (wallet) {
      setIsWalletReady(true);
    }
  }, [wallet]); // Se ejecuta cuando cambia la instancia de 'wallet'


  // Nombres de cuenta de actor que usaste para inicializar tu contrato
  // ¡ASEGÚRATE DE QUE ESTOS COINCIDAN EXACTAMENTE CON LOS DE TU CONTRATO!
  const STAGE_TRANSITIONS = {
      "Cosecha": "distribuidor-tf-hack.testnet", 
      "Llegada Distribuidor": "supermercado-tf-hack.testnet", 
      "Llegada Supermercado": "comprador-tf-hack.testnet" 
  };

   // Helper para obtener el nombre de la siguiente etapa
   const getNextStageName = (currentStage) => {
       const stages = Object.keys(STAGE_TRANSITIONS);
       const currentIndex = stages.indexOf(currentStage);
       if (currentIndex !== -1 && currentIndex < stages.length -1) {
           return stages[currentIndex + 1];
       }
       return null;
   };


  // useEffect para cargar los lotes cuando la wallet está lista y hay un usuario loggeado
  useEffect(() => {
    if (!isWalletReady || !signedAccountId) { // Espera a que wallet esté lista y haya login
        setMyPendingLots([]);
        setLoadingLots(false);
        return;
    }

    async function fetchLots() {
      setLoadingLots(true);
       setMessage('');
       setIsError(false);
      try {
        // 1. Obtener todos los IDs de lotes usando wallet.viewMethod
        const ids = await wallet.viewMethod({
            contractId: nearConfig.contractName, // El ID de tu contrato TraceFood
            method: 'get_all_lot_ids',
            // args: {} // No necesita args, pero la clase Wallet lo maneja
        });

        // 2. Para cada ID, obtener el estado y filtrar si es tu turno
        const pendingLots = [];
        if (ids && Array.isArray(ids)) { // Verifica que ids sea un array
            for (const id of ids) {
              const lot = await wallet.viewMethod({
                  contractId: nearConfig.contractName,
                  method: 'get_lot_state',
                  args: { lot_id: id }
              });
              if (lot && lot.expected_next_actor_id === signedAccountId) { // Usa signedAccountId
                 const nextStageToConfirm = getNextStageName(lot.current_stage);
                 if (nextStageToConfirm) {
                     pendingLots.push({...lot, nextStageToConfirm: nextStageToConfirm});
                 }
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

    fetchLots(); // Llama a fetchLots

    const refreshInterval = setInterval(fetchLots, 30000);
    return () => clearInterval(refreshInterval);

  }, [isWalletReady, signedAccountId, wallet]); // Dependencias: isWalletReady, signedAccountId, wallet


   const handleConfirmStage = async (lotId, nextStageName) => {
      if (!wallet || !signedAccountId) {
          setMessage("Por favor, asegúrate de estar conectado con tu wallet.");
          setIsError(true);
          return;
      }
      setCallingMethod(true);
      setMessage('');
      setIsError(false);
      try {
         // Llama a wallet.callMethod
         await wallet.callMethod({
            contractId: nearConfig.contractName,
            method: 'confirm_stage',
            args: {
                lot_id: lotId,
                stage_name: nextStageName,
            },
            // gas y deposit son opcionales, la clase Wallet tiene defaults
         });
         setMessage(`Etapa "${nextStageName}" confirmada para el lote "${lotId}"!`);
         setIsError(false);
         setMyPendingLots(prev => prev.filter(lot => lot.lot_id !== lotId));

      } catch (err) {
         console.error("Error confirming stage:", err);
         setMessage(`Error al confirmar etapa: ${err.message || err}`);
         setIsError(true);
      } finally {
         setCallingMethod(false);
      }
   };

  // Renderizado condicional
  if (!isWalletReady) { // Primero espera a que la instancia de wallet del contexto esté disponible
    return <div className="text-center py-8" style={{color: 'var(--gray-600)'}}>Inicializando wallet...</div>;
  }

  if (!signedAccountId) { // Luego, si la wallet está lista pero no hay cuenta, pide login
    return <div className="text-center py-8" style={{color: 'var(--gray-600)'}}>Por favor, conecta tu wallet para acceder a esta sección de actores.</div>;
  }

  // Determinar el rol del actor actual
  const actorRole = (() => {
     const myAccount = signedAccountId; // Usa signedAccountId
     if (myAccount === STAGE_TRANSITIONS["Cosecha"]) return 'Distribuidor (Siguiente Actor después de Cosecha)';
     if (myAccount === STAGE_TRANSITIONS["Llegada Distribuidor"]) return 'Supermercado (Siguiente Actor después de Distribuidor)';
     if (myAccount === STAGE_TRANSITIONS["Llegada Supermercado"]) return 'Comprador Final (Siguiente Actor después de Supermercado)';
     return 'Actor Desconocido';
  })();


  return (
    <div className="container mx-auto py-8"> {/* Estilos CSS planos */}
      <h1 style={{fontSize: '2em', marginBottom: '1.5rem'}}>Panel de Actores de la Cadena</h1>
      <p style={{fontSize: '1.25em', color: 'var(--gray-700)', marginBottom: '1rem'}}>
        Loggeado como: <strong style={{color: 'var(--trace-dark-green)'}}>{signedAccountId}</strong> (<span style={{fontStyle: 'italic'}}>{actorRole}</span>)
      </p>

      {message && (
         <div className={`message ${isError ? 'error' : 'success'} mb-6`}>
            {message}
         </div>
      )}

      <h2 style={{fontSize: '1.5em', marginBottom: '1rem'}}>Lotes Pendientes para Ti:</h2>

      {loadingLots ? (
        <div className="text-center" style={{color: 'var(--gray-600)'}}>Cargando lotes pendientes...</div>
      ) : myPendingLots.length === 0 ? (
        <div className="text-center" style={{color: 'var(--gray-600)'}}>No hay lotes pendientes para que tú confirmes en este momento.</div>
      ) : (
        <div className="space-y-6">
          {myPendingLots.map(lot => (
            <div key={lot.lot_id} className="panel panel-border-green">
               <h3 style={{fontSize: '1.25em', marginBottom: '0.75rem'}}>
                 {lot.description} <span style={{color: 'var(--gray-500)', fontSize: '0.875em'}}>({lot.lot_id})</span>
               </h3>
               <p style={{color: 'var(--gray-700)', marginBottom: '0.75rem'}}>
                 <strong style={{color: 'var(--gray-600)'}}>Etapa Actual:</strong> {lot.current_stage}
               </p>

               {lot.nextStageToConfirm ? (
                   <button
                       onClick={() => handleConfirmStage(lot.lot_id, lot.nextStageToConfirm)}
                       className={`btn-primary mt-3 ${callingMethod ? 'opacity-50 cursor-not-allowed' : ''}`}
                       disabled={callingMethod}
                   >
                       {callingMethod ? 'Confirmando...' : `Confirmar "${lot.nextStageToConfirm}"`}
                   </button>
               ) : (
                   <p style={{color: 'green', marginTop: '0.75rem'}}>
                     Este lote está en la última etapa asignada a ti o completado.
                   </p>
               )}
               {/* Opcional: <LotDetails lot={lot} /> si quieres mostrar todo aquí */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}