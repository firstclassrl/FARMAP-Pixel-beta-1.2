import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Phone, Bell, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { Appointment } from '../types/calendar.types';
import { format, isToday, startOfDay, endOfDay } from 'date-fns';
import { it } from 'date-fns/locale';

export const DailyAppointments: React.FC = () => {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - in real app, this would come from Supabase
  useEffect(() => {
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        title: 'Presentazione prodotti FARMAP',
        description: 'Presentazione del nuovo catalogo prodotti al cliente',
        startDate: new Date(2025, 0, 17, 10, 0),
        endDate: new Date(2025, 0, 17, 11, 30),
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
        startDate: new Date(2025, 0, 17, 14, 0),
        endDate: new Date(2025, 0, 17, 14, 30),
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
        startDate: new Date(2025, 0, 17, 9, 0),
        endDate: new Date(2025, 0, 17, 9, 0),
        customerId: 'cust-3',
        customerName: 'AgriTech Solutions',
        type: 'reminder',
        status: 'scheduled',
        notes: 'Preventivo urgente - cliente in attesa',
        reminderMinutes: 60,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Filter appointments for today
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    
    const filteredAppointments = mockAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startDate);
      return appointmentDate >= todayStart && appointmentDate <= todayEnd;
    });

    // Sort by start time
    filteredAppointments.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    setTodayAppointments(filteredAppointments);
    setLoading(false);
  }, []);

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

  const getNextAppointment = () => {
    const now = new Date();
    return todayAppointments.find(appointment => 
      new Date(appointment.startDate) > now
    );
  };

  const nextAppointment = getNextAppointment();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-yellow-600" />
            Impegni di Oggi - {format(new Date(), 'dd MMMM yyyy', { locale: it })}
          </CardTitle>
          <Link to="/calendar">
            <Button variant="outline" size="sm" className="text-yellow-600 border-yellow-600 hover:bg-yellow-50">
              <ChevronRight className="w-4 h-4 mr-1" />
              Vedi tutto
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {todayAppointments.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nessun impegno programmato per oggi</p>
            <p className="text-gray-400 text-xs mt-1">Goditi una giornata tranquilla!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Next Appointment Highlight */}
            {nextAppointment && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Prossimo impegno</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{nextAppointment.title}</h4>
                    <p className="text-sm text-gray-600">
                      {format(new Date(nextAppointment.startDate), 'HH:mm', { locale: it })}
                      {nextAppointment.customerName && ` • ${nextAppointment.customerName}`}
                    </p>
                  </div>
                  <Badge className={`text-xs ${getAppointmentColor(nextAppointment.type)}`}>
                    {nextAppointment.type}
                  </Badge>
                </div>
              </div>
            )}

            {/* All Today's Appointments */}
            <div className="space-y-3">
              {todayAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getAppointmentColor(appointment.type)}`}>
                      {getAppointmentIcon(appointment.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm text-gray-900">{appointment.title}</h4>
                        <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(appointment.startDate), 'HH:mm', { locale: it })}
                        </div>
                        {appointment.customerName && (
                          <span>{appointment.customerName}</span>
                        )}
                        {appointment.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {appointment.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge className={`text-xs ${getAppointmentColor(appointment.type)}`}>
                    {appointment.type}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Totale impegni: {todayAppointments.length}</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Appuntamenti</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Chiamate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Promemoria</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
