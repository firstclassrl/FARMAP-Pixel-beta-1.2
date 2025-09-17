import React, { useState } from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { CalendarFilters as CalendarFiltersType } from '../types/calendar.types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';

interface CalendarFiltersProps {
  onFiltersChange: (filters: CalendarFiltersType) => void;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  onFiltersChange
}) => {
  const [filters, setFilters] = useState<CalendarFiltersType>({
    showAppointments: true,
    showCalls: true,
    showReminders: true,
    dateRange: {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    }
  });

  const handleFilterChange = (key: keyof CalendarFiltersType, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = {
      ...filters.dateRange,
      [field]: new Date(value)
    };
    const newFilters = { ...filters, dateRange: newDateRange };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters: CalendarFiltersType = {
      showAppointments: true,
      showCalls: true,
      showReminders: true,
      dateRange: {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
      }
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtri Calendario
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Mostra Tipi</Label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.showAppointments}
                onChange={(e) => handleFilterChange('showAppointments', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Appuntamenti</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.showCalls}
                onChange={(e) => handleFilterChange('showCalls', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Chiamate</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.showReminders}
                onChange={(e) => handleFilterChange('showReminders', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Promemoria</span>
            </label>
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Intervallo Date</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs text-gray-500">
                Data Inizio
              </Label>
              <Input
                id="startDate"
                type="date"
                value={format(filters.dateRange.start, 'yyyy-MM-dd')}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs text-gray-500">
                Data Fine
              </Label>
              <Input
                id="endDate"
                type="date"
                value={format(filters.dateRange.end, 'yyyy-MM-dd')}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Periodi Rapidi</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const today = new Date();
                const newFilters = {
                  ...filters,
                  dateRange: {
                    start: today,
                    end: today
                  }
                };
                setFilters(newFilters);
                onFiltersChange(newFilters);
              }}
            >
              Oggi
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const newFilters = {
                  ...filters,
                  dateRange: {
                    start: today,
                    end: tomorrow
                  }
                };
                setFilters(newFilters);
                onFiltersChange(newFilters);
              }}
            >
              Domani
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const today = new Date();
                const weekEnd = new Date(today);
                weekEnd.setDate(weekEnd.getDate() + 7);
                const newFilters = {
                  ...filters,
                  dateRange: {
                    start: today,
                    end: weekEnd
                  }
                };
                setFilters(newFilters);
                onFiltersChange(newFilters);
              }}
            >
              Prossimi 7 giorni
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newFilters = {
                  ...filters,
                  dateRange: {
                    start: startOfMonth(new Date()),
                    end: endOfMonth(new Date())
                  }
                };
                setFilters(newFilters);
                onFiltersChange(newFilters);
              }}
            >
              Questo mese
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-3 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={resetFilters}
          >
            <X className="w-4 h-4 mr-1" />
            Reset
          </Button>
          <div className="text-xs text-gray-500">
            {format(filters.dateRange.start, 'dd MMM yyyy', { locale: it })} - {format(filters.dateRange.end, 'dd MMM yyyy', { locale: it })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
