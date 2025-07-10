
"use client";

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, set, push, remove as fbRemove, update as fbUpdate } from 'firebase/database';

interface FirebaseData {
  id: string;
  [key: string]: any;
}

const useFirebase = <T extends object>(path: string) => {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const dbRef = ref(database, path);
    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        try {
          const snapshotData = snapshot.val();
          if (snapshotData) {
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
          console.error(e);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setError(error);
        setLoading(false);
        console.error(`Firebase read failed for path: ${path}`, error);
      }
    );

    return () => unsubscribe();
  }, [path]);

  const add = async (newData: T) => {
    try {
      const dbRef = ref(database, path);
      const newRef = push(dbRef);
      await set(newRef, newData);
    } catch (e: any) {
      setError(e);
      console.error('Firebase add failed:', e);
    }
  };

  const update = async (id: string, updatedData: Partial<T>) => {
    try {
      const itemRef = ref(database, `${path}/${id}`);
      // remove id from object before updating
      const dataToUpdate = { ...updatedData };
      delete (dataToUpdate as any).id;
      await fbUpdate(itemRef, dataToUpdate);
    } catch (e: any) {
      setError(e);
      console.error('Firebase update failed:', e);
    }
  };

  const remove = async (id: string) => {
    try {
      const itemRef = ref(database, `${path}/${id}`);
      await fbRemove(itemRef);
    } catch (e: any) {
      setError(e);
      console.error('Firebase remove failed:', e);
    }
  };

  return { data, loading, error, add, update, remove };
};

export default useFirebase;
