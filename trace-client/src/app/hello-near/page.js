'use client';
import { useState, useEffect } from 'react';

import styles from '@/app/app.module.css';
import { Cards } from '@/components/cards';

import { HelloNearContract } from '@/config';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

// Contract that the app will interact with
const CONTRACT = HelloNearContract;

export default function HelloNear() {
  const { signedAccountId, viewFunction, callFunction } = useWalletSelector();

  const [greeting, setGreeting] = useState('loading...');
  const [newGreeting, setNewGreeting] = useState('loading...');
  const [loggedIn, setLoggedIn] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    viewFunction({ contractId: CONTRACT, method: 'get_greeting' })
      .then(greeting => setGreeting(greeting));
  }, [viewFunction]);

  useEffect(() => {
    setLoggedIn(!!signedAccountId);
  }, [signedAccountId]);

  const storeGreeting = async () => {
    setShowSpinner(true);
    await callFunction({ contractId: CONTRACT, method: 'set_greeting', args: { greeting: newGreeting } });
    const greeting = await viewFunction({ contractId: CONTRACT, method: 'get_greeting' });
    setGreeting(greeting);
    setShowSpinner(false);
  };

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>
          Interacting with the contract: &nbsp;
          <code className={styles.code}>{CONTRACT}</code>
        </p>
      </div>

      <div className={styles.center}>
        <h1 className="w-100"> The contract says: <code>{greeting}</code> </h1>
        <div className="input-group" hidden={!loggedIn}>
          <input type="text" className="form-control w-20" placeholder="Store a new greeting" onChange={t => setNewGreeting(t.target.value)} />
          <div className="input-group-append">
            <button className="btn btn-secondary" onClick={storeGreeting}>
              <span hidden={showSpinner}> Save </span>
              <i className="spinner-border spinner-border-sm" hidden={!showSpinner}></i>
            </button>
          </div>
        </div>
        <div className='w-100 text-end align-text-center' hidden={loggedIn}>
          <p className='m-0'> Please login to change the greeting </p>
        </div>
      </div>
      <div className={styles.grid}>
        <Cards />
      </div>
    </main>
  );
}
