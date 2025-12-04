import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, Eye, Edit } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
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
import { generateEmailHTML } from '../lib/emailTemplate';

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
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [watchBody, setWatchBody] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: customerEmail || '',
      subject: '',
      body: '',
    },
  });

  const bodyValue = watch('body');
  const subjectValue = watch('subject');

  // Aggiorna watchBody quando cambia il body
  useEffect(() => {
    setWatchBody(bodyValue || '');
  }, [bodyValue]);

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
      // La notifica di successo viene gestita in PriceListPrintView
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
            
            <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')}>
              <Tabs.List className="inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1 mb-2">
                <Tabs.Trigger
                  value="edit"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editor
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="preview"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Anteprima
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="edit" className="mt-0">
                <Textarea
                  id="body"
                  placeholder="Corpo dell'email"
                  rows={10}
                  {...register('body')}
                  className={errors.body ? 'border-red-500' : ''}
                  disabled={isSending}
                />
                {errors.body && (
                  <p className="text-sm text-red-600 mt-1">{errors.body.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Il PDF del listino verrà allegato automaticamente
                </p>
              </Tabs.Content>

              <Tabs.Content value="preview" className="mt-0">
                <div className="border rounded-lg overflow-hidden bg-white">
                  <div className="bg-gray-50 border-b px-4 py-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-600">Anteprima Email</p>
                    <p className="text-xs text-gray-500">Soggetto: {subjectValue || '(vuoto)'}</p>
                  </div>
                  <div 
                    className="overflow-auto bg-gray-100 p-4"
                    style={{ maxHeight: '450px' }}
                  >
                    {watchBody ? (
                      <div className="bg-white rounded shadow-sm" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <iframe
                          srcDoc={generateEmailHTML(watchBody, customerName, priceListName)}
                          className="w-full border-0"
                          style={{ 
                            minHeight: '400px',
                            display: 'block'
                          }}
                          title="Anteprima email"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[400px] text-gray-400">
                        <div className="text-center">
                          <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Scrivi qualcosa nell'editor per vedere l'anteprima</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Questa è l'anteprima di come apparirà l'email al destinatario con i colori FARMAP
                </p>
              </Tabs.Content>
            </Tabs.Root>
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

