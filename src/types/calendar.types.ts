export interface Appointment {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  customerId?: string;
  customerName?: string;
  type: 'appointment' | 'call' | 'reminder';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  location?: string;
  notes?: string;
  reminderMinutes?: number; // Minutes before appointment to remind
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type: 'appointment' | 'call' | 'reminder';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  customerName?: string;
  location?: string;
  color?: string;
}

export interface AppointmentFormData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  customerId?: string;
  customerName?: string;
  type: 'appointment' | 'call' | 'reminder';
  status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  location?: string;
  notes?: string;
  reminderMinutes?: number;
}

export interface CalendarFilters {
  showAppointments: boolean;
  showCalls: boolean;
  showReminders: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
}
