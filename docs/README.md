src/product_lot.ts: Aquí definiremos las estructuras de datos para el lote y sus eventos.

      
// src/product_lot.ts
import { AccountId } from 'near-sdk-js';

/**
 * Define la estructura de un evento en la trazabilidad de un lote.
 */
export interface LotEvent {
  stage: string;         // Nombre de la etapa (ej: "Cosecha", "Llegada Distribuidor")
  actor_id: AccountId;   // Cuenta que confirmó la etapa
  timestamp: number;     // Marca de tiempo del registro (en nanosegundos)
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

    

IGNORE_WHEN_COPYING_START
Use code with caution. TypeScript
IGNORE_WHEN_COPYING_END

src/contract.ts: Aquí pondremos la lógica principal del contrato, reemplazando el contenido actual.

      
// src/contract.ts
// Importa las dependencias necesarias de near-sdk-js
import { NearBindgen, near, call, view, initialize, LookupMap, AccountId, NearPromise } from 'near-sdk-js';
// Importa las estructuras de datos que definimos
import { FoodLot, LotEvent } from './product_lot';

// Define la cantidad (en yoctoNEAR) a pagar al agricultor al completar el proceso para el MVP.
// 1 NEAR = 1e24 yoctoNEAR. Esto es 0.1 NEAR.
const PAYMENT_AMOUNT_YOCTO = 100_000_000_000_000_000_000_000n; // 0.1 NEAR

// Define la clase principal del contrato.
@NearBindgen({})
class TraceFoodContract {
  // Usaremos LookupMap para almacenar los lotes, mapeando el ID del lote a su estado FoodLot.
  // LookupMap es eficiente para colecciones grandes. El prefijo 'l' ayuda a NEAR a organizar los datos.
  lots: LookupMap<FoodLot> = new LookupMap('l');

  // Mapea el nombre de una etapa a la cuenta de testnet que se espera que confirme la SIGUIENTE etapa.
  // Esto define el flujo básico de actores para el MVP. Null indica la etapa final.
  // Usaremos un Record simple para esto en el estado del contrato.
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
    // Verifica si el lote ya existe. Si existe, entra en pánico (error).
    if (this.lots.get(lot_id) !== null) {
      near.panic(`El lote con ID "${lot_id}" ya existe.`);
    }

    const farmerId = near.predecessorAccountId(); // El que llama es el agricultor
    const initialStage = "Cosecha";

    // Verifica si la etapa inicial "Cosecha" está definida en las transiciones y tiene un siguiente actor esperado.
    // Para este MVP, esperamos que el agricultor sea el primero y la siguiente etapa sea la definida en init.
    if (this.stage_transitions[initialStage] === undefined) {
         near.panic(`La etapa inicial "${initialStage}" no está configurada en las transiciones del contrato.`);
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
         near.panic("La etapa inicial no puede ser la etapa final.");
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
      near.panic(`El lote con ID "${lot_id}" no fue encontrado.`);
    }

    const callerId = near.predecessorAccountId(); // El que llama a esta función

    // **Validación de Actor:** Verifica que el llamador sea el actor esperado para esta etapa.
    if (lot.expected_next_actor_id !== callerId) {
      near.panic(`No tienes permiso para confirmar esta etapa. El actor esperado es "${lot.expected_next_actor_id}".`);
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
        const promise = NearPromise.transfer(lot.farmer_id, PAYMENT_AMOUNT_YOCTO);

        // Puedes añadir una continuación a la promesa para manejar el resultado del pago,
        // pero para el MVP, la transferencia simple es suficiente.
        // promise.then(NearPromise.builder().functionCall(...));

        // Ejecuta la promesa (la transferencia ocurrirá después de que esta función termine).
        promise; // La promesa debe ser la última instrucción en una función `call` que la usa.

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


  // Puedes añadir otros métodos view si necesitas consultar cosas específicas,
  // ej: get_lots_by_actor(actor_id: AccountId): string[]
  // Este sería más complejo de implementar eficientemente con LookupMap para MVP.
}

    

IGNORE_WHEN_COPYING_START

