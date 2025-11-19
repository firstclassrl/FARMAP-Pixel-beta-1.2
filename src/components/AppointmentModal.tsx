import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Phone, Bell, User, FileText, X } from 'lucide-react';
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

  const formatDateForInput = (date: Date) => {
    const pad = (value: number) => value.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (date: Date) => {
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${hours}:${minutes}`;
  };

  const mergeDateAndTime = (dateValue: string, timeValue: string) => {
    if (!dateValue) return new Date();
    const [year, month, day] = dateValue.split('-').map(Number);
    const [hour = 0, minute = 0] = (timeValue || '00:00').split(':').map(Number);
    return new Date(year, (month || 1) - 1, day || 1, hour, minute);
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
    }
  }, [appointment]);

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

    if (formData.type === 'appointment' && !formData.location.trim()) {
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
                  type="date"
                  lang="it-IT"
                  value={formatDateForInput(formData.startDate)}
                  onChange={(e) => handleInputChange(
                    'startDate',
                    mergeDateAndTime(e.target.value, formatTimeForInput(formData.startDate))
                  )}
                  className={errors.startDate ? 'border-red-500' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Ora Inizio *</Label>
                <Input
                  id="startTime"
                  type="time"
                  step={300}
                  lang="it-IT"
                  value={formatTimeForInput(formData.startDate)}
                  onChange={(e) => handleInputChange(
                    'startDate',
                    mergeDateAndTime(formatDateForInput(formData.startDate), e.target.value)
                  )}
                  className={errors.startDate ? 'border-red-500' : ''}
                />
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
                  type="date"
                  lang="it-IT"
                  value={formatDateForInput(formData.endDate)}
                  onChange={(e) => handleInputChange(
                    'endDate',
                    mergeDateAndTime(e.target.value, formatTimeForInput(formData.endDate))
                  )}
                  className={errors.endDate ? 'border-red-500' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Ora Fine *</Label>
                <Input
                  id="endTime"
                  type="time"
                  step={300}
                  lang="it-IT"
                  value={formatTimeForInput(formData.endDate)}
                  onChange={(e) => handleInputChange(
                    'endDate',
                    mergeDateAndTime(formatDateForInput(formData.endDate), e.target.value)
                  )}
                  className={errors.endDate ? 'border-red-500' : ''}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="customerId">ID cliente (opzionale)</Label>
              <Input
                id="customerId"
                value={formData.customerId}
                onChange={(e) => handleInputChange('customerId', e.target.value.trim())}
                placeholder="UUID cliente (se presente)"
                className="font-mono text-xs"
              />
              <p className="text-xs text-gray-500">
                Lascia vuoto se non hai l'ID. Usa solo valori UUID validi.
              </p>
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
                  value={formData.location}
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
              value={formData.reminderMinutes.toString()}
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
