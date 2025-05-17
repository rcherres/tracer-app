import anyTest from 'ava';
import { Worker } from 'near-workspaces';
import { setDefaultResultOrder } from 'dns'; setDefaultResultOrder('ipv4first'); // temp fix for node >v17

/**
 *  @typedef {import('near-workspaces').NearAccount} NearAccount
 *  @type {import('ava').TestFn<{worker: Worker, accounts: Record<string, NearAccount>}>}
 */


/*
const test = anyTest;

test.beforeEach(async t => {
  // Create sandbox
  const worker = t.context.worker = await Worker.init();

  // Deploy contract
  const root = worker.rootAccount;
  const contract = await root.createSubAccount('test-account');

  // Get wasm file path from package.json test script in folder above
  await contract.deploy(
    process.argv[2],
  );

  // Save state for test runs, it is unique for each test
  t.context.accounts = { root, contract };
});

test.afterEach.always(async (t) => {
  await t.context.worker.tearDown().catch((error) => {
    console.log('Failed to stop the Sandbox:', error);
  });
});

test('returns the default greeting', async (t) => {
  const { contract } = t.context.accounts;
  const greeting = await contract.view('get_greeting', {});
  t.is(greeting, 'Hello');
});

test('changes the greeting', async (t) => {
  const { root, contract } = t.context.accounts;
  await root.call(contract, 'set_greeting', { greeting: 'Howdy' });
  const greeting = await contract.view('get_greeting', {});
  t.is(greeting, 'Howdy');
});


*/


const test = anyTest;

test.beforeEach(async t => {
  // Create sandbox worker instance
  const worker = t.context.worker = await Worker.init();

  // Create accounts for testing roles
  const root = worker.rootAccount;

  // Create the contract account
  // We use a different name than the default 'test-account' for clarity
  const contractAccount = await root.createSubAccount('tracefood-contract');

  // Create actor accounts
  // These simulate the real-world actors interacting with the contract
  const farmerAccount = await root.createSubAccount('farmer');
  const distributorAccount = await root.createSubAccount('distributor');
  const supermarketAccount = await root.createSubAccount('supermarket');
  const buyerAccount = await root.createSubAccount('buyer'); // Optional, but good for testing receiver

  // Deploy the compiled contract WASM
  // process.argv[2] should be the path to the WASM file (e.g., ./build/tracefood_near.wasm)
  await contractAccount.deploy(
    process.argv[2],
  );

  // Initialize the contract with the defined stage transitions and actor accounts
  // This maps stages to the account that is EXPECTED to confirm the *next* stage.
  const stageTransitions = {
      "Cosecha": distributorAccount.accountId,
      "Llegada Distribuidor": supermarketAccount.accountId,
      "Llegada Supermercado": null // Null indicates this is the final stage
  };

  await contractAccount.call(contractAccount, 'init', { stage_transitions: stageTransitions });

  // Save state for test runs, it is unique for each test
  t.context.accounts = {
      root,
      contract: contractAccount,
      farmer: farmerAccount,
      distributor: distributorAccount,
      supermarket: supermarketAccount,
      buyer: buyerAccount, // Add buyer account to context
  };
});

test.afterEach.always(async (t) => {
  await t.context.worker.tearDown().catch((error) => {
    console.log('Failed to stop the Sandbox:', error);
  });
});

// --- Test Cases for TraceFoodContract ---

test('should initialize the contract correctly', async t => {
    const { contract } = t.context.accounts;
    // Although init doesn't return anything, a successful deployment and call means it initialized.
    // We can add checks later if init exposed view methods for config.
    // For now, just checking if contract account exists and was initialized is enough for this basic test.
    const contractExists = await contract.exists();
    t.true(contractExists, 'Contract account should exist after deployment');

    // Basic check on lot_ids after init (should be empty)
    const lotIds = await contract.view('get_all_lot_ids');
    t.deepEqual(lotIds, [], 'lot_ids should be empty after initialization');
});


