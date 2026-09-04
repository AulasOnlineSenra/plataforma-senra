const fs = require('fs');
let c = fs.readFileSync('prisma/schema.prisma', 'utf8');
c = c.replace(
  'referralModalImages     String   @default("[]") // Lista de URLs das imagens\r\n}',
  'referralModalImages     String   @default("[]") // Lista de URLs das imagens\r\n  aiVisualPrompt          String?\r\n}'
);
if (c === fs.readFileSync('prisma/schema.prisma', 'utf8')) {
  // Try with \n
  c = c.replace(
    'referralModalImages     String   @default("[]") // Lista de URLs das imagens\n}',
    'referralModalImages     String   @default("[]") // Lista de URLs das imagens\n  aiVisualPrompt          String?\n}'
  );
}
fs.writeFileSync('prisma/schema.prisma', c);
