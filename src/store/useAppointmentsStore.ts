import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Appointment, AppointmentFormData } from '../types/calendar.types';
import { Database } from '../types/database.types';

type AppointmentRow = Database['public']['Tables']['appointments']['Row'];
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

interface AppointmentsState {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchAppointments: () => Promise<void>;
  addAppointment: (appointment: AppointmentFormData & { createdBy: string }) => Promise<void>;
  updateAppointment: (id: string, appointment: Partial<AppointmentFormData>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  getAppointmentsByDate: (date: Date) => Appointment[];
  getTodayAppointments: () => Appointment[];
  clearError: () => void;
}

// Helper function to convert database row to Appointment
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sanitizeCustomerId = (value?: string | null) => {
  if (!value) {
    return null;
  }
  return UUID_REGEX.test(value) ? value : null;
};

const rowToAppointment = (row: AppointmentRow): Appointment => ({
  id: row.id,
  title: row.title,
  description: row.description || undefined,
  startDate: new Date(row.start_date),
  endDate: new Date(row.end_date),
  customerId: row.customer_id || undefined,
  customerName: row.customer_name || undefined,
  type: row.type,
  status: row.status,
  location: row.location || undefined,
  notes: row.notes || undefined,
  reminderMinutes: row.reminder_minutes,
  createdBy: row.created_by,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

// Helper function to convert AppointmentFormData to database insert
const appointmentToInsert = (
  appointment: AppointmentFormData & { createdBy: string }
): AppointmentInsert => ({
  title: appointment.title,
  description: appointment.description || null,
  start_date: appointment.startDate.toISOString(),
  end_date: appointment.endDate.toISOString(),
  customer_id: sanitizeCustomerId(appointment.customerId),
  customer_name: appointment.customerName || null,
  type: appointment.type,
  status: appointment.status ?? 'scheduled',
  location: appointment.location || null,
  notes: appointment.notes || null,
  reminder_minutes: appointment.reminderMinutes || 30,
  created_by: appointment.createdBy
});

export const useAppointmentsStore = create<AppointmentsState>((set, get) => ({
  appointments: [],
  loading: false,
  error: null,

  fetchAppointments: async () => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) {
        throw error;
      }

      const appointments = data?.map(rowToAppointment) || [];
      set({ appointments, loading: false });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Errore nel caricamento degli appuntamenti',
        loading: false 
      });
    }
  },

  addAppointment: async (appointmentData) => {
    set({ loading: true, error: null });
    
    try {
      const insertData = appointmentToInsert(appointmentData);
      
      const { data, error } = await supabase
        .from('appointments')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newAppointment = rowToAppointment(data);
      set(state => ({
        appointments: [...state.appointments, newAppointment],
        loading: false
      }));
    } catch (error) {
      console.error('Error adding appointment:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Errore nel salvataggio dell\'appuntamento',
        loading: false 
      });
    }
  },

  updateAppointment: async (id, appointmentData) => {
    set({ loading: true, error: null });
    
    try {
      const updateData: AppointmentUpdate = {};
      
      if (appointmentData.title !== undefined) updateData.title = appointmentData.title;
      if (appointmentData.description !== undefined) updateData.description = appointmentData.description;
      if (appointmentData.startDate !== undefined) updateData.start_date = appointmentData.startDate.toISOString();
      if (appointmentData.endDate !== undefined) updateData.end_date = appointmentData.endDate.toISOString();
      if (appointmentData.customerId !== undefined) updateData.customer_id = sanitizeCustomerId(appointmentData.customerId);
      if (appointmentData.customerName !== undefined) updateData.customer_name = appointmentData.customerName;
      if (appointmentData.type !== undefined) updateData.type = appointmentData.type;
      if (appointmentData.status !== undefined) updateData.status = appointmentData.status;
      if (appointmentData.location !== undefined) updateData.location = appointmentData.location;
      if (appointmentData.notes !== undefined) updateData.notes = appointmentData.notes;
      if (appointmentData.reminderMinutes !== undefined) updateData.reminder_minutes = appointmentData.reminderMinutes;

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedAppointment = rowToAppointment(data);
      set(state => ({
        appointments: state.appointments.map(apt => 
          apt.id === id ? updatedAppointment : apt
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating appointment:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Errore nell\'aggiornamento dell\'appuntamento',
        loading: false 
      });
    }
  },

  deleteAppointment: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      set(state => ({
        appointments: state.appointments.filter(apt => apt.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting appointment:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Errore nell\'eliminazione dell\'appuntamento',
        loading: false 
      });
    }
  },

  getAppointmentsByDate: (date) => {
    const appointments = get().appointments;
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.startDate);
      return appointmentDate >= dateStart && appointmentDate <= dateEnd;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  },

  getTodayAppointments: () => {
    const today = new Date();
    return get().getAppointmentsByDate(today);
  },

  clearError: () => set({ error: null })
}));