import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Phone, Bell, Plus, Filter, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { AppointmentModal } from '../components/AppointmentModal';
import { CalendarFilters } from '../components/CalendarFilters';
import { Appointment, CalendarEvent, AppointmentFormData } from '../types/calendar.types';
import { useAuth } from '../hooks/useAuth';
import { useAppointmentsStore } from '../store/useAppointmentsStore';
import { format, startOfDay, endOfDay, isToday, isTomorrow, isYesterday, addDays, subDays } from 'date-fns';
import { it } from 'date-fns/locale';

export default function CalendarPage() {
  const { profile } = useAuth();
  const { appointments, addAppointment, updateAppointment, deleteAppointment, getAppointmentsByDate } = useAppointmentsStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

  // Get appointments for the selected date
  const selectedDateAppointments = getAppointmentsByDate(selectedDate);

  const getAppointmentsForDate = (date: Date) => {
    return getAppointmentsByDate(date);
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
    let filtered = selectedDateAppointments;
    
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
    addAppointment({
      ...formData,
      status: 'scheduled',
      createdBy: profile?.id || 'user-1'
    });
    setShowAppointmentModal(false);
  };

  const handleUpdateAppointment = (formData: AppointmentFormData) => {
    if (!editingAppointment) return;
    
    updateAppointment(editingAppointment.id, formData);
    setEditingAppointment(null);
    setShowAppointmentModal(false);
  };

  const handleDeleteAppointment = (id: string) => {
    deleteAppointment(id);
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
                variant="ghost"
                className="p-1 h-6 w-6 hover:bg-blue-50"
                onClick={() => {
                  setEditingAppointment(appointment);
                  setShowAppointmentModal(true);
                }}
                title="Modifica appuntamento"
              >
                <Edit className="w-3 h-3 text-blue-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="p-1 h-6 w-6 hover:bg-red-50"
                onClick={() => handleDeleteAppointment(appointment.id)}
                title="Elimina appuntamento"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
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
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-4 h-4 text-yellow-600" />
                Oggi - {format(selectedDate, 'dd MMM', { locale: it })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {todayAppointments.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Nessun appuntamento</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`p-1.5 rounded ${getAppointmentColor(appointment.type)}`}>
                          {getAppointmentIcon(appointment.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 truncate">{appointment.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {format(new Date(appointment.startDate), 'HH:mm', { locale: it })}
                            {appointment.customerName && (
                              <span className="truncate">• {appointment.customerName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1 h-5 w-5 hover:bg-blue-50"
                          onClick={() => {
                            setEditingAppointment(appointment);
                            setShowAppointmentModal(true);
                          }}
                          title="Modifica"
                        >
                          <Edit className="w-3 h-3 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1 h-5 w-5 hover:bg-red-50"
                          onClick={() => handleDeleteAppointment(appointment.id)}
                          title="Elimina"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
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
