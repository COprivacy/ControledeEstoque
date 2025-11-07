# 🚨 RELATÓRIO DE CREDENCIAIS EXPOSTAS NO CÓDIGO

**Data da Análise:** 07/11/2025  
**Status:** 🔴 CRÍTICO - Credenciais expostas encontradas

---

## ⚠️ VULNERABILIDADES CRÍTICAS ENCONTRADAS

### 🔴 1. SENHAS HARDCODED NO BACKEND

#### Localização: `server/routes.ts`

**Linha 243:** Senha padrão do Painel Público Admin
```typescript
const defaultPassword = "Pavisoft@2025#Admin";
```
- **Risco:** MÉDIO (apenas usado para inicializar, depois é hasheado)
- **Tipo:** Senha administrativa
- **Uso:** Painel `/public-admin` (não está em rota ativa)

**Linha 355:** Senha do Usuário Master
```typescript
senha: "Pavisoft@140319",
```
- **Risco:** 🔴 ALTO (senha de login do usuário master)
- **Email:** pavisoft.suporte@gmail.com
- **Tipo:** Credencial de login completa
- **Uso:** Criação automática do usuário master no banco

**Linha 370:** Senha Master de Acesso Admin
```typescript
const defaultPassword = "PAVISOFT.SISTEMASLTDA";
```
- **Risco:** MÉDIO (apenas usado para inicializar, depois é hasheado)
- **Tipo:** Senha de segundo fator
- **Uso:** Acesso ao `/admin-master`

---

## 📧 2. EMAILS EXPOSTOS NO CÓDIGO

### Email Master (hardcoded em múltiplos arquivos):
- **Email:** `pavisoft.suporte@gmail.com`
- **Arquivos:**
  - `server/routes.ts` (linhas 305, 344)
  - `server/seed-database.ts` (linha 23, 29)
  - `client/src/components/AdminMasterRoute.tsx` (linha 15)
  - `client/src/components/DashboardSidebar.tsx` (linha 151)
  - E mais 5+ arquivos

### Email SMTP:
- **Email:** `pavisoft.planos@gmail.com`
- **Arquivos:**
  - `server/email-service.ts` (múltiplas linhas)
  - Usado em templates de email

### Emails de Teste:
- `carol@gmail.com` - Usuário de teste
- `loja1@gmail.com` / `loja2@gmail.com` - Dados de seed

---

## 🔑 3. RESUMO DAS CREDENCIAIS COMPROMETIDAS

| Tipo | Valor | Localização | Risco |
|------|-------|-------------|-------|
| **Email Master** | pavisoft.suporte@gmail.com | Múltiplos arquivos | 🟡 MÉDIO |
| **Senha Login Master** | Pavisoft@140319 | server/routes.ts:355 | 🔴 ALTO |
| **Senha Public Admin** | Pavisoft@2025#Admin | server/routes.ts:243 | 🟡 MÉDIO |
| **Senha Master Admin** | PAVISOFT.SISTEMASLTDA | server/routes.ts:370 | 🟡 MÉDIO |
| **Email SMTP** | pavisoft.planos@gmail.com | server/email-service.ts | 🟡 MÉDIO |

---

## 🛡️ PROTEÇÕES EXISTENTES (Mitigação)

Apesar das senhas estarem no código, existem proteções:

✅ Senhas são hasheadas com bcrypt antes de armazenar
✅ Rate limiting (3 tentativas / 15 minutos)
✅ Logging de todas as tentativas
✅ Senhas só são usadas para inicialização
✅ Após primeira execução, senhas ficam apenas no banco (hasheadas)

**PORÉM:** Qualquer pessoa com acesso ao código pode:
1. Ver o email do admin master
2. Ver a senha de login inicial
3. Ver as senhas administrativas iniciais
4. Criar ataques direcionados

---

## 🚨 IMPACTO DE SEGURANÇA

### ALTO RISCO:
🔴 **Credenciais completas do usuário master expostas**
- Email: `pavisoft.suporte@gmail.com`
- Senha: `Pavisoft@140319`
- Com estas credenciais, alguém pode:
  - Fazer login no sistema
  - Acessar dados de todos os usuários
  - Modificar configurações
  - Acessar funcionalidades administrativas

