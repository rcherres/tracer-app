// Find all our documentation at https://docs.near.org
import { NearBindgen, near, call, view, initialize, LookupMap, AccountId, NearPromise } from 'near-sdk-js';
import { FoodLot, LotEvent } from './product_lot';




//  cantidad (en yoctoNEAR) a pagar al agricultor al completar el proceso
// 1 NEAR = 1e24 yoctoNEAR. Esto es 0.1 NEAR
const PAYMENT_AMOUNT_YOCTO: bigint = BigInt("100000000000000000000000")

// Define la clase principal del contrato.
@NearBindgen({})
class TraceFoodContract {
  // LookupMap para almacenar los lotes, mapeando el ID del lote a su estado FoodLot.
  // LookupMap es eficiente para colecciones grandes. El prefijo 'l' ayuda a NEAR a organizar los datos.
  lots: LookupMap<FoodLot> = new LookupMap('l');

  // Mapea el nombre de una etapa a la cuenta de testnet que se espera que confirme la SIGUIENTE etapa.
  // Esto define el flujo básico de actores para el MVP. Null indica la etapa final.
  // Record simple para esto en el estado del contrato.
  stage_transitions: Record<string, AccountId | null> = {};

  // Para el MVP, mantengamos una lista simple de IDs de lotes para listarlos fácilmente.
  // Nota: Para muchos lotes, sería más eficiente usar pagination o indexación separada.
  lot_ids: string[] = [];

  /**
   * Método de inicialización del contrato. Solo se puede llamar una vez al desplegar.
   * Configura el flujo de etapas y actores.
   * @param stage_transitions - Un objeto mapeando nombres de etapa a IDs de cuenta del siguiente actor esperado.
   */
  @initialize({})
  init({ stage_transitions }: { stage_transitions: Record<string, AccountId | null> }) {
    // Inicializa el mapeo de transiciones de etapa
    this.stage_transitions = stage_transitions;
    // Inicializa el LookupMap para los lotes (ya hecho en la declaración con new LookupMap).
    // Inicializa la lista de IDs de lotes (ya hecho en la declaración con []).
    near.log(`Contrato TraceFood inicializado con transiciones: ${JSON.stringify(stage_transitions)}`);
  }

  /**
   * Registra un nuevo lote de alimento en la blockchain.
   * Solo puede ser llamado por el agricultor (la primera cuenta en la cadena de trazabilidad).
   * @param lot_id - ID único para este lote.
   * @param description - Descripción del lote.
   * @param initial_metadata - Metadatos iniciales (tipo de cultivo, ubicación, etc.).
   */
  @call({})
  mint_lot({ lot_id, description, initial_metadata }: {
      lot_id: string,
      description: string,
      initial_metadata: { crop_type: string, farm_location: string, certifications?: string[] }
  }): void {
    // Verifica si el lote ya existe. Si existe, entra en pánico xD(error).
    if (this.lots.get(lot_id) !== null) {
      throw new Error(`El lote con ID "${lot_id}" ya existe.`);
    }

    const farmerId = near.predecessorAccountId(); // El que llama es el agricultor
    const initialStage = "Cosecha";

    // Verifica si la etapa inicial "Cosecha" está definida en las transiciones y tiene un siguiente actor esperado.
    // Para este MVP, esperamos que el agricultor sea el primero y la siguiente etapa sea la definida en init.
    if (this.stage_transitions[initialStage] === undefined) {
         throw new Error(`La etapa inicial "${initialStage}" no está configurada en las transiciones del contrato.`);
    }

    // Crea el primer evento
    const firstEvent: LotEvent = {
      stage: initialStage,
      actor_id: farmerId,
      timestamp: near.blockTimestamp(),
      notes: "Lote registrado al momento de la cosecha."
    };

    // Determina el siguiente actor esperado basado en la etapa inicial
    const expectedNextActorId = this.stage_transitions[initialStage];
    if (expectedNextActorId === null) {
         throw new Error("La etapa inicial no puede ser la etapa final.");
    }


    // Crea el objeto FoodLot inicial
    const newLot: FoodLot = {
      lot_id: lot_id,
      farmer_id: farmerId,
      description: description,
      initial_metadata: initial_metadata,
      events: [firstEvent], // Empieza con el evento de cosecha
      current_stage: initialStage,
      expected_next_actor_id: expectedNextActorId,
      payment_status: "Pending" // Estado inicial del pago
    };

    // Guarda el nuevo lote en el estado del contrato
    this.lots.set(lot_id, newLot);
    // Añade el ID del lote a la lista para facilitar la consulta de todos los IDs (MVP)
    this.lot_ids.push(lot_id);

    near.log(`Lote "${lot_id}" registrado por el agricultor "${farmerId}". Siguiente actor esperado: "${expectedNextActorId}".`);
  }

