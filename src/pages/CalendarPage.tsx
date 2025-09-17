import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Phone, Bell, Plus, Filter, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { AppointmentModal } from '../components/AppointmentModal';
import { CalendarFilters } from '../components/CalendarFilters';
import { Appointment, CalendarEvent, AppointmentFormData } from '../types/calendar.types';
import { useAuth } from '../hooks/useAuth';
import { format, startOfDay, endOfDay, isToday, isTomorrow, isYesterday, addDays, subDays } from 'date-fns';
import { it } from 'date-fns/locale';

export default function CalendarPage() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

  // Mock data - in real app, this would come from Supabase
  useEffect(() => {
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        title: 'Presentazione prodotti FARMAP',
        description: 'Presentazione del nuovo catalogo prodotti al cliente',
        startDate: new Date(2025, 0, 20, 10, 0),
        endDate: new Date(2025, 0, 20, 11, 30),
        customerId: 'cust-1',
        customerName: 'Azienda Agricola Rossi',
        type: 'appointment',
        status: 'scheduled',
        location: 'Via Roma 123, Milano',
        notes: 'Portare campioni del nuovo fertilizzante',
        reminderMinutes: 30,
        createdBy: profile?.id || 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        title: 'Chiamata follow-up',
        description: 'Chiamata di follow-up per ordine in corso',
        startDate: new Date(2025, 0, 21, 14, 0),
        endDate: new Date(2025, 0, 21, 14, 30),
        customerId: 'cust-2',
        customerName: 'Cooperativa Verde',
        type: 'call',
        status: 'scheduled',
        reminderMinutes: 15,
        createdBy: profile?.id || 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        title: 'Promemoria: Inviare preventivo',
        description: 'Inviare preventivo per ordine di 1000kg fertilizzante',
        startDate: new Date(2025, 0, 22, 9, 0),
        endDate: new Date(2025, 0, 22, 9, 0),
        customerId: 'cust-3',
        customerName: 'AgriTech Solutions',
        type: 'reminder',
        status: 'scheduled',
        notes: 'Preventivo urgente - cliente in attesa',
        reminderMinutes: 60,
        createdBy: profile?.id || 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    setAppointments(mockAppointments);
  }, [profile?.id]);

  const getAppointmentsForDate = (date: Date) => {
    const start = startOfDay(date);
    const end = endOfDay(date);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startDate);
      return appointmentDate >= start && appointmentDate <= end;
    });
  };

  const getAppointmentsForWeek = (date: Date) => {
    const start = startOfDay(subDays(date, date.getDay()));
    const end = endOfDay(addDays(start, 6));
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startDate);
      return appointmentDate >= start && appointmentDate <= end;
    });
  };

  const getAppointmentsForMonth = (date: Date) => {
    const start = startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
    const end = endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startDate);
      return appointmentDate >= start && appointmentDate <= end;
    });
  };

  const getFilteredAppointments = () => {
    let filtered = appointments;
    
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const handleCreateAppointment = (formData: AppointmentFormData) => {
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      ...formData,
      status: 'scheduled',
      createdBy: profile?.id || 'user-1',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setAppointments(prev => [...prev, newAppointment]);
    setShowAppointmentModal(false);
  };

  const handleUpdateAppointment = (formData: AppointmentFormData) => {
    if (!editingAppointment) return;
    
    setAppointments(prev => prev.map(appointment =>
      appointment.id === editingAppointment.id
        ? { ...appointment, ...formData, updatedAt: new Date() }
        : appointment
    ));
    
    setEditingAppointment(null);
    setShowAppointmentModal(false);
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(appointment => appointment.id !== id));
  };

  const getAppointmentIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'reminder': return <Bell className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getAppointmentColor = (type: string) => {
    switch (type) {
      case 'appointment': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'call': return 'bg-green-100 text-green-800 border-green-200';
      case 'reminder': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => (
    <Card key={appointment.id} className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getAppointmentIcon(appointment.type)}
              <h3 className="font-semibold text-sm">{appointment.title}</h3>
              <Badge className={`text-xs ${getAppointmentColor(appointment.type)}`}>
                {appointment.type}
              </Badge>
            </div>
            
            {appointment.customerName && (
              <p className="text-sm text-gray-600 mb-1">
                <strong>Cliente:</strong> {appointment.customerName}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(appointment.startDate), 'HH:mm', { locale: it })}
                {appointment.endDate && (
                  <> - {format(new Date(appointment.endDate), 'HH:mm', { locale: it })}</>
                )}
              </div>
              
              {appointment.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {appointment.location}
                </div>
              )}
            </div>
            
            {appointment.description && (
              <p className="text-sm text-gray-600 mb-2">{appointment.description}</p>
            )}
            
            {appointment.notes && (
              <p className="text-xs text-gray-500 italic">{appointment.notes}</p>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
              {appointment.status}
            </Badge>
            
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingAppointment(appointment);
                  setShowAppointmentModal(true);
                }}
              >
                Modifica
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteAppointment(appointment.id)}
              >
                Elimina
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const todayAppointments = getAppointmentsForDate(selectedDate);
  const filteredAppointments = getFilteredAppointments();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendario Vendite</h1>
          <p className="text-gray-600 mt-1">
            Gestisci appuntamenti, chiamate e promemoria
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtri
          </Button>
          
          <Button onClick={() => setShowAppointmentModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Appuntamento
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Cerca appuntamenti, clienti o note..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <CalendarFilters
          onFiltersChange={(filters) => {
            // Implement filter logic
            console.log('Filters changed:', filters);
          }}
        />
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('day')}
        >
          Giorno
        </Button>
        <Button
          variant={viewMode === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('week')}
        >
          Settimana
        </Button>
        <Button
          variant={viewMode === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('month')}
        >
          Mese
        </Button>
      </div>

      {/* Calendar Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Oggi - {format(selectedDate, 'dd MMMM yyyy', { locale: it })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayAppointments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nessun appuntamento per oggi
                </p>
              ) : (
                <div className="space-y-3">
                  {todayAppointments.map(renderAppointmentCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Appointments */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Tutti gli Appuntamenti</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAppointments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {searchTerm ? 'Nessun appuntamento trovato' : 'Nessun appuntamento programmato'}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredAppointments.map(renderAppointmentCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <AppointmentModal
          appointment={editingAppointment}
          onSave={editingAppointment ? handleUpdateAppointment : handleCreateAppointment}
          onClose={() => {
            setShowAppointmentModal(false);
            setEditingAppointment(null);
          }}
        />
      )}
    </div>
  );
}
