# 🔐 Como Configurar Credenciais de Forma Segura

## ✅ O que foi alterado?

Todas as senhas e credenciais foram **removidas do código** para melhorar a segurança!

Agora o sistema usa **Variáveis de Ambiente** e **Replit Secrets** para armazenar informações sensíveis.

---

## 🔑 Credenciais Necessárias

O sistema precisa das seguintes variáveis de ambiente configuradas:

### 1. **Usuário Master (Admin Principal)**
- `MASTER_USER_EMAIL` - Email do administrador principal
- `MASTER_USER_PASSWORD` - Senha de login do administrador

### 2. **Senhas Administrativas**
- `MASTER_ADMIN_PASSWORD` - Senha para acessar `/admin-master`
- `PUBLIC_ADMIN_PASSWORD` - Senha para acessar painel público (se usado)

### 3. **Email SMTP (Opcional)**
- `SMTP_HOST` - Servidor SMTP (ex: smtp.gmail.com)
- `SMTP_PORT` - Porta SMTP (ex: 587)
- `SMTP_USER` - Email para envio
- `SMTP_PASSWORD` - Senha do email ou senha de app
- `SMTP_FROM` - Email remetente

---

## 📝 Como Configurar no Replit

### Método 1: Usando Replit Secrets (Recomendado)

1. Clique no ícone de **🔒 Secrets** na barra lateral do Replit
2. Clique em **"Add new secret"**
3. Para cada variável, adicione:
   - **Key**: Nome da variável (ex: `MASTER_USER_EMAIL`)
   - **Value**: Valor da variável (ex: `seu.email@exemplo.com`)

**Secrets a adicionar:**
```
MASTER_USER_EMAIL = pavisoft.suporte@gmail.com
MASTER_USER_PASSWORD = [SUA_SENHA_SEGURA]
MASTER_ADMIN_PASSWORD = [SENHA_ADMIN_MASTER]
PUBLIC_ADMIN_PASSWORD = [SENHA_PUBLIC_ADMIN]
```

### Método 2: Arquivo .env Local (Apenas Desenvolvimento)

Se estiver rodando localmente (não no Replit):

1. Crie um arquivo `.env` na raiz do projeto
2. Copie o conteúdo de `.env.example`
3. Preencha com suas credenciais
4. **NUNCA faça commit do arquivo `.env`** (já está no .gitignore)

---

## 🔒 Senhas Antigas (Para Referência)

**IMPORTANTE:** Estas senhas estavam expostas no código e devem ser trocadas!

| Variável | Senha Antiga | Status |
|----------|--------------|--------|
| MASTER_USER_PASSWORD | `Pavisoft@140319` | ⚠️ Trocar |
| MASTER_ADMIN_PASSWORD | `PAVISOFT.SISTEMASLTDA` | ⚠️ Trocar |
| PUBLIC_ADMIN_PASSWORD | `Pavisoft@2025#Admin` | ⚠️ Trocar |

### Como trocar as senhas:

1. Configure as variáveis de ambiente com **novas senhas fortes**
2. Delete as configurações antigas do banco:
   ```sql
   DELETE FROM system_config WHERE chave IN ('master_password', 'public_admin_password');
   ```
3. Reinicie o servidor - ele criará novos hashes com as senhas novas

---

## 🚀 Como o Sistema Funciona Agora

### Primeira Execução:
1. Sistema lê `MASTER_USER_EMAIL` e `MASTER_USER_PASSWORD` das variáveis de ambiente
2. Cria o usuário master no banco de dados (se não existir)
3. Hasheia as senhas administrativas e salva no banco

### Execuções Seguintes:
1. Sistema verifica se o usuário master existe
2. Usa senhas hasheadas do banco de dados
3. Não usa mais as variáveis de ambiente para autenticação

### Vantagens:
✅ Senhas **nunca** expostas no código
✅ Senhas hasheadas no banco de dados
✅ Fácil trocar senhas (apenas atualizar secrets)
✅ Seguro para versionamento (Git)

---

## 🛡️ Boas Práticas de Segurança

### ✅ FAZER:
- Usar senhas fortes e únicas
- Trocar senhas periodicamente
- Usar Replit Secrets em produção
- Manter `.env` fora do Git

### ❌ NÃO FAZER:
- Commitar senhas no código
- Compartilhar senhas em texto plano
- Usar senhas fracas
- Reutilizar senhas

---

## 📚 Exemplos de Senhas Fortes

Gere senhas fortes usando estes padrões:

```
# Exemplo 1: Frase + Números + Símbolos
MeuSistema2025!Seguro#

# Exemplo 2: Palavras + Números + Especiais
Pavisoft@Sistema$2025!

# Exemplo 3: Aleatória (mais segura)
X7k#mN9@pL2$qR5!
```

**Recomendação:** Use um gerenciador de senhas para gerar e armazenar!

---

## 🆘 Problemas Comuns

### Erro: "Configuração de segurança incompleta"
**Causa:** Variável de ambiente não configurada
**Solução:** Adicione a variável nos Secrets do Replit

### Erro: "Senha incorreta"
**Causa:** Senha foi trocada mas hash antigo ainda está no banco
**Solução:** Delete o hash antigo do banco e reinicie o servidor

### Erro ao criar usuário master
**Causa:** Variável `MASTER_USER_PASSWORD` não configurada
**Solução:** Adicione nos Secrets do Replit

---

## 📞 Suporte

Se tiver dúvidas, consulte:
- Documentação do Replit Secrets
- Arquivo `.env.example` para ver todas as variáveis
- `RELATORIO_CREDENCIAIS_EXPOSTAS.md` para análise de segurança
