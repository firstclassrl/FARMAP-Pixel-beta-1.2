# 🔄 Soluzione Alternativa: Upload PDF dal Frontend

## Problema Attuale

Il backend su Railway sta restituendo 404 per le richieste OPTIONS, causando errori CORS. Mentre risolviamo il problema Railway, possiamo usare questa soluzione alternativa.

## Soluzione: Upload PDF dal Frontend

Invece di caricare il PDF dal backend, possiamo:
1. Generare il PDF usando il backend (endpoint esistente)
2. Caricare il PDF direttamente dal frontend su Supabase Storage
3. Chiamare il webhook N8N dal frontend

## Modifiche Necessarie

### 1. Modificare `handleSendEmailComplete` in `PriceListPrintView.tsx`

```typescript
const handleSendEmailComplete = async (emailData: { email: string; subject: string; body: string }) => {
  if (!priceList) {
    throw new Error('Listino non disponibile');
  }
  
  try {
    setIsGeneratingPDF(true);
    
    // 1. Genera PDF usando endpoint esistente (senza upload)
    const requestBody = preparePdfRequestBody();
    if (!requestBody) {
      throw new Error('Impossibile preparare i dati del listino');
    }

    let backendUrl = resolveBackendUrl();
    if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
      backendUrl = 'https://' + backendUrl;
    }
    const cleanBackendUrl = backendUrl.replace(/\/$/, '');
    const endpoint = `${cleanBackendUrl}/api/generate-price-list-pdf`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    // 2. Ottieni il PDF come blob
    const pdfBlob = await response.blob();
    
    // 3. Carica PDF su Supabase Storage
    const priceListId = priceList.id;
    const timestamp = Date.now();
    const fileName = `listino_${priceListId}_${timestamp}.pdf`;
    const filePath = fileName;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('order-pdfs')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // 4. Ottieni URL pubblico
    const { data: urlData } = supabase.storage
      .from('order-pdfs')
      .getPublicUrl(filePath);

    const pdfUrl = urlData?.publicUrl;
    if (!pdfUrl) {
      throw new Error('Failed to get public URL for uploaded PDF');
    }

    // 5. Chiama webhook N8N
    const webhookUrl = import.meta.env.VITE_N8N_PRICELIST_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('URL webhook N8N non configurato');
    }

    const webhookPayload = {
      email: emailData.email,
      subject: emailData.subject,
      body: emailData.body,
      pdfUrl: pdfUrl,
      priceListId: priceList.id,
      priceListName: priceList.name,
      customerName: priceList.customer?.company_name || 'Cliente',
      customerEmail: priceList.customer?.email || emailData.email,
      fileName: fileName
    };

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      throw new Error(`Errore webhook N8N: ${errorText}`);
    }

    addNotification({
      type: 'success',
      title: 'Email inviata',
      message: `Email inviata con successo a ${emailData.email}`
    });

  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  } finally {
    setIsGeneratingPDF(false);
  }
};
```

## Vantaggi

- ✅ Non dipende dal backend per l'upload
- ✅ Evita problemi CORS con Railway
- ✅ Usa l'endpoint PDF esistente che funziona
- ✅ Carica direttamente su Supabase dal frontend

## Requisiti

- Bucket `order-pdfs` configurato e pubblico
- Policy RLS configurate per permettere upload da utenti autenticati
- Variabile ambiente `VITE_N8N_PRICELIST_WEBHOOK_URL` configurata

## Note

Questa è una soluzione temporanea fino a quando il problema CORS su Railway non sarà risolto. Una volta risolto, possiamo tornare alla soluzione backend se preferisci.