### MÉDIO RISCO:
🟡 **Senhas administrativas padrão**
- Mesmo hasheadas, alguém pode tentar usar essas senhas
- Se o banco for resetado, as senhas voltam aos valores padrão

### BAIXO RISCO:
🟢 **Emails públicos**
- Emails são informações relativamente públicas
- Usado para contato (não é segredo crítico)

---

## ✅ RECOMENDAÇÕES URGENTES

### 1. 🔴 URGENTE - Mover Credenciais para Variáveis de Ambiente

**Remover do código:**
```typescript
// ❌ NÃO FAZER ISSO:
senha: "Pavisoft@140319",
const defaultPassword = "PAVISOFT.SISTEMASLTDA";
```

**Usar variáveis de ambiente:**
```typescript
// ✅ FAZER ISSO:
senha: process.env.MASTER_USER_PASSWORD || "senha-temporaria",
const defaultPassword = process.env.MASTER_ADMIN_PASSWORD || "senha-temporaria";
```

**Criar arquivo `.env` (NÃO commitar no Git):**
```env
MASTER_USER_EMAIL=pavisoft.suporte@gmail.com
MASTER_USER_PASSWORD=Pavisoft@140319
MASTER_ADMIN_PASSWORD=PAVISOFT.SISTEMASLTDA
PUBLIC_ADMIN_PASSWORD=Pavisoft@2025#Admin
```

**Adicionar no `.gitignore`:**
```
.env
.env.local
.env.production
*.env
```

### 2. 🟡 MÉDIO - Trocar Senhas Imediatamente

Após mover para variáveis de ambiente:
1. Trocar senha do usuário master no banco de dados
2. Trocar senhas administrativas
3. Gerar senhas fortes e aleatórias

### 3. 🟢 BAIXO - Implementar Secrets do Replit

Usar o sistema de Secrets do Replit para gerenciar credenciais:
1. Adicionar secrets na interface do Replit
2. Acessar via `process.env`
3. Nunca commitar credenciais no código

### 4. 📋 DOCUMENTAÇÃO

Criar documentação de como configurar o sistema sem expor credenciais:
- Como definir variáveis de ambiente
- Como gerar senhas seguras
- Como rotar credenciais periodicamente

---

## 📊 STATUS ATUAL vs RECOMENDADO

| Item | Status Atual | Status Recomendado |
|------|-------------|-------------------|
| Senhas no código | ❌ Sim | ✅ Não - Usar .env |
| Emails hardcoded | ⚠️ Sim | ⚠️ Aceitável (não é segredo) |
| Rate limiting | ✅ Implementado | ✅ Manter |
| Bcrypt hashing | ✅ Implementado | ✅ Manter |
| Logging | ✅ Implementado | ✅ Manter |
| 2FA | ❌ Não | 🔄 Considerar |

---

## 🎯 PLANO DE AÇÃO IMEDIATO

### Fase 1 - Urgente (Hoje)
1. ✅ Criar variáveis de ambiente
2. ✅ Mover senhas para .env
3. ✅ Adicionar .env no .gitignore
4. ✅ Trocar senhas do usuário master

### Fase 2 - Importante (Esta semana)
5. 🔄 Configurar Secrets do Replit
6. 🔄 Documentar processo de setup
7. 🔄 Revisar todos os arquivos para outras credenciais

### Fase 3 - Melhorias (Próximas semanas)
8. 📋 Implementar rotação de senhas
9. 📋 Adicionar autenticação de dois fatores
10. 📋 Auditoria de segurança completa

---

## ⚠️ CONCLUSÃO

**RISCO ATUAL:** 🔴 ALTO

Foram encontradas credenciais completas do usuário master (email + senha) expostas no código fonte. Qualquer pessoa com acesso ao repositório pode:

1. Fazer login como administrador master
2. Acessar todos os dados do sistema
3. Modificar configurações críticas
4. Criar/deletar usuários

**AÇÃO NECESSÁRIA:** Implementar variáveis de ambiente URGENTEMENTE e trocar todas as senhas expostas.

---

**Preparado por:** Replit Agent Security Scan  
**Data:** 07/11/2025  
**Próxima revisão:** Após implementação das correções
