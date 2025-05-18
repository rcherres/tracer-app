// src/components/LotDetails.js
import React from 'react';

export default function LotDetails({ lot }) {
  if (!lot) {
    return <p className="text-gray-600">Lote no encontrado.</p>; 
  }

  const formatTimestamp = (nanoTimestamp) => {
     const milliseconds = Number(BigInt(nanoTimestamp) / 1_000_000n);
     return new Date(milliseconds).toLocaleString();
  };

  return (
    <div className="panel panel-border-green mb-6"> 
      <h3 className="text-2xl font-bold text-trace-dark-green mb-4">{lot.description} <span style={{color: 'var(--gray-500)', fontSize: '0.875em'}}>{/* text-gray-500 text-lg */} ({lot.lot_id})</span></h3>
    

      <div className="lot-details-grid mb-6"> 
        <div>
          <h4 style={{color: 'var(--gray-700)'}}>Detalles Iniciales:</h4>
          <p><strong>Agricultor:</strong> {lot.farmer_id}</p>
          <p><strong>Tipo de Cultivo:</strong> {lot.initial_metadata?.crop_type || 'N/A'}</p>
          <p><strong>Ubicación Granja:</strong> {lot.initial_metadata?.farm_location || 'N/A'}</p>
          <p><strong>Certificaciones:</strong> {lot.initial_metadata?.certifications?.join(', ') || 'Ninguna'}</p>
        </div>
        <div>
           <h4 style={{color: 'var(--gray-700)'}}> Estado Actual:</h4>
           <p><strong>Etapa Actual:</strong> <span style={{fontWeight: 'semibold', color: 'var(--trace-dark-green)'}}> {lot.current_stage}</span></p>
           <p><strong>Próximo Actor Esperado:</strong> {lot.expected_next_actor_id || 'Lote completado'}</p>
           <p><strong>Estado de Pago:</strong> <span style={{fontWeight: 'semibold', color: lot.payment_status === 'Fully Paid' ? 'green' : 'orange'}}>{/* font-semibold text-green-600/text-orange-500 */} {lot.payment_status}</span></p>
        </div>
      </div>

      <div>
        <h4 style={{color: 'var(--gray-700)'}}> Historial de Trazabilidad:</h4>
        {lot.events && lot.events.length > 0 ? (
          <ul className="space-y-3"> 
            {lot.events.map((event, index) => (
              <li key={index} className="event-item">
                <p><strong style={{color: 'var(--gray-700)'}}>{/* text-gray-700 */} {event.stage}</strong> por <span style={{color: 'var(--trace-dark-green)'}}>{/* text-trace-dark-green */} {event.actor_id}</span></p>
                <p style={{fontSize: '0.875em', color: 'var(--gray-500)'}}>{/* text-sm text-gray-500 */} {formatTimestamp(event.timestamp)}</p>
                {event.location && <p style={{fontSize: '0.875em', color: 'var(--gray-500)'}}>Ubicación: {event.location}</p>} {/* text-sm text-gray-500 */}
                {event.notes && <p style={{fontSize: '0.875em', color: 'var(--gray-500)'}}>Notas: {event.notes}</p>} {/* text-sm text-gray-500 */}
                {event.photo_url && <p style={{fontSize: '0.875em', color: 'blue', textDecoration: 'underline'}}><a href={event.photo_url} target="_blank" rel="noopener noreferrer">Ver Foto</a></p>} {/* text-sm text-blue-600 hover:underline */}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{color: 'var(--gray-600)'}}>{/* text-gray-600 */} No hay eventos registrados aún.</p>
        )}
      </div>

       <div className="ai-section"> {/* mt-6 pt-6 border-t border-gray-200 */}
         <h4 style={{color: 'var(--gray-700)'}}>{/* text-lg font-semibold text-gray-700 mb-2 */} Asistente IA:</h4>
         <p style={{color: 'var(--gray-600)', fontSize: '0.875em'}}>{/* text-gray-600 text-sm mb-3 */} Pregunta a nuestro agente IA sobre la historia de este lote.</p>
         <div className="flex space-x-2"> {/* flex space-x-2 */}
             <input type="text" placeholder="Ej: ¿Es este lote orgánico?" style={{flexGrow: 1}} className="text-input" /> {/* flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-trace-medium-green */}
             <button className="btn-primary"> {/* px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 */} Preguntar</button>
         </div>
       </div>
    </div>
  );
}