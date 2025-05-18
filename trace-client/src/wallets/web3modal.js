import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupModal } from '@near-wallet-selector/modal-ui';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import { setupSender } from '@near-wallet-selector/sender';
// Importa otros wallets si usas
import { connect, keyStores } from 'near-api-js'; // Importa connect y keyStores para viewMethod público
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet'; 

import nearConfig from '../config';

const THIRTY_TGAS = '300000000000000000'; // Cantidad de gas recomendada (como string) - 300 TGas
const NO_DEPOSIT = '0'; // Depósito cero (como string)


// Usaremos una sola instancia global del selector y modal
let walletSelectorInstance;
let modalInstance;

export async function initWallet() {
  if (walletSelectorInstance) {
      // Ya inicializado, devuelve las instancias existentes
      return { selector: walletSelectorInstance, modal: modalInstance };
  }

  // Configura el selector de wallet
  const selector = await setupWalletSelector({
    network: nearConfig.networkId,
    modules: [
      setupMyNearWallet(),
      // otros wallets si es necesario y los tienes instalados:
      setupSender(),
      // setupNearMobileWallet(),
      // ...
      setupMeteorWallet()
    ],
  });

  // Configura el modal de wallet (la UI para que el usuario elija e inicie sesión)
  const modal = setupModal(selector, {
    contractId: nearConfig.contractName, // El ID del contrato con el que la app interactúa
    theme: 'dark', // Puedes cambiar el tema
    //  una custom message, como "Select a wallet to connect to TraceFood"
  });

  // Guarda las instancias globales
  walletSelectorInstance = selector;
  modalInstance = modal;

  // Retorna las instancias inicializadas
  return { selector: walletSelectorInstance, modal: modalInstance };
}

/**
 * Obtiene la instancia global del Wallet Selector (para ser usada por el Provider).
 * @returns La instancia del Wallet Selector.
 */
export function getWalletSelector() {
    if (!walletSelectorInstance) {
        // Esto no debería pasar si initWallet se llama en el Provider
        console.warn("Wallet selector not initialized when requested.");
        // En un caso robusto, podrías lanzar un error o intentar inicializar aquí.
        // Para este caso, asumimos que el Provider lo inicializa.
    }
    return walletSelectorInstance;
}

/**
 * Obtiene la Account ID actualmente loggeada.
 * @returns La Account ID como string o null si no hay usuario loggeado.
 */
export function getAccountId() {
  const selector = getWalletSelector(); // Obtiene la instancia
  if (!selector) return null;

  // CORRECCIÓN: Usar el estado del selector para obtener las cuentas
  const state = selector.store.getState();
  const accounts = state.accounts || [];
  
  return accounts.length > 0 ? accounts[0].accountId : null;
}

/**
 * Obtiene la instancia de la wallet actualmente loggeada.
 * @returns La instancia del módulo de wallet (ej: MyNearWallet instance).
 * @throws Error si no hay una cuenta loggeada.
 */
async function getSignedInWallet() {
   const selector = getWalletSelector();
   if (!selector) throw new Error("Wallet selector not initialized.");

   // CORRECCIÓN: Usar el estado del selector para obtener las cuentas
   const state = selector.store.getState();
   const accounts = state.accounts || [];
   
   if (accounts.length === 0) {
       throw new Error("No wallet account signed in."); // Este es el error que estabas viendo
   }

   // wallet() devuelve la instancia del wallet module para la cuenta activa
   const walletInstance = await selector.wallet();
   return walletInstance;
}


/**
 * Llama a un método de solo lectura (view method) del contrato.
 * No requiere que el usuario esté loggeado.
 * @param methodName El nombre del método view.
 * @param args Los argumentos para el método.
 * @returns El resultado del método view.
 */
export async function viewMethod(methodName, args = {}) {
  try {
     // Usamos near-api-js directamente para view calls públicas
     const keyStore = new keyStores.InMemoryKeyStore(); // Key store dummy
     const nearConnection = await connect({
         networkId: nearConfig.networkId,
         keyStore,
         nodeUrl: nearConfig.nodeUrl,
         // walletUrl, helperUrl, explorerUrl no son estrictamente necesarios para view calls RPC
         // pero pueden ser utiles en la config general.
     });
     // Obtenemos la cuenta del contrato para llamar al método view
     const contractAccount = await nearConnection.account(nearConfig.contractName);

     return await contractAccount.viewFunction(nearConfig.contractName, methodName, args);

  } catch (e) {
    console.error(`Error calling view method "${methodName}":`, e);
    // Lanza un error más descriptivo o maneja según la necesidad
    throw new Error(`Failed to call view method ${methodName}: ${e.message || e}`);
  }
}

/**
 * Llama a un método que requiere transacción firmada (call method).
 * Requiere que el usuario esté loggeado.
 * @param methodName El nombre del método call.
 * @param args Los argumentos para el método.
 * @param deposit NEAR a adjuntar (en yoctoNEAR como string).
 * @param gas Gas a adjuntar (en yoctoNEAR como string).
 * @returns El resultado de la transacción.
 * @throws Error si el usuario no está loggeado.
 */
export async function callMethod(methodName, args = {}, deposit = NO_DEPOSIT, gas = THIRTY_TGAS) {
  try {
    // **Verificación Crucial:** Asegura que hay una wallet loggeada.
    // getSignedInWallet lanzará un error si no hay cuenta.
    const walletInstance = await getSignedInWallet();

    // CORRECCIÓN: Método actualizado para llamar a funciones del contrato
    return await walletInstance.signAndSendTransaction({
      actions: [{
        type: 'FunctionCall',
        params: {
          methodName: methodName,
          args: args,
          gas: gas,
          deposit: deposit,
        }
      }],
      // El contractId ya debería estar configurado en el selector
      receiverId: nearConfig.contractName,
    });
  } catch (e) {
     console.error(`Error calling call method "${methodName}":`, e);
     // Lanza un error más descriptivo si no es un error de "No wallet signed in"
     if (e.message === "No wallet account signed in.") {
          // Este error lo lanzamos nosotros en getSignedInWallet
          throw e;
     }
     // Para otros errores de transacción, relanza con más contexto
     throw new Error(`Failed to call method ${methodName}: ${e.message || e}`);
  }
}

export async function signIn() {
  if (!walletSelectorInstance) {
      await initWallet();
  }
  modalInstance.show();
}

export async function signOut() {
   try {
       const walletInstance = await getSignedInWallet();
       await walletInstance.signOut();
       console.log("Signed out successfully.");
       // window.location.reload(); // Evita recargar si el estado se maneja en el Provider
   } catch (e) {
       // Captura el error "No wallet account signed in." si el usuario no estaba loggeado
       console.warn("Attempted to sign out when no wallet was signed in:", e.message);
       // O maneja otros errores de signOut
   }
}
