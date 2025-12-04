import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useNotifications } from '../store/useStore';

const emailSchema = z.object({
  email: z.string().email('Email non valida').min(1, 'Email richiesta'),
  subject: z.string().min(1, 'Soggetto richiesto'),
  body: z.string().min(1, 'Corpo email richiesto'),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface SendPriceListEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceListId: string;
  priceListName: string;
  customerEmail?: string;
  customerName?: string;
  onSend: (data: EmailFormData) => Promise<void>;
}

export function SendPriceListEmailModal({
  isOpen,
  onClose,
  priceListId,
  priceListName,
  customerEmail,
  customerName,
  onSend,
}: SendPriceListEmailModalProps) {
  const { addNotification } = useNotifications();
  const [isSending, setIsSending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: customerEmail || '',
      subject: '',
      body: '',
    },
  });

  // Aggiorna i valori quando cambiano le props o quando si apre la modale
  useEffect(() => {
    if (isOpen) {
      const defaultSubject = `Listino Prezzi FARMAP - ${priceListName}`;
      const defaultBody = `Gentile ${customerName || 'Cliente'},

In allegato troverete il vostro listino prezzi personalizzato.

Listino: ${priceListName}
Data: ${new Date().toLocaleDateString('it-IT')}

Per qualsiasi domanda o chiarimento, non esitate a contattarci.

Cordiali saluti,
Team FARMAP`;

      setValue('email', customerEmail || '');
      setValue('subject', defaultSubject);
      setValue('body', defaultBody);
    }
  }, [isOpen, customerEmail, priceListName, customerName, setValue]);

  const onSubmit = async (data: EmailFormData) => {
    try {
      setIsSending(true);
      await onSend(data);
      addNotification({
        type: 'success',
        title: 'Email inviata',
        message: `Email inviata con successo a ${data.email}`,
      });
      reset();
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: error instanceof Error ? error.message : 'Impossibile inviare l\'email',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Invia Listino via Email</span>
          </DialogTitle>
          <DialogDescription>
            Compila i campi per inviare il listino al cliente. Tutti i campi sono modificabili.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Destinatario <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="cliente@example.com"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
              disabled={isSending}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
            {customerEmail && (
              <p className="text-xs text-gray-500">
                Email precompilata dall'anagrafica cliente
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">
              Soggetto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              type="text"
              placeholder="Soggetto email"
              {...register('subject')}
              className={errors.subject ? 'border-red-500' : ''}
              disabled={isSending}
            />
            {errors.subject && (
              <p className="text-sm text-red-600">{errors.subject.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Soggetto preimpostato con il nome del listino
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">
              Corpo Email <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="body"
              placeholder="Corpo dell'email"
              rows={10}
              {...register('body')}
              className={errors.body ? 'border-red-500' : ''}
              disabled={isSending}
            />
            {errors.body && (
              <p className="text-sm text-red-600">{errors.body.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Il PDF del listino verrà allegato automaticamente
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSending}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Invio in corso...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Invia Email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

