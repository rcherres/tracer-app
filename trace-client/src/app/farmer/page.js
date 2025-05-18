// src/app/farmer/page.js
'use client';

import { useState } from 'react';
import { useNear } from '@/context/near-context';
import { callMethod } from '@/wallets/web3modal';

export default function FarmerPage() {
  const { accountId, isSignedIn } = useNear();
  const [lotId, setLotId] = useState('');
  const [description, setDescription] = useState('');
  const [cropType, setCropType] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [certifications, setCertifications] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);


  if (!isSignedIn) {
    return <div className="text-center py-8" style={{color: 'var(--gray-600)'}}>Por favor, conecta tu wallet para acceder a esta sección.</div>;
  }

  const handleMintLot = async (e) => {
    e.preventDefault();
    if (!lotId || !description || !cropType || !farmLocation) {
        setMessage("Por favor, completa todos los campos obligatorios.");
        setIsError(true);
        return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);

    const initialMetadata = {
        crop_type: cropType,
        farm_location: farmLocation,
        certifications: certifications.split(',').map(cert => cert.trim()).filter(cert => cert),
    };

    try {
      await callMethod('mint_lot', {
          lot_id: lotId,
          description: description,
          initial_metadata: initialMetadata
      });

      setMessage(`Lote "${lotId}" creado exitosamente!`);
      setIsError(false);
      setLotId('');
      setDescription('');
      setCropType('');
      setFarmLocation('');
      setCertifications('');

    } catch (err) {
      console.error("Error minting lot:", err);
      setMessage(`Error al crear el lote: ${err.message || err}`);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8"> {/* container mx-auto py-8 */}
      <h1 style={{fontSize: '2em', marginBottom: '1.5rem'}}>{/* text-3xl font-bold text-trace-dark-green mb-6 */} Panel del Agricultor</h1>

       <div className="panel max-w-md mx-auto"> {/* bg-white shadow-md rounded-lg p-6 max-w-md mx-auto */}
         <h2 style={{fontSize: '1.5em', marginBottom: '1rem'}}>{/* text-2xl font-semibold text-gray-700 mb-4 */} Crear Nuevo Lote</h2>
         <form onSubmit={handleMintLot} className="space-y-4"> {/* space-y-4 */}
           <div className="form-group">
             <label htmlFor="lotId">ID del Lote (Único)</label> {/* block text-gray-700 font-semibold mb-1 */}
             <input
               id="lotId"
               type="text"
               value={lotId}
               onChange={(e) => setLotId(e.target.value)}
               className="text-input" // w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-trace-medium-green
               required
             />
           </div>
            <div className="form-group">
             <label htmlFor="description">Descripción</label> {/* block text-gray-700 font-semibold mb-1 */}
             <input
               id="description"
               type="text"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               className="text-input"
               required
             />
           </div>
            <div className="form-group">
             <label htmlFor="cropType">Tipo de Cultivo</label> {/* block text-gray-700 font-semibold mb-1 */}
             <input
               id="cropType"
               type="text"
               value={cropType}
               onChange={(e) => setCropType(e.target.value)}
               className="text-input"
               required
             />
           </div>
            <div className="form-group">
             <label htmlFor="farmLocation">Ubicación Granja</label> {/* block text-gray-700 font-semibold mb-1 */}
             <input
               id="farmLocation"
               type="text"
               value={farmLocation}
               onChange={(e) => setFarmLocation(e.target.value)}
               className="text-input"
               required
             />
           </div>
            <div className="form-group">
             <label htmlFor="certifications">Certificaciones (separadas por coma)</label> {/* block text-gray-700 font-semibold mb-1 */}
             <input
               id="certifications"
               type="text"
               value={certifications}
               onChange={(e) => setCertifications(e.target.value)}
               className="text-input"
             />
           </div>

           <button
             type="submit"
             className={`btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} // w-full px-4 py-2 bg-trace-dark-green text-white font-semibold rounded-md hover:bg-trace-light-green transition duration-200
             disabled={loading}
           >
             {loading ? 'Creando Lote...' : 'Crear Lote en Blockchain'}
           </button>
         </form>

          {message && (
             <div className={`message ${isError ? 'error' : 'success'}`}> {/* mt-4 p-3 rounded-md text-center ${isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} */}
                {message}
             </div>
          )}

       </div>
    </div>
  );
}