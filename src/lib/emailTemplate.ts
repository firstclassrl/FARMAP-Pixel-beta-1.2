/**
 * Genera template HTML email con colori FARMAP
 */
export function generateEmailHTML(
  emailBody: string,
  customerName?: string,
  priceListName?: string
): string {
  // Converti il body in HTML preservando le interruzioni di riga e gli spazi
  const lines = emailBody.split('\n');
  const formattedBody = lines
    .map((line, index) => {
      const trimmed = line.trim();
      // Se la riga è vuota, crea uno spazio
      if (trimmed === '') {
        return '<p style="margin: 0 0 12px 0;"></p>';
      }
      // Altrimenti crea un paragrafo
      return `<p style="margin: 0 0 12px 0; color: #374151; line-height: 1.7; font-size: 15px;">${trimmed}</p>`;
    })
    .join('');

  // URL base per il logo - usa URL assoluto per email
  const getLogoUrl = () => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      // Se è localhost, usa un URL di produzione come fallback
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return 'https://pixel.farmap.it/logo%20farmap%20industry.png';
      }
      return `${origin}/logo%20farmap%20industry.png`;
    }
    return 'https://pixel.farmap.it/logo%20farmap%20industry.png';
  };

  const logoUrl = getLogoUrl();

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Listino Prezzi FARMAP</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); max-width: 600px;">
          <!-- Header con logo e barra colorata -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center;">
              <img src="${logoUrl}" alt="FARMAP Industry Logo" style="max-width: 220px; height: auto; display: block; margin: 0 auto;" />
            </td>
          </tr>
          
          <!-- Contenuto principale -->
          <tr>
            <td style="padding: 50px 40px;">
              <div style="color: #374151; line-height: 1.7;">
                ${formattedBody}
              </div>
            </td>
          </tr>
          
          <!-- Separatore decorativo -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 3px; background: linear-gradient(90deg, transparent, #dc2626 50%, transparent); border-radius: 2px;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 35px 40px; background-color: #f9fafb;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      <strong style="color: #dc2626; font-size: 15px;">FARMAP INDUSTRY S.r.l.</strong><br/>
                      Via Nazionale, 66 - 65012 Cepagatti (PE)<br/>
                      P.IVA: 02244470684<br/>
                      Tel: <a href="tel:+390859774028" style="color: #dc2626; text-decoration: none;">+39 085 9774028</a>
                    </p>
                    <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                      Questa email è stata inviata automaticamente dal sistema Pixel CRM.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}





