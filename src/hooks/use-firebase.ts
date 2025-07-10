
"use client";

import { useState, useEffect, useCallback } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, set, push, remove as fbRemove, update as fbUpdate, runTransaction, get } from 'firebase/database';

interface FirebaseData {
  id: string;
  [key: string]: any;
}

const useFirebase = <T extends object>(path: string) => {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const dbRef = ref(database, path);
        try {
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                const snapshotData = snapshot.val();
                 const dataArray = Object.keys(snapshotData).map((key) => ({
                  id: key,
                  ...snapshotData[key],
                }));
                setData(dataArray);
            } else {
                setData([]);
            }
        } catch (e: any) {
            setError(e);
            console.error(`Firebase read failed for path: ${path}`, e);
        } finally {
            setLoading(false);
        }
    };
    
    fetchData();
    
  }, [path]);

  const add = useCallback(async (newData: T) => {
    try {
      const dbRef = ref(database, path);
      const newRef = push(dbRef);
      await set(newRef, newData);
      return newRef.key;
    } catch (e: any) {
      setError(e);
      console.error('Firebase add failed:', e);
      throw e;
    }
  }, [path]);

  const update = useCallback(async (id: string, updatedData: Partial<T>) => {
    try {
      const itemRef = ref(database, `${path}/${id}`);
      // remove id from object before updating
      const dataToUpdate = { ...updatedData };
      delete (dataToUpdate as any).id;
      await fbUpdate(itemRef, dataToUpdate);
    } catch (e: any) {
      setError(e);
      console.error('Firebase update failed:', e);
      throw e;
    }
  }, [path]);

  const remove = useCallback(async (id: string) => {
    if(!id) return;
    try {
      const itemRef = ref(database, `${path}/${id}`);
      await fbRemove(itemRef);
    } catch (e: any) {
      setError(e);
      console.error('Firebase remove failed:', e);
      throw e;
    }
  }, [path]);

  const getNextId = useCallback(async (counterName: string, startFrom = 0): Promise<number | null> => {
    const counterRef = ref(database, `counters/${counterName}`);
    try {
        const { committed, snapshot } = await runTransaction(counterRef, (currentValue) => {
            if (currentValue === null) {
                return startFrom + 1;
            }
            return currentValue + 1;
        });
        if (committed) {
            return snapshot.val();
        }
        return null;
    } catch (e: any) {
        setError(e);
        console.error('Failed to get next ID:', e);
        return null;
    }
  }, []);

  return { data, loading, error, add, update, remove, getNextId, setData };
};

export default useFirebase;

    