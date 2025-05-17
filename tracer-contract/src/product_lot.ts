
import { AccountId } from 'near-sdk-js';

/**
 * la estructura de un evento en la trazabilidad de un lote.
 */
export interface LotEvent {
  stage: string;         // Nombre de la etapa (ej: "Cosecha", "Llegada Distribuidor")
  actor_id: AccountId;   // Cuenta que confirmó la etapa
  timestamp: bigint;     // Marca de tiempo del registro (en nanosegundos)
  location?: string;     // Opcional: ubicación
  notes?: string;        // Opcional: notas adicionales
  photo_url?: string;    // Opcional: URL de una foto (simulada)
}

/**
 * Define la estructura de un lote de alimento siendo trazado.
 */
export interface FoodLot {
  lot_id: string;         // ID único del lote
  farmer_id: AccountId;   // Cuenta del agricultor que creó el lote
  description: string;    // Descripción del lote (ej: "Tomates Orgánicos Lote #123")
  initial_metadata: {     // Metadatos registrados al inicio (cosecha)
      crop_type: string;
      farm_location: string;
      certifications?: string[]; // Ej: ["USDA Organic", "Certificado Bio"]
      // Añadir más metadatos iniciales según necesidad
  }
  events: LotEvent[];     // Historial de eventos de trazabilidad
  current_stage: string;  // La última etapa confirmada
  expected_next_actor_id: AccountId | null; // La cuenta que debe confirmar la SIGUIENTE etapa, o null si es la etapa final
  payment_status: string; // Estado del pago (ej: "Pending", "Fully Paid")
  // amount_to_pay?: string; // Opcional: Cantidad a pagar al agricultor al final
}