  /**
   * Permite a un actor en la cadena de suministro confirmar que ha completado su etapa.
   * Solo puede ser llamado por la cuenta que actualmente es el 'expected_next_actor_id' para este lote.
   * Activa el pago si se confirma la etapa final configurada.
   * @param lot_id - ID del lote a confirmar.
   * @param stage_name - Nombre de la etapa que se está confirmando (debe coincidir con lo esperado).
   * @param event_details - Detalles opcionales para el evento (ubicación, notas, foto_url).
   */
  @call({})
  confirm_stage({ lot_id, stage_name, event_details }: {
      lot_id: string,
      stage_name: string,
      event_details?: { location?: string, notes?: string, photo_url?: string }
  }): void {
    // Obtiene el estado actual del lote. Si no existe, entra en pánico.
    const lot = this.lots.get(lot_id);
    if (lot === null) {
      throw new Error(`El lote con ID "${lot_id}" no fue encontrado.`);
    }

    const callerId = near.predecessorAccountId(); // El que llama a esta función

    // **Validación de Actor:** Verifica que el llamador sea el actor esperado para esta etapa.
    if (lot.expected_next_actor_id !== callerId) {
      throw new Error(`No tienes permiso para confirmar esta etapa. El actor esperado es "${lot.expected_next_actor_id}".`);
    }

    // Verifica que la etapa que se confirma sea una etapa válida en nuestras transiciones.
     if (this.stage_transitions[stage_name] === undefined && this.stage_transitions[lot.current_stage] !== null && this.stage_transitions[lot.current_stage] !== stage_name) {
         // Opcional: Puedes añadir una validación para que stage_name sea *exactamente* la siguiente etapa definida.
         // Para simplicidad MVP, solo validamos si *está* en las transiciones.
         // Una validación más estricta sería: if (this.stage_transitions[lot.current_stage] !== stage_name) { ... }
     }


    near.log(`Confirmando etapa "${stage_name}" para el lote "${lot_id}" por el actor "${callerId}".`);


    // Crea el nuevo evento
    const newEvent: LotEvent = {
      stage: stage_name,
      actor_id: callerId,
      timestamp: near.blockTimestamp(),
      location: event_details?.location,
      notes: event_details?.notes,
      photo_url: event_details?.photo_url,
    };

    // Añade el nuevo evento al historial
    lot.events.push(newEvent);
    // Actualiza la etapa actual
    lot.current_stage = stage_name;

    // Determina el siguiente actor esperado. Si la etapa confirmada no tiene siguiente, es la etapa final (null).
    lot.expected_next_actor_id = this.stage_transitions[stage_name] || null;

    // **Lógica de Pago (MVP):** Si la etapa confirmada no tiene un siguiente actor, asumimos que es la etapa final.
    if (lot.expected_next_actor_id === null && lot.payment_status === "Pending") {
        near.log(`Etapa final "${stage_name}" confirmada para el lote "${lot_id}". Iniciando pago al agricultor "${lot.farmer_id}".`);
        // Crea una promesa para transferir tokens al agricultor.
        const promise = NearPromise.new(lot.farmer_id).transfer(PAYMENT_AMOUNT_YOCTO);

        // SE Puede añadir una continuación a la promesa para manejar el resultado del pago,
        // promise.then(NearPromise.builder().functionCall(...));

        // Ejecuta la promesa (la transferencia ocurrirá después de que esta función termine).
        promise; //  última instrucción en una función `call` que la usa.

        // Actualiza el estado de pago (importante para no pagar dos veces si se llama de nuevo).
        lot.payment_status = "Fully Paid";

    } else if (lot.expected_next_actor_id !== null) {
         near.log(`Siguiente actor esperado para el lote "${lot_id}" es "${lot.expected_next_actor_id}".`);
    } else {
         near.log(`Lote "${lot_id}" ya completó todas las etapas o el pago ya fue procesado.`);
    }


    // Guarda el estado actualizado del lote.
    this.lots.set(lot_id, lot);
  }

  /**
   * Obtiene el estado completo de un lote específico.
   * Método view (solo lectura), no cuesta gas al llamador.
   * @param lot_id - ID del lote a consultar.
   * @returns El objeto FoodLot o null si no se encuentra.
   */
  @view({})
  get_lot_state({ lot_id }: { lot_id: string }): FoodLot | null {
    return this.lots.get(lot_id);
  }

   /**
   * Obtiene la lista de IDs de todos los lotes registrados.
   * Método view (solo lectura), no cuesta gas.
   * **Nota MVP:** Este método retorna una lista simple. No es escalable a millones de lotes.
   * @returns Un array de strings con los IDs de los lotes.
   */
  @view({})
  get_all_lot_ids(): string[] {
     // Retornamos la lista que mantenemos. LookupMap en sí no tiene un método para listar todas las claves.
     return this.lot_ids;
  }


  // añadir otros métodos view COMONPARA consultar cosas específicas,
  // ej: get_lots_by_actor(actor_id: AccountId): string[]
  // THis is implementar eficientemente con LookupMap .BHJBJH
}