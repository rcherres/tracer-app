const contractPerNetwork = {
  mainnet: 'hello.near-examples.near',
  testnet: 'hello.near-examples.testnet',
};

export const NetworkId = 'testnet';
export const HelloNearContract = contractPerNetwork[NetworkId];



const CONTRACT_NAME = process.env.NEXT_PUBLIC_CONTRACT_NAME || 'tracefood-hackathon-abc.testnet'; // <--- ¡ACTUALIZA con el nombre de tu contrato desplegado!

function getConfig(env) {
  switch (env) {
    case 'production':
    case 'development':
      return {
        networkId: 'testnet',
        nodeUrl: 'https://rpc.testnet.near.org',
        contractName: CONTRACT_NAME,
        walletUrl: 'https://wallet.testnet.near.org',
        helperUrl: 'https://helper.testnet.near.org',
        explorerUrl: 'https://explorer.testnet.near.org',
      };
    case 'local':
      return {
        networkId: 'local',
        nodeUrl: 'http://localhost:3030',
        keyPath: `${process.env.HOME}/.near/validator_key.json`,
        walletUrl: 'http://localhost:4000/wallet',
        contractName: CONTRACT_NAME,
        helperUrl: 'http://localhost:0',
        explorerUrl: 'http://localhost:4000/explorer',
      };
    case 'test':
    case 'ci':
      return {
        networkId: 'shared-test',
        nodeUrl: 'https://rpc.ci-testnet.near.org',
        contractName: CONTRACT_NAME,
        masterAccount: 'test.near',
      };
    case 'ci-betanet':
      return {
        networkId: 'shared-betanet',
        nodeUrl: 'https://rpc.ci-betanet.near.org',
        contractName: CONTRACT_NAME,
        masterAccount: 'test.betanet',
      };
    default:
      throw Error(`Unconfigured environment '${env}'. Can be production, development, test, ci, ci-betanet, or local.`);
  }
}

// Exporta la configuración para development o production por defecto
const nearConfig = getConfig(process.env.NODE_ENV || 'development');

export default nearConfig;