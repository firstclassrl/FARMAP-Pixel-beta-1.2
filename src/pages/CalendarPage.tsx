import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Phone, Bell, Plus, Filter, Search, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { AppointmentModal } from '../components/AppointmentModal';
import { CalendarFilters } from '../components/CalendarFilters';
import { Appointment, AppointmentFormData } from '../types/calendar.types';
import { useAuth } from '../hooks/useAuth';
import { useAppointmentsStore } from '../store/useAppointmentsStore';
import { format, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import { it } from 'date-fns/locale';

export default function CalendarPage() {
  const { profile } = useAuth();
  const { 
    appointments, 
    loading, 
    error, 
    fetchAppointments, 
    addAppointment, 
    updateAppointment, 
    deleteAppointment, 
    getAppointmentsByDate,
    clearError 
  } = useAppointmentsStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

  // Carica gli appuntamenti all'avvio del componente
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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

  const handleCreateAppointment = async (formData: AppointmentFormData) => {
    if (!profile?.id) {
      console.error('User profile not found');
      return;
    }
    
    try {
      await addAppointment({
        ...formData,
        createdBy: profile.id
      });
      setShowAppointmentModal(false);
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  const handleUpdateAppointment = async (formData: AppointmentFormData) => {
    if (!editingAppointment) return;
    
    try {
      await updateAppointment(editingAppointment.id, formData);
      setEditingAppointment(null);
      setShowAppointmentModal(false);
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await deleteAppointment(id);
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
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
                <span className="font-semibold text-gray-700">
                  {format(new Date(appointment.startDate), 'dd MMM yyyy HH:mm', { locale: it })}
                </span>
                {appointment.endDate && (
                  <span className="font-semibold text-gray-500">
                    {' '}→ {format(new Date(appointment.endDate), 'HH:mm', { locale: it })}
                  </span>
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

  const getViewAppointments = () => {
    switch (viewMode) {
      case 'day':
        return getAppointmentsForDate(selectedDate);
      case 'week':
        return getAppointmentsForWeek(selectedDate);
      case 'month':
        return getAppointmentsForMonth(selectedDate);
      default:
        return getAppointmentsForWeek(selectedDate);
    }
  };

  const navigatePrev = () => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      if (viewMode === 'day') next.setDate(prev.getDate() - 1);
      if (viewMode === 'week') next.setDate(prev.getDate() - 7);
      if (viewMode === 'month') next.setMonth(prev.getMonth() - 1);
      return next;
    });
  };

  const navigateNext = () => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      if (viewMode === 'day') next.setDate(prev.getDate() + 1);
      if (viewMode === 'week') next.setDate(prev.getDate() + 7);
      if (viewMode === 'month') next.setMonth(prev.getMonth() + 1);
      return next;
    });
  };

  const viewTitle = () => {
    if (viewMode === 'day') return format(selectedDate, "EEEE dd MMMM yyyy", { locale: it });
    if (viewMode === 'week') {
      const start = startOfDay(subDays(selectedDate, selectedDate.getDay()));
      const end = endOfDay(addDays(start, 6));
      return `${format(start, 'dd MMM', { locale: it })} - ${format(end, 'dd MMM yyyy', { locale: it })}`;
    }
    return format(selectedDate, 'MMMM yyyy', { locale: it });
  };

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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Errore</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Caricamento appuntamenti...</span>
          </div>
        </div>
      )}

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
        <CalendarFilters onFiltersChange={() => { /* filter logic to be implemented */ }} />
      )}

      {/* View Mode Toggle and navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={navigatePrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="px-2 text-sm text-gray-700 min-w-[180px] text-center">{viewTitle()}</div>
        <Button variant="outline" size="icon" onClick={navigateNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-gray-200 mx-2" />
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
        <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())}>Oggi</Button>
      </div>

      {/* Calendar Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-4 h-4 text-yellow-600" />
                {format(selectedDate, "EEEE dd MMM", { locale: it })}
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

        {/* Appointments by current view */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {viewMode === 'day' && 'Appuntamenti del giorno'}
                {viewMode === 'week' && 'Appuntamenti della settimana'}
                {viewMode === 'month' && 'Appuntamenti del mese'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getViewAppointments().length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {searchTerm ? 'Nessun appuntamento trovato' : 'Nessun appuntamento programmato'}
                </p>
              ) : (
                <div className="space-y-3">
                  {getViewAppointments().map(renderAppointmentCard)}
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
