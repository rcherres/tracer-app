'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initWallet, getWallet, getAccountId } from '../wallets/web3modal';
import { setupModal } from '@near-wallet-selector/modal-ui';
import "@near-wallet-selector/modal-ui/styles.css";

const NearContext = createContext(null);

export function NearProvider({ children }) {
  const [selector, setSelector] = useState(null);
  const [modal, setModal] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    async function initialize() {
      try {
        const { selector: initializedSelector, modal: initializedModal } = await initWallet();
        setSelector(initializedSelector);
        setModal(initializedModal);

        const currentAccountId = await getAccountId();
        setAccountId(currentAccountId);
        setIsSignedIn(!!currentAccountId);

        if (currentAccountId) {
          const currentWallet = await initializedSelector.wallet();
          setWallet(currentWallet);
        }

        initializedSelector.on('accountsChanged', async ({ accounts }) => {
          const currentAccountId = accounts.length > 0 ? accounts[0].accountId : null;
          setAccountId(currentAccountId);
          setIsSignedIn(!!currentAccountId);
          if (currentAccountId) {
            const currentWallet = await initializedSelector.wallet();
            setWallet(currentWallet);
          } else {
            setWallet(null);
          }
        });

        initializedSelector.on('signedIn', async () => {
          setIsSignedIn(true);
          const currentWallet = await initializedSelector.wallet();
          setWallet(currentWallet);
          setAccountId(await getAccountId());
        });

        initializedSelector.on('signedOut', () => {
          setIsSignedIn(false);
          setAccountId(null);
          setWallet(null);
        });
      } catch (error) {
        console.error('Error initializing wallet:', error);
      }
    }

    initialize();
  }, []);

  const signIn = () => {
    modal?.show();
  };

  const signOut = async () => {
    if (wallet) {
      await wallet.signOut();
      setAccountId(null);
      setIsSignedIn(false);
      setWallet(null);
    }
  };

  return (
    <NearContext.Provider value={{ selector, modal, accountId, isSignedIn, signIn, signOut, wallet }}>
      {children}
    </NearContext.Provider>
  );
}

export function useNear() {
  const context = useContext(NearContext);
  if (context === undefined) {
    throw new Error('useNear must be used within a NearProvider');
  }
  return context;
}