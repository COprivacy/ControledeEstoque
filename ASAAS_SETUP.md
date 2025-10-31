
# 🔧 Configuração Completa da Integração Asaas

## 📋 Checklist de Configuração

### 1️⃣ Criar Conta no Asaas
- [ ] Acessar [https://www.asaas.com](https://www.asaas.com)
- [ ] Criar conta (use sandbox primeiro para testes)
- [ ] Validar email e configurar perfil

### 2️⃣ Obter Credenciais de API

#### Sandbox (Testes):
1. Acesse: [https://sandbox.asaas.com/myAccount/keys](https://sandbox.asaas.com/myAccount/keys)
2. Copie sua **API Key de Sandbox**

#### Produção:
1. Acesse: [https://www.asaas.com/myAccount/keys](https://www.asaas.com/myAccount/keys)
2. Copie sua **API Key de Produção**

### 3️⃣ Configurar no Pavisoft

1. Acesse o **Painel Administrativo Master**
2. Vá em **Pagamentos (Asaas)**
3. Preencha:
   - **API Key**: Cole sua chave
   - **Ambiente**: Escolha `sandbox` ou `production`
   - **ID da Conta**: Seu ID Asaas (opcional)
   - **Webhook URL**: `https://seu-dominio.repl.co/api/webhook/asaas`

4. Clique em **Testar Conexão** para validar
5. Clique em **Salvar Configuração**

### 4️⃣ Configurar Webhooks no Painel Asaas

⚠️ **IMPORTANTE**: Webhooks devem ser configurados manualmente no painel Asaas

#### Passo a passo:

1. **Acesse o painel Asaas:**
   - Sandbox: [https://sandbox.asaas.com/webhook](https://sandbox.asaas.com/webhook)
   - Produção: [https://www.asaas.com/webhook](https://www.asaas.com/webhook)

2. **Adicionar novo webhook:**
   - URL: `https://seu-dominio.repl.co/api/webhook/asaas`
   - Eventos necessários:
     - ✅ `PAYMENT_RECEIVED` (Pagamento recebido)
     - ✅ `PAYMENT_CONFIRMED` (Pagamento confirmado)
     - ✅ `PAYMENT_OVERDUE` (Pagamento vencido)

3. **Validar webhook:**
   - Asaas enviará uma requisição de teste
   - Verifique se retornou status 200 OK

### 5️⃣ Testar Integração

#### Teste 1: Criar Cliente
1. No painel admin, vá em **Usuários**
2. Clique em **Criar Cliente com Asaas**
3. Preencha os dados e salve
4. Verifique se o cliente apareceu no painel Asaas

#### Teste 2: Criar Assinatura
1. Acesse a página de checkout do Pavisoft
2. Escolha um plano (Mensal ou Anual)
3. Preencha os dados e escolha forma de pagamento:
   - **Boleto**: Gera boleto bancário
   - **PIX**: Gera QR Code PIX
   - **Cartão de Crédito**: Formulário de pagamento

#### Teste 3: Webhook
1. Faça um pagamento de teste
2. No painel Asaas, confirme o pagamento manualmente
3. Verifique se o status atualizou no Pavisoft
4. O plano do usuário deve ativar automaticamente

### 6️⃣ Sincronização Manual

Se algum pagamento não atualizar automaticamente:

1. Vá em **Dashboard** → **Usuários**
2. Clique em **Sincronizar Asaas**
3. Sistema buscará todos os pagamentos pendentes
4. Atualizará status automaticamente

## 🔐 Segurança

- ✅ Webhook valida token de autenticação
- ✅ API Key armazenada com segurança
- ✅ Validação de CPF/CNPJ nos checkouts
- ✅ Rate limiting em endpoints de pagamento

## 📊 Monitoramento

### No Painel Pavisoft:
- Status da conexão Asaas
- Última sincronização
- Total de assinaturas por status

### No Painel Asaas:
- Todas as cobranças criadas
- Pagamentos recebidos
- Webhooks enviados

## ❌ Troubleshooting

### Erro: "Sistema de pagamento não configurado"
→ Configure API Key no painel admin

### Erro: "Webhook não autorizado"
→ Verifique se a API Key está correta

### Pagamento não atualiza automaticamente
→ Clique em "Sincronizar Asaas" manualmente

### Cliente não aparece no Asaas
→ Verifique se API Key e ambiente estão corretos

## 📞 Suporte

- **Documentação Asaas**: [https://docs.asaas.com](https://docs.asaas.com)
- **Suporte Asaas**: suporte@asaas.com
- **Suporte Pavisoft**: pavisoft.suporte@gmail.com

---

**Última atualização**: Janeiro 2025
