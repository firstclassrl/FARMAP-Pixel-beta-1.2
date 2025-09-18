import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Appointment } from '../types/calendar.types';

interface AppointmentsState {
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  getTodayAppointments: () => Appointment[];
  getAppointmentsByDate: (date: Date) => Appointment[];
}

export const useAppointmentsStore = create<AppointmentsState>()(
  persist(
    (set, get) => ({
      appointments: [
        // Appuntamenti di esempio per oggi
        {
          id: '1',
          title: 'Presentazione prodotti FARMAP',
          description: 'Presentazione del nuovo catalogo prodotti al cliente',
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 10, 0),
          endDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 11, 30),
          customerId: 'cust-1',
          customerName: 'Azienda Agricola Rossi',
          type: 'appointment',
          status: 'scheduled',
          location: 'Via Roma 123, Milano',
          notes: 'Portare campioni del nuovo fertilizzante',
          reminderMinutes: 30,
          createdBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          title: 'Chiamata follow-up',
          description: 'Chiamata di follow-up per ordine in corso',
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 14, 0),
          endDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 14, 30),
          customerId: 'cust-2',
          customerName: 'Cooperativa Verde',
          type: 'call',
          status: 'scheduled',
          reminderMinutes: 15,
          createdBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          title: 'Promemoria: Inviare preventivo',
          description: 'Inviare preventivo per ordine di 1000kg fertilizzante',
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 9, 0),
          endDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 9, 0),
          customerId: 'cust-3',
          customerName: 'AgriTech Solutions',
          type: 'reminder',
          status: 'scheduled',
          notes: 'Preventivo urgente - cliente in attesa',
          reminderMinutes: 60,
          createdBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '4',
          title: 'test',
          description: 'Appuntamento di test per oggi',
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 7),
          endDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 10, 7),
          customerId: 'cust-4',
          customerName: 'Cliente Test',
          type: 'appointment',
          status: 'scheduled',
          location: 'pescara',
          notes: 'Appuntamento di test',
          reminderMinutes: 30,
          createdBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],

      addAppointment: (appointmentData) => {
        const newAppointment: Appointment = {
          ...appointmentData,
          id: `appointment-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        set((state) => ({
          appointments: [...state.appointments, newAppointment]
        }));
      },

      updateAppointment: (id, updates) => {
        set((state) => ({
          appointments: state.appointments.map((appointment) =>
            appointment.id === id
              ? { ...appointment, ...updates, updatedAt: new Date() }
              : appointment
          )
        }));
      },

      deleteAppointment: (id) => {
        set((state) => ({
          appointments: state.appointments.filter((appointment) => appointment.id !== id)
        }));
      },

      getTodayAppointments: () => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        
        return get().appointments.filter((appointment) => {
          const appointmentDate = new Date(appointment.startDate);
          return appointmentDate >= todayStart && appointmentDate <= todayEnd;
        }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      },

      getAppointmentsByDate: (date) => {
        const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
        const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
        
        return get().appointments.filter((appointment) => {
          const appointmentDate = new Date(appointment.startDate);
          return appointmentDate >= dateStart && appointmentDate <= dateEnd;
        }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      }
    }),
    {
      name: 'appointments-storage',
    }
  )
);
