import { useCallback, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useAppointmentsStore } from '../store/useAppointmentsStore';
import { useNotifications } from '../store/useStore';
import { Appointment } from '../types/calendar.types';

const AUDIO_PATH = '/sounds/reminder.mp3';
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // refresh appointments every 5 minutes

type ReminderPhase = 'before' | 'start';

export const useAppointmentReminders = () => {
  const { appointments, fetchAppointments } = useAppointmentsStore();
  const { addNotification } = useNotifications();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timersRef = useRef<number[]>([]);

  // Prepare audio asset once
  useEffect(() => {
    const audio = new Audio(AUDIO_PATH);
    audio.preload = 'auto';
    audioRef.current = audio;
  }, []);

  // Ask for Notification permission once
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {
        /* ignored */
      });
    }
  }, []);

  // Fetch appointments initially and keep them refreshed
  useEffect(() => {
    fetchAppointments();
    const refreshId = window.setInterval(fetchAppointments, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(refreshId);
  }, [fetchAppointments]);

  const triggerReminder = useCallback(
    (appointment: Appointment, phase: ReminderPhase) => {
      const title =
        phase === 'start' ? 'Appuntamento in corso' : 'Promemoria appuntamento';
      const when = format(
        new Date(appointment.startDate),
        "dd MMM yyyy 'alle' HH:mm",
        { locale: it }
      );
      const message = [
        appointment.title,
        appointment.customerName ? `• ${appointment.customerName}` : null,
        `(${when})`,
      ]
        .filter(Boolean)
        .join(' ');

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          /* ignored – user interaction may be required */
        });
      }

      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: '/favicon-32x32.png',
          });
        }
      }

      addNotification({
        type: 'warning',
        title,
        message,
      });
    },
    [addNotification]
  );

  // Schedule reminders for current appointments
  useEffect(() => {
    if (!appointments.length) {
      return;
    }

    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];

    const scheduleReminder = (
      appointment: Appointment,
      timestamp: number,
      phase: ReminderPhase
    ) => {
      const delay = timestamp - Date.now();
      if (delay <= 0) {
        // If the event is imminent (within 1s), trigger immediately
        if (delay > -1000) {
          triggerReminder(appointment, phase);
        }
        return;
      }

      const timeoutId = window.setTimeout(
        () => triggerReminder(appointment, phase),
        delay
      );
      timersRef.current.push(timeoutId);
    };

    appointments.forEach((appointment) => {
      const startTime = new Date(appointment.startDate).getTime();
      if (!startTime || startTime <= Date.now()) {
        return;
      }

      const reminderMinutes = appointment.reminderMinutes ?? 30;
      if (reminderMinutes > 0) {
        const reminderTime =
          startTime - reminderMinutes * 60 * 1000;
        if (reminderTime > Date.now()) {
          scheduleReminder(appointment, reminderTime, 'before');
        }
      }

      scheduleReminder(appointment, startTime, 'start');
    });

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [appointments, triggerReminder]);
};









