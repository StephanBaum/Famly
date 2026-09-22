import { useState, useEffect } from 'react';
import { Appointment } from '../../types';
import { STORAGE_KEYS, getStoredOrDefault } from '../storageKeys';

export function useAppointmentsSlice() {
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const stored = getStoredOrDefault<Appointment[] | null>(STORAGE_KEYS.APPOINTMENTS, null);
    if (stored !== null) return stored;
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  const addAppointment = (app: Omit<Appointment, 'id'>) => {
    const newApp: Appointment = {
      ...app,
      id: `a_${Date.now()}`,
    };
    setAppointments((prev) => [...prev, newApp]);
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          return { ...a, ...updates };
        }
        return a;
      })
    );
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  return {
    appointments,
    setAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  };
}
