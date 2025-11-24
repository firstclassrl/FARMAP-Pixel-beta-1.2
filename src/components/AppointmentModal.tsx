import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Phone, Bell, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Appointment, AppointmentFormData } from '../types/calendar.types';

interface AppointmentModalProps {
  appointment?: Appointment | null;
  onSave: (data: AppointmentFormData) => void;
  onClose: () => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  appointment,
  onSave,
  onClose
}) => {
  const pad = (value: number) => value.toString().padStart(2, '0');

  const formatDateForDisplay = (date: Date) => {
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTimeForInput = (date: Date) => {
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${hours}:${minutes}`;
  };

  const mergeDateAndTime = (dateValue: Date, timeValue: string) => {
    const [hour = 0, minute = 0] = (timeValue || '00:00').split(':').map(Number);
    const date = new Date(dateValue);
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  const [formData, setFormData] = useState<AppointmentFormData>({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    customerId: '',
    customerName: '',
    type: 'appointment',
    status: 'scheduled',
    location: '',
    notes: '',
    reminderMinutes: 30
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [timeInputs, setTimeInputs] = useState({
    start: formatTimeForInput(formData.startDate),
    end: formatTimeForInput(formData.endDate)
  });
  const [dateInputs, setDateInputs] = useState({
    start: formatDateForDisplay(formData.startDate),
    end: formatDateForDisplay(formData.endDate)
  });

  useEffect(() => {
    if (appointment) {
      setFormData({
        title: appointment.title,
        description: appointment.description || '',
        startDate: new Date(appointment.startDate),
        endDate: new Date(appointment.endDate),
        customerId: appointment.customerId || '',
        customerName: appointment.customerName || '',
        type: appointment.type,
        status: appointment.status,
        location: appointment.location || '',
        notes: appointment.notes || '',
        reminderMinutes: appointment.reminderMinutes || 30
      });
    } else {
      const now = new Date();
      const later = new Date(Date.now() + 60 * 60 * 1000);
      setTimeInputs({
        start: formatTimeForInput(now),
        end: formatTimeForInput(later)
      });
      setDateInputs({
        start: formatDateForDisplay(now),
        end: formatDateForDisplay(later)
      });
    }
  }, [appointment]);

  useEffect(() => {
    setTimeInputs({
      start: formatTimeForInput(formData.startDate),
      end: formatTimeForInput(formData.endDate)
    });
    setDateInputs({
      start: formatDateForDisplay(formData.startDate),
      end: formatDateForDisplay(formData.endDate)
    });
  }, [formData.startDate, formData.endDate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Il titolo è obbligatorio';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La data di inizio è obbligatoria';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'La data di fine è obbligatoria';
    }

    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'La data di fine deve essere successiva alla data di inizio';
    }

    const locationValue = formData.location ?? '';
    if (formData.type === 'appointment' && !locationValue.trim()) {
      newErrors.location = 'La location è obbligatoria per gli appuntamenti';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field: keyof AppointmentFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'reminder': return <Bell className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const hoursOptions = Array.from({ length: 24 }, (_, i) => pad(i));
  const minutesOptions = Array.from({ length: 60 }, (_, i) => pad(i));

  const handleTimeSelectChange = (field: 'start' | 'end', part: 'hour' | 'minute', value: string) => {
    setTimeInputs(prev => {
      const [currentHour = '00', currentMinute = '00'] = (prev[field] || '00:00').split(':');
      const nextHour = part === 'hour' ? value : currentHour;
      const nextMinute = part === 'minute' ? value : currentMinute;
      const nextTime = `${nextHour}:${nextMinute}`;
      const dateField = field === 'start' ? 'startDate' : 'endDate';
      handleInputChange(dateField, mergeDateAndTime(formData[dateField], nextTime));
      return {
        ...prev,
        [field]: nextTime
      };
    });
  };

  const parseDisplayDate = (value: string): Date | null => {
    if (!/^(\d{2})\/(\d{2})\/(\d{4})$/.test(value)) {
      return null;
    }
    const [day, month, year] = value.split('/').map(Number);
    const parsed = new Date(year, (month || 1) - 1, day || 1);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== (month || 1) - 1 ||
      parsed.getDate() !== day
    ) {
      return null;
    }
    return parsed;
  };

  const handleDateInputChange = (field: 'start' | 'end', value: string) => {
    setDateInputs(prev => ({
      ...prev,
      [field]: value
    }));

    const parsedDate = parseDisplayDate(value);
    if (parsedDate) {
      const dateField = field === 'start' ? 'startDate' : 'endDate';
      const existingDate = formData[dateField];
      parsedDate.setHours(existingDate.getHours(), existingDate.getMinutes(), 0, 0);
      handleInputChange(dateField, parsedDate);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'appointment': return 'Appuntamento';
      case 'call': return 'Chiamata';
      case 'reminder': return 'Promemoria';
      default: return 'Appuntamento';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(formData.type)}
            {appointment ? 'Modifica Appuntamento' : 'Nuovo Appuntamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'appointment' | 'call' | 'reminder') => 
                handleInputChange('type', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appointment">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Appuntamento
                  </div>
                </SelectItem>
                <SelectItem value="call">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Chiamata
                  </div>
                </SelectItem>
                <SelectItem value="reminder">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Promemoria
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titolo *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Es. Presentazione prodotti FARMAP"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrizione dettagliata dell'appuntamento..."
              rows={3}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inizio *</Label>
                <Input
                  id="startDate"
                  type="text"
                  inputMode="numeric"
                  placeholder="gg/mm/aaaa"
                  value={dateInputs.start}
                  onChange={(e) => handleDateInputChange('start', e.target.value)}
                  onBlur={() => setDateInputs(prev => ({
                    ...prev,
                    start: formatDateForDisplay(formData.startDate)
                  }))}
                  className={`font-mono ${errors.startDate ? 'border-red-500' : ''}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Ora Inizio *</Label>
                <div className={`grid grid-cols-2 gap-2 ${errors.startDate ? 'text-red-500' : ''}`}>
                  <Select
                    value={(timeInputs.start || '00:00').split(':')[0]}
                    onValueChange={(value) => handleTimeSelectChange('start', 'hour', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hoursOptions.map(hour => (
                        <SelectItem key={`start-hour-${hour}`} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={(timeInputs.start || '00:00').split(':')[1]}
                    onValueChange={(value) => handleTimeSelectChange('start', 'minute', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {minutesOptions.map(minute => (
                        <SelectItem key={`start-minute-${minute}`} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.startDate && (
                  <p className="text-sm text-red-500">{errors.startDate}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fine *</Label>
                <Input
                  id="endDate"
                  type="text"
                  inputMode="numeric"
                  placeholder="gg/mm/aaaa"
                  value={dateInputs.end}
                  onChange={(e) => handleDateInputChange('end', e.target.value)}
                  onBlur={() => setDateInputs(prev => ({
                    ...prev,
                    end: formatDateForDisplay(formData.endDate)
                  }))}
                  className={`font-mono ${errors.endDate ? 'border-red-500' : ''}`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Ora Fine *</Label>
                <div className={`grid grid-cols-2 gap-2 ${errors.endDate ? 'text-red-500' : ''}`}>
                  <Select
                    value={(timeInputs.end || '00:00').split(':')[0]}
                    onValueChange={(value) => handleTimeSelectChange('end', 'hour', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hoursOptions.map(hour => (
                        <SelectItem key={`end-hour-${hour}`} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={(timeInputs.end || '00:00').split(':')[1]}
                    onValueChange={(value) => handleTimeSelectChange('end', 'minute', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {minutesOptions.map(minute => (
                        <SelectItem key={`end-minute-${minute}`} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.endDate && (
                  <p className="text-sm text-red-500">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="space-y-2">
            <Label htmlFor="customerName">Cliente (nome)</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Nome cliente o azienda"
                className="pl-10"
              />
            </div>
          </div>

          {/* Location (only for appointments) */}
          {formData.type === 'appointment' && (
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="location"
                  value={formData.location ?? ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Indirizzo o luogo dell'appuntamento"
                  className={`pl-10 ${errors.location ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.location && (
                <p className="text-sm text-red-500">{errors.location}</p>
              )}
            </div>
          )}

          {/* Reminder */}
          <div className="space-y-2">
            <Label htmlFor="reminderMinutes">Promemoria (minuti prima)</Label>
            <Select
              value={(formData.reminderMinutes ?? 30).toString()}
              onValueChange={(value) => handleInputChange('reminderMinutes', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Nessun promemoria</SelectItem>
                <SelectItem value="15">15 minuti prima</SelectItem>
                <SelectItem value="30">30 minuti prima</SelectItem>
                <SelectItem value="60">1 ora prima</SelectItem>
                <SelectItem value="120">2 ore prima</SelectItem>
                <SelectItem value="1440">1 giorno prima</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Note aggiuntive..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit">
              {appointment ? 'Aggiorna' : 'Crea'} {getTypeLabel(formData.type)}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
