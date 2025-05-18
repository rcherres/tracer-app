# tracer-app

Flujo de Prueba Paso a Paso (con Datos de Ejemplo):

Paso 1: Empezar en la Página Principal (/)
Abre tu aplicación frontend en el navegador. Verás la página de la imagen.

Paso 2: Conectar Wallet (como Agricultor)
Haz clic en el botón "Conectar Wallet" (probablemente en la barra de navegación, no visible en la imagen, pero parte de tu layout).
En el modal del selector, elige la wallet que vas a usar (ej: Sender, MyNearWallet, Here).
La wallet se abrirá (una extensión, una app móvil, o una pestaña nueva). Asegúrate de estar loggeado con la Account ID que usarás como Agricultor (ej: agricultor-abc.testnet) y que esté en la red Testnet.
La wallet te pedirá que apruebes la conexión con tu aplicación (http://localhost:3000). Aprueba la conexión.
El modal debería cerrarse, y tu Account ID de agricultor debería aparecer en algún lugar de la interfaz (probablemente en la navegación).

Paso 3: Ir a la Página del Agricultor (/farmer) y Crear un Lote
En la página principal o en la navegación, haz clic en el botón o enlace "Soy Agricultor". Esto te llevará a la página /farmer.
Deberías ver el panel para crear un nuevo lote. Si te pide conectar wallet, algo falló en el paso 2 (o la página no está usando correctamente el hook useNear).
Rellena el formulario con datos de ejemplo para un lote de alimento:
ID del Lote (Único): TOMATES-CHERRY-ORG-JUL2024-001 (Debe ser único para cada lote que crees).
Descripción: Lote de 50kg Tomates Cherry Organicos Cosecha Jul 2024
Tipo de Cultivo: Tomate Cherry
Ubicación Granja: Finca El Sol Naciente, Valle Fertil, Peru
Certificaciones (separadas por coma): Certificado Organico Bio, Global G.A.P.
Haz clic en el botón "Crear Lote en Blockchain".
Tu wallet se abrirá pidiéndote que apruebes la transacción de llamada al contrato (mint_lot en tracefood-hackathon-abc.testnet). Confirma y aprueba la transacción en tu wallet.
La página debería mostrar un mensaje de éxito si la transacción se completa. Puedes verificar en el NEAR Explorer (explorer.testnet.near.org) pegando la Account ID de tu contrato para ver las transacciones recientes.

Paso 4: Desconectar Wallet (del Agricultor)
Haz clic en el botón "Desconectar" en la navegación. Esto cerrará la sesión del agricultor.

Paso 5: Conectar Wallet (como Distribuidor)
Haz clic en "Conectar Wallet" de nuevo.
En el modal, selecciona tu wallet.
Loggeate o selecciona la Account ID que usas para el rol de Distribuidor (ej: distribuidor-abc.testnet) y asegúrate de estar en Testnet.
Aprueba la conexión si la wallet lo pide.

Paso 6: Ir a la Página de Actores (/actors) y Confirmar Etapa (como Distribuidor)
Haz clic en el enlace "Soy Actor Cadena". Esto te llevará a la página /actors.
Deberías ver tu Account ID de Distribuidor y una lista de "Lotes Pendientes para Ti". El lote que creó el agricultor en el paso 3 debería aparecer aquí, ya que tú (el distribuidor) eres el expected_next_actor_id después de la etapa "Cosecha".
Verás la descripción del lote y la etapa actual ("Cosecha"). Debería haber un botón para "Confirmar 'Llegada Distribuidor'" (el nombre de la siguiente etapa según tu STAGE_TRANSITIONS).
Haz clic en ese botón "Confirmar 'Llegada Distribuidor'".
Tu wallet se abrirá pidiéndote que apruebes la transacción (confirm_stage). Confirma y aprueba la transacción.
La página debería actualizarse, y el lote debería desaparecer de tu lista de pendientes (porque el expected_next_actor_id ha cambiado al supermercado) y mostrar un mensaje de éxito.

Paso 7: Desconectar Wallet (del Distribuidor)
Haz clic en "Desconectar".

Paso 8: Conectar Wallet (como Supermercado)
Haz clic en "Conectar Wallet".
Loggeate o selecciona la Account ID para el rol de Supermercado (ej: supermercado-abc.testnet) en Testnet.
Aprueba la conexión.
Paso 9: Ir a la Página de Actores (/actors) y Confirmar Etapa Final (como Supermercado)
Haz clic en "Soy Actor Cadena". Estarás en la página /actors loggeado como supermercado.
El lote debería aparecer en tu lista de "Lotes Pendientes para Ti". La etapa actual será "Llegada Distribuidor".
Debería haber un botón para "Confirmar 'Llegada Supermercado'" (la etapa final en este MVP).
Haz clic en ese botón "Confirmar 'Llegada Supermercado'".
Tu wallet se abrirá pidiéndote que apruebes la transacción (confirm_stage). Confirma y aprueba la transacción.
¡Esta transacción debería desencadenar el pago de 0.1 NEAR (de testnet) a la Account ID del Agricultor!
La página debería actualizarse, el lote desaparecerá de tu lista de pendientes (porque el expected_next_actor_id ahora es null).
Paso 10: (Opcional) Verificar Pago al Agricultor
Desconecta la wallet del Supermercado.
Conecta la wallet del Agricultor (ej: agricultor-abc.testnet) de nuevo.
Abre la interfaz de la wallet del Agricultor (web wallet, extensión, app). Verifica el balance de NEAR de testnet de esa cuenta. Deberías ver un aumento de aproximadamente 0.1 NEAR (menos el gas de la transacción de pago).
Paso 11: Ir a la Página de Escaneo (/scan) y Ver Lote (como Consumidor)
No necesitas conectar wallet para esta página, es pública.
Ve a la página principal (/) y haz clic en el botón "Escanear QR (Ver Lote)". Esto te llevará a la página /scan.
Verás un campo para ingresar el ID del lote.
Ingresa el ID exacto del lote que creaste en el paso 3 (ej: TOMATES-CHERRY-ORG-JUL2024-001).
Haz clic en "Ver Lote".
Esto te redirigirá a la página /lot/TOMATES-CHERRY-ORG-JUL2024-001.
Deberías ver la información completa del lote: los detalles iniciales, el estado actual ("Llegada Supermercado"), el estado de pago ("Fully Paid"), y ¡el historial completo de eventos! Verás los eventos "Cosecha" (por el Agricultor), "Llegada Distribuidor" (por el Distribuidor), y "Llegada Supermercado" (por el Supermercado), con sus marcas de tiempo.




// agricultor-tf-hack.testnet
// distribuidor-tf-hack.testnet
// supermercado-tf-hack.testnet
// comprador-tf-hack.testnet

// near deploy tracefood-hackathon-abc.testnet ./build/tracefood_near.wasm
// near create-account tracefood-v2-hack.testnet --useFaucet
// near deploy tracefood-v2-hack.testnet ./build/tracefood_near.wasm

// near call tracefood-v2-hack.testnet init '{
//   "stage_transitions": {
//     "Cosecha": "distribuidor-tf-hack.testnet", # <-- Usa el NUEVO ID del distribuidor
//     "Llegada Distribuidor": "supermercado-tf-hack.testnet", # <-- Usa el NUEVO ID del supermercado
//     "Llegada Supermercado": "comprador-tf-hack.testnet" # <-- Usa el NUEVO ID del comprador
//   }
// }' --accountId tracefood-v2-hack.testnet

 