test('should mint a new lot successfully', async t => {
    const { contract, farmer, distributor } = t.context.accounts;
    const lotId = 'lot-tomato-001';
    const initialMetadata = { crop_type: 'Tomato', farm_location: 'Farm ABC', certifications: ['Organic'] };

    // Call mint_lot from the farmer account
    await farmer.call(contract, 'mint_lot', {
        lot_id: lotId,
        description: 'Organic Tomatoes from Batch 001',
        initial_metadata: initialMetadata
    });

    // Verify the lot state after minting
    const lotState = await contract.view('get_lot_state', { lot_id: lotId });

    t.truthy(lotState, 'Lot state should exist after minting');
    t.is(lotState.lot_id, lotId, 'Lot ID should match');
    t.is(lotState.farmer_id, farmer.accountId, 'Farmer ID should be the caller');
    t.is(lotState.current_stage, 'Cosecha', 'Current stage should be initial stage');
    t.is(lotState.expected_next_actor_id, distributor.accountId, 'Expected next actor should be distributor');
    t.is(lotState.payment_status, 'Pending', 'Payment status should be pending');
    t.deepEqual(lotState.initial_metadata, initialMetadata, 'Initial metadata should match');
    t.is(lotState.events.length, 1, 'Should have one event after minting');
    t.is(lotState.events[0].stage, 'Cosecha', 'First event stage should be Cosecha');
    t.is(lotState.events[0].actor_id, farmer.accountId, 'First event actor should be farmer');
    t.truthy(lotState.events[0].timestamp, 'First event should have a timestamp');

    // Verify the lot ID is added to the list
    const allLotIds = await contract.view('get_all_lot_ids');
    t.deepEqual(allLotIds, [lotId], 'get_all_lot_ids should return the new lot ID');
});

test('should not mint a lot with a duplicate ID', async t => {
    const { contract, farmer } = t.context.accounts;
    const lotId = 'lot-duplicate';
    const initialMetadata = { crop_type: 'Potato', farm_location: 'Farm XYZ' };

    // Mint the first lot
    await farmer.call(contract, 'mint_lot', { lot_id: lotId, description: 'First Potato Batch', initial_metadata: initialMetadata });

    // Attempt to mint a second lot with the same ID
    // We expect this call to throw an error
    const error = await t.throwsAsync(
        farmer.call(contract, 'mint_lot', { lot_id: lotId, description: 'Second Potato Batch', initial_metadata: initialMetadata }),
        { message: `El lote con ID "${lotId}" ya existe.` } // Match the error message from contract.ts
    );

    t.truthy(error, 'Should throw an error when minting duplicate ID');
});

test('should allow correct actor to confirm stage', async t => {
    const { contract, farmer, distributor, supermarket } = t.context.accounts;
    const lotId = 'lot-confirm-001';
    const initialMetadata = { crop_type: 'Apples', farm_location: 'Orchard 1' };

    // Mint the lot first (as farmer)
    await farmer.call(contract, 'mint_lot', { lot_id: lotId, description: 'Fresh Apples', initial_metadata: initialMetadata });

    // Confirm the stage "Llegada Distribuidor" from the distributor account
    const stageToConfirm = "Llegada Distribuidor";
    const eventDetails = { location: 'Distribution Center A' };

    await distributor.call(contract, 'confirm_stage', {
        lot_id: lotId,
        stage_name: stageToConfirm,
        event_details: eventDetails
    });

    // Verify the lot state after confirmation
    const lotState = await contract.view('get_lot_state', { lot_id: lotId });

    t.is(lotState.current_stage, stageToConfirm, 'Current stage should be updated');
    t.is(lotState.expected_next_actor_id, supermarket.accountId, 'Expected next actor should be supermarket');
    t.is(lotState.events.length, 2, 'Should have two events after first confirmation');
    t.is(lotState.events[1].stage, stageToConfirm, 'Second event stage should be "Llegada Distribuidor"');
    t.is(lotState.events[1].actor_id, distributor.accountId, 'Second event actor should be distributor');
    t.is(lotState.events[1].location, eventDetails.location, 'Event details should be recorded');
});