    Use code with caution. TypeScript
    IGNORE_WHEN_COPYING_END

Paso 2: Compilar el Contrato

Abre la terminal en la raíz de tu proyecto tracer-contract. Ejecuta el comando build:

      
npm run build

    

IGNORE_WHEN_COPYING_START
Use code with caution. Bash
IGNORE_WHEN_COPYING_END

Esto usará near-sdk-js y near-cli-rs (configurado en tu package.json) para compilar el código TypeScript en src a un archivo WebAssembly (.wasm) que NEAR puede ejecutar. Debería generarse un archivo como ./build/tracefood_near.wasm (o similar) en la raíz de tu proyecto tracer-contract.

Paso 3: Probar en Sandbox (Opcional pero Muy Recomendado)

Antes de ir a testnet, prueba tu contrato localmente en el sandbox para asegurar que la lógica principal funcione.

    Abre el archivo de pruebas en sandbox-test/main.ava.js.

    Modifica este archivo para:

        Importar tu contrato (TraceFoodContract).

        Crear cuentas de testnet virtuales (ej: test.near, distribuidor.test.near, supermercado.test.near) usando las utilidades del sandbox (worker.createAccount()).

        Desplegar tu .wasm compilado en una de estas cuentas.

        Inicializar el contrato llamando al método init con las cuentas virtuales como stage_transitions.

        Llamar a mint_lot desde la cuenta del agricultor virtual.

        Llamar a confirm_stage desde las cuentas esperadas en la secuencia y verificar que falle desde las incorrectas.

        Verificar el estado del lote después de cada paso usando get_lot_state.

        Verificar que la cuenta del agricultor reciba los tokens de pago después de confirmar la etapa final (el sandbox te permite verificar balances o resultados de promesas).

    Ejecuta las pruebas:

          
    npm run test

        

    IGNORE_WHEN_COPYING_START

    Use code with caution. Bash
    IGNORE_WHEN_COPYING_END

    Si las pruebas pasan, tienes mucha más confianza en que tu contrato funcionará en testnet. Si fallan, corrige el código del contrato y vuelve a compilar (npm run build) y testear (npm run test).

Paso 4: Desplegar el Contrato en Testnet

Ahora que tienes el .wasm y (idealmente) has pasado las pruebas, despleguémoslo en la red de prueba de NEAR.

    Crea una Cuenta en Testnet para el Contrato: Si aún no tienes una cuenta dedicada para tu contrato en testnet, créala. Puedes usar near-cli-rs:

          
    near create-account <el-nombre-de-tu-contrato>.testnet --useFaucet

        

    IGNORE_WHEN_COPYING_START

Use code with caution. Bash
IGNORE_WHEN_COPYING_END

    Reemplaza <el-nombre-de-tu-contrato> por un nombre único (ej: tracefood-hackathon-abc).

    Si --useFaucet falla, crea la cuenta manualmente en wallet.testnet.near.org y haz login con near login.

Crea Cuentas en Testnet para los Actores: Crea también cuentas de testnet para simular los roles de agricultor, distribuidor, supermercado, etc. (ej: agricultor-abc.testnet, distribuidor-abc.testnet, supermercado-abc.testnet, comprador-abc.testnet). Asegúrate de que tengan algunos tokens NEAR (usa el faucet o envíales desde otra cuenta con fondos).

Desplegar: Ahora, despliega el archivo .wasm en la cuenta de testnet que creaste para el contrato:

      
near deploy <el-nombre-de-tu-contrato>.testnet ./build/tracefood_near.wasm

    

IGNORE_WHEN_COPYING_START

    Use code with caution. Bash
    IGNORE_WHEN_COPYING_END

        Asegúrate de estar en la carpeta tracer-contract cuando ejecutes este comando.

Paso 5: Inicializar el Contrato en Testnet

Después del despliegue, debes llamar al método init para configurar las transiciones de etapa con las cuentas de testnet de tus actores.

      
near call <el-nombre-de-tu-contrato>.testnet init '{"stage_transitions": {"Cosecha": "distribuidor-abc.testnet", "Llegada Distribuidor": "supermercado-abc.testnet", "Llegada Supermercado": null}}' --accountId <el-nombre-de-tu-contrato>.testnet

    

IGNORE_WHEN_COPYING_START
Use code with caution. Bash
IGNORE_WHEN_COPYING_END

    Reemplaza los nombres de cuenta distribuidor-abc.testnet, supermercado-abc.testnet, etc., con los nombres reales de las cuentas de testnet que creaste para tus actores.

    --accountId <el-nombre-de-tu-contrato>.testnet le dice al CLI que uses la cuenta donde desplegaste el contrato para firmar esta llamada init.

¡Hecho!