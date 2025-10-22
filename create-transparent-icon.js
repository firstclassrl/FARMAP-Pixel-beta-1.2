import fs from 'fs';
import { createCanvas } from 'canvas';

// Crea un canvas 512x512 con sfondo trasparente
const canvas = createCanvas(512, 512);
const ctx = canvas.getContext('2d');

// Sfondo trasparente (non disegniamo nulla, rimane trasparente)
ctx.clearRect(0, 0, 512, 512);

// Disegna la lettera "P" con stile moderno
ctx.fillStyle = '#10b981'; // Colore teal
ctx.font = 'bold 320px Arial, sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// Aggiungi ombra per profondità
ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
ctx.shadowBlur = 20;
ctx.shadowOffsetX = 8;
ctx.shadowOffsetY = 8;

// Disegna la "P"
ctx.fillText('P', 256, 256);

// Salva come PNG con trasparenza
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('public/PIXEL ICON.png', buffer);

console.log('Icona trasparente creata: public/PIXEL ICON.png');
