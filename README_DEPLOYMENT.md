
# 🚀 Guia de Deployment no Replit

Este projeto está configurado para deployment automático no **Replit Autoscale**, que oferece:

- ✅ Scaling automático baseado em demanda
- ✅ SSL/HTTPS automático
- ✅ Deploy com um clique
- ✅ Monitoramento integrado
- ✅ Rollback fácil

## 📋 Pré-requisitos

1. Conta Replit ativa
2. Projeto já rodando no Replit Workspace

## 🔧 Configuração Inicial

### 1. Verificar Variáveis de Ambiente

No Replit, vá em **Secrets** (ícone de cadeado) e configure:

```env
DATABASE_URL=sua_connection_string_postgresql
NODE_ENV=production
```

### 2. Verificar Configuração de Build

O arquivo `.replit` já está configurado com:

```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]
```

## 🚀 Como Fazer Deploy

### Método 1: Deploy Direto (Recomendado)

1. Clique no botão **"Deploy"** no topo do Replit
2. Escolha **"Autoscale Deployment"**
3. Configure:
   - **Machine**: 1 vCPU, 2 GiB RAM (padrão)
   - **Max Machines**: 3 (padrão)
   - **Domain**: escolha seu domínio `.replit.app`
4. Clique em **"Deploy"**

### Método 2: Deploy via Terminal

```bash
# Fazer build
npm run build

# O deploy será automático ao fazer push
```

## 📊 Monitoramento

Após o deploy, você pode:

1. **Ver logs em tempo real** na aba Deployments
2. **Monitorar métricas** de CPU, memória e requests
3. **Configurar alertas** para erros críticos

## 🔄 Atualizações

Para atualizar seu deployment:

1. Faça suas alterações no código
2. Teste localmente com `npm run dev`
3. Na aba **Deployments**, clique em **"Redeploy"**

## 🌐 URL de Produção

Após o deploy, seu app estará disponível em:

```
https://seu-app.replit.app
```

## ⚙️ Configurações Avançadas

### Escalonamento Automático

O Replit Autoscale ajusta automaticamente os recursos baseado em:
- Número de requests
- Uso de CPU
- Uso de memória

### Health Checks

O sistema verifica automaticamente se sua aplicação está respondendo na porta configurada (5000).

### Logs

Acesse logs completos em:
- **Deployments** > **Logs** no Replit

## 🐛 Troubleshooting

### App não inicia

1. Verifique se `DATABASE_URL` está configurado nos Secrets
2. Confira os logs de deployment
3. Teste localmente primeiro com `npm run dev`

### Timeout ao fazer deploy

1. Certifique-se que o build completa em menos de 10 minutos
2. Verifique se todas as dependências estão no `package.json`

### Erro de conexão com banco de dados

1. Confirme que `DATABASE_URL` está correto
2. Verifique se o banco permite conexões externas
3. Use PostgreSQL (recomendado: Neon, Supabase)

## 📚 Recursos Adicionais

- [Documentação Replit Deployments](https://docs.replit.com/hosting/deployments/about-deployments)
- [Autoscale Deployments](https://docs.replit.com/hosting/deployments/autoscale-deployments)

## 💡 Dicas

1. **Use sempre HTTPS** em produção (automático no Replit)
2. **Configure backups** do banco de dados regularmente
3. **Monitore os logs** para identificar problemas rapidamente
4. **Teste localmente** antes de fazer deploy

## 🇧🇷 Região

O Replit usa infraestrutura global com CDN automático, garantindo baixa latência para usuários brasileiros.

---

**Pronto para deploy?** Clique no botão Deploy no topo do Replit! 🚀