test('should not allow incorrect actor to confirm stage', async t => {
    const { contract, farmer, distributor, supermarket } = t.context.accounts;
    const lotId = 'lot-invalid-actor-001';
    const initialMetadata = { crop_type: 'Lettuce', farm_location: 'Field 5' };

    // Mint the lot first (as farmer). Expected next actor is distributor.
    await farmer.call(contract, 'mint_lot', { lot_id: lotId, description: 'Crispy Lettuce', initial_metadata: initialMetadata });

    // Attempt to confirm the stage from the supermarket account (wrong actor)
    const stageToConfirm = "Llegada Distribuidor"; // The stage the distributor should confirm

    const error = await t.throwsAsync(
        supermarket.call(contract, 'confirm_stage', {
            lot_id: lotId,
            stage_name: stageToConfirm
        }),
        // Match the error message from contract.ts
        { message: `No tienes permiso para confirmar esta etapa. El actor esperado es "${distributor.accountId}".` }
    );

    t.truthy(error, 'Should throw an error when wrong actor confirms stage');

    // Verify the lot state is unchanged
    const lotState = await contract.view('get_lot_state', { lot_id: lotId });
    t.is(lotState.current_stage, 'Cosecha', 'Current stage should remain "Cosecha"');
    t.is(lotState.events.length, 1, 'Events list should remain at 1');
});


test('should trigger payment to farmer on final stage confirmation', async t => {
    const { contract, farmer, distributor, supermarket } = t.context.accounts;
    const lotId = 'lot-payment-001';
    const initialMetadata = { crop_type: 'Berries', farm_location: 'Berry Patch' };

    // Mint the lot (as farmer)
    await farmer.call(contract, 'mint_lot', { lot_id: lotId, description: 'Sweet Berries', initial_metadata: initialMetadata });

    // Confirm first stage (as distributor)
    await distributor.call(contract, 'confirm_stage', { lot_id: lotId, stage_name: "Llegada Distribuidor" });

    // Get farmer's balance BEFORE final confirmation
    const farmerBalanceBefore = await farmer.balance();
    // console.log('Farmer balance before final confirmation:', farmerBalanceBefore.total.toString()); // Debug balance

    // Confirm final stage "Llegada Supermercado" (as supermarket)
    const finalStage = "Llegada Supermercado";
    await supermarket.call(contract, 'confirm_stage', { lot_id: lotId, stage_name: finalStage });

    // Get farmer's balance AFTER final confirmation
    const farmerBalanceAfter = await farmer.balance();
    // console.log('Farmer balance after final confirmation:', farmerBalanceAfter.total.toString()); // Debug balance

    // Verify payment was sent (balance increased by roughly PAYMENT_AMOUNT_YOCTO)
    // Need to use BigInt for comparison
    const expectedIncrease = BigInt("100000000000000000000000"); // Corresponds to 0.1 NEAR defined in contract
    const actualIncrease = farmerBalanceAfter.total - farmerBalanceBefore.total;

    // Use t.true with a small tolerance due to gas costs potentially slightly reducing sent amount or other minor factors in sandbox
    // A simple check that the balance increased significantly is usually sufficient for hackathon MVP.
    // A stricter check could try to calculate expected final balance minus gas costs incurred by farmer.
    // For this MVP, let's check if the increase is very close to the expected amount.
    // Sandbox transfers are usually exact unless gas is explicitly consumed from the attached deposit.
    // Assuming the contract doesn't attach excessive deposit or gas to the transfer promise itself.
    t.true(actualIncrease >= expectedIncrease, `Farmer balance should increase by at least ${expectedIncrease}, got ${actualIncrease}`);


    // Verify lot state after final confirmation
    const lotState = await contract.view('get_lot_state', { lot_id: lotId });
    t.is(lotState.current_stage, finalStage, 'Current stage should be the final stage');
    t.is(lotState.expected_next_actor_id, null, 'Expected next actor should be null after final stage');
    t.is(lotState.payment_status, 'Fully Paid', 'Payment status should be "Fully Paid"');
    t.is(lotState.events.length, 3, 'Should have three events after final confirmation'); // Cosecha, Llegada Distribuidor, Llegada Supermercado
});


test('should return null for non-existent lot', async t => {
    const { contract } = t.context.accounts;
    const nonExistentLotId = 'non-existent-lot';

    const lotState = await contract.view('get_lot_state', { lot_id: nonExistentLotId });

    t.is(lotState, null, 'get_lot_state should return null for a lot that does not exist');
});

// You could add more tests here, e.g.:
// - Test confirming stage with optional event_details.
// - Test calling confirm_stage on a lot that is already completed.
// - Test init with different stage transitions.
// - Test mint_lot from a non-farmer account (if you add that validation).
// - Test with different payment amounts or complex payment logic if added later.
