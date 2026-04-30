# Configuração de Deploy - Plataforma Senra

## Informações de Servidor (VPS Hostinger)

- **IP:** 187.77.51.81
- **Usuário:** root
- **Diretório:** /var/www/plataforma-senra

## Comando para Atualizar VPS

```bash
ssh root@187.77.51.81 "cd /var/www/plataforma-senra && git pull && npm run build && pm2 reload plataforma-senra"
```

## Fluxo de Deploy

1. **Editar localmente** - Faça as alterações no código
2. **Testar localmente** - Execute `npm run dev` para testar
3. **Enviar para GitHub:**
   ```
   git add .
   git commit -m "Descrição das alterações"
   git push
   ```
4. **Atualizar VPS** - Execute o comando SSH acima

## PM2 Commands Úteis

```bash
# Ver status dos apps
pm2 status

# Ver logs
pm2 logs plataforma-senra

# Reiniciar app
pm2 restart plataforma-senra

# Parar app
pm2 stop plataforma-senra
```

## URLs

- **App:** https://senraaulasonline.com.br
- **Admin:** https://senraaulasonline.com.br/dashboard