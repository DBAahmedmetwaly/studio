
"use client";

import { useState, useEffect, useCallback } from 'react';
import { database } from '@/lib/firebase';
import { ref, runTransaction } from 'firebase/database';
import { useAuth } from '@/contexts/auth-context';

export const usePosInvoiceCounter = () => {
  const { user } = useAuth();
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const getFormattedDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateInvoiceNumber = useCallback(async () => {
    if (!user || !user.id) return;

    setLoading(true);
    const dateStr = getFormattedDate();
    const counterRef = ref(database, `posCounters/${dateStr}/${user.id}`);

    try {
      const { committed, snapshot } = await runTransaction(counterRef, (currentValue) => {
        return (currentValue || 0) + 1;
      });

      if (committed) {
        const newCount = snapshot.val();
        const userCode = user.loginName ? user.loginName.substring(0, 3).toUpperCase() : 'POS';
        setCurrentInvoiceNumber(`${userCode}-${newCount}`);
      }
    } catch (error) {
      console.error("Failed to generate invoice number:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
        generateInvoiceNumber();
    }
  }, [user, generateInvoiceNumber]);

  return { currentInvoiceNumber, generateInvoiceNumber, loading };
};
