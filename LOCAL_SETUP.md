
# Configuração Local (Windows)

## Instalação

```bash
npm install
```

## Desenvolvimento (Windows)

```bash
npm run dev:win
```

## Build para Produção

```bash
npm run build
```

## Executar Produção (Windows)

```bash
npm run start:win
```

## Portas

- Desenvolvimento: http://localhost:5000
- A aplicação usa a porta 5000 por padrão

## Observações

- O projeto usa TypeScript com tsx para desenvolvimento
- Para Windows, use os scripts com sufixo `:win` que configuram variáveis de ambiente corretamente
- O build gera arquivos em `/dist` (cliente em `/dist/public`, servidor em `/dist`)
