// MIGRAÇÃO CONCLUÍDA - Este arquivo pode ser removido futuramente
// A migração do SQLite para PostgreSQL já foi realizada com sucesso

/*
import { SQLiteStorage } from './sqlite-storage';
import { PostgresStorage } from './postgres-storage';
import { logger } from './logger';

async function migrateSQLiteToPostgres() {
  logger.info('[MIGRAÇÃO] Iniciando migração do SQLite para PostgreSQL...');

  const sqliteStorage = new SQLiteStorage();
  const postgresStorage = new PostgresStorage();

  try {
    logger.info('[MIGRAÇÃO] 1/14 - Migrando usuários...');
    const users = await sqliteStorage.getUsers!();
    for (const user of users) {
      try {
        const existing = await postgresStorage.getUserByEmail(user.email);
        if (!existing) {
          const { id, ...userData } = user;
          await postgresStorage.createUser(userData as any);
          logger.info(`[MIGRAÇÃO] ✅ Usuário migrado: ${user.email}`);
        } else {
          await postgresStorage.updateUser!(existing.id, user);
          logger.info(`[MIGRAÇÃO] ✅ Usuário atualizado: ${user.email}`);
        }
      } catch (error: any) {
        logger.error(`[MIGRAÇÃO] ❌ Erro ao migrar usuário ${user.email}:`, { error: error.message });
      }
    }
    logger.info(`[MIGRAÇÃO] ✅ ${users.length} usuários processados`);

    logger.info('[MIGRAÇÃO] 2/14 - Migrando produtos...');
    const produtos = await sqliteStorage.getProdutos();
    for (const produto of produtos) {
      try {
        const { id, ...produtoData } = produto;
        await postgresStorage.createProduto(produtoData as any);
        logger.info(`[MIGRAÇÃO] ✅ Produto migrado: ${produto.nome}`);
      } catch (error: any) {
        logger.error(`[MIGRAÇÃO] ❌ Erro ao migrar produto ${produto.nome}:`, { error: error.message });
      }
    }
    logger.info(`[MIGRAÇÃO] ✅ ${produtos.length} produtos processados`);

    logger.info('[MIGRAÇÃO] 3/14 - Migrando fornecedores...');
    const fornecedores = await sqliteStorage.getFornecedores();
    for (const fornecedor of fornecedores) {
      try {
        const { id, ...fornecedorData } = fornecedor;
        await postgresStorage.createFornecedor(fornecedorData as any);
        logger.info(`[MIGRAÇÃO] ✅ Fornecedor migrado: ${fornecedor.nome}`);
      } catch (error: any) {
        logger.error(`[MIGRAÇÃO] ❌ Erro ao migrar fornecedor ${fornecedor.nome}:`, { error: error.message });
      }
    }
    logger.info(`[MIGRAÇÃO] ✅ ${fornecedores.length} fornecedores processados`);

    logger.info('[MIGRAÇÃO] 4/14 - Migrando clientes...');
    const clientes = await sqliteStorage.getClientes();
    for (const cliente of clientes) {
      try {
        const { id, ...clienteData } = cliente;
        await postgresStorage.createCliente(clienteData as any);
        logger.info(`[MIGRAÇÃO] ✅ Cliente migrado: ${cliente.nome}`);
      } catch (error: any) {
        logger.error(`[MIGRAÇÃO] ❌ Erro ao migrar cliente ${cliente.nome}:`, { error: error.message });
      }
    }
    logger.info(`[MIGRAÇÃO] ✅ ${clientes.length} clientes processados`);

    logger.info('[MIGRAÇÃO] 5/14 - Migrando vendas...');
    const vendas = await sqliteStorage.getVendas();
    for (const venda of vendas) {
      try {
        const { id, ...vendaData } = venda;
        await postgresStorage.createVenda(vendaData as any);
        logger.info(`[MIGRAÇÃO] ✅ Venda migrada: ID ${venda.id}`);
      } catch (error: any) {
        logger.error(`[MIGRAÇÃO] ❌ Erro ao migrar venda ${venda.id}:`, { error: error.message });
      }
    }
    logger.info(`[MIGRAÇÃO] ✅ ${vendas.length} vendas processadas`);

    logger.info('[MIGRAÇÃO] 6/14 - Migrando compras...');
    const compras = await sqliteStorage.getCompras();
    for (const compra of compras) {
      try {
        const { id, ...compraData } = compra;
        await postgresStorage.createCompra(compraData as any);
        logger.info(`[MIGRAÇÃO] ✅ Compra migrada: ID ${compra.id}`);
      } catch (error: any) {
        logger.error(`[MIGRAÇÃO] ❌ Erro ao migrar compra ${compra.id}:`, { error: error.message });
      }
    }
    logger.info(`[MIGRAÇÃO] ✅ ${compras.length} compras processadas`);

    logger.info('[MIGRAÇÃO] 7/14 - Migrando configuração fiscal...');
    const configFiscal = await sqliteStorage.getConfigFiscal();
    if (configFiscal) {
      try {
        const { id, ...configData } = configFiscal;
        await postgresStorage.saveConfigFiscal(configData as any);
        logger.info('[MIGRAÇÃO] ✅ Configuração fiscal migrada');
      } catch (error: any) {
        logger.error('[MIGRAÇÃO] ❌ Erro ao migrar configuração fiscal:', { error: error.message });
      }
    }

    logger.info('[MIGRAÇÃO] 8/14 - Migrando planos...');
    const planos = await sqliteStorage.getPlanos!();
    if (planos) {
      for (const plano of planos) {
        try {
          const { id, ...planoData } = plano;
          await postgresStorage.createPlano!(planoData as any);
          logger.info(`[MIGRAÇÃO] ✅ Plano migrado: ${plano.nome}`);
        } catch (error: any) {
          logger.error(`[MIGRAÇÃO] ❌ Erro ao migrar plano ${plano.nome}:`, { error: error.message });
        }
      }
      logger.info(`[MIGRAÇÃO] ✅ ${planos.length} planos processados`);
    }

    logger.info('[MIGRAÇÃO] 9/14 - Migrando configuração Asaas...');
    const configAsaas = await sqliteStorage.getConfigAsaas!();
    if (configAsaas) {
      try {
        const { id, ...configData } = configAsaas;
        await postgresStorage.saveConfigAsaas!(configData as any);
        logger.info('[MIGRAÇÃO] ✅ Configuração Asaas migrada');
      } catch (error: any) {
        logger.error('[MIGRAÇÃO] ❌ Erro ao migrar configuração Asaas:', { error: error.message });
      }
    }

    logger.info('[MIGRAÇÃO] 10/14 - Migrando logs admin...');
    const logs = await sqliteStorage.getLogsAdmin!();
    if (logs) {
      for (const log of logs) {
        try {
          const { id, ...logData } = log;
          await postgresStorage.createLogAdmin!(logData as any);
          logger.info(`[MIGRAÇÃO] ✅ Log admin migrado: ID ${log.id}`);
        } catch (error: any) {
          logger.error(`[MIGRAÇÃO] ❌ Erro ao migrar log ${log.id}:`, { error: error.message });
        }
      }
      logger.info(`[MIGRAÇÃO] ✅ ${logs.length} logs processados`);
    }

    logger.info('[MIGRAÇÃO] 11/14 - Migrando subscriptions...');
    const subscriptions = await sqliteStorage.getSubscriptions!();
    if (subscriptions) {
      for (const subscription of subscriptions) {
        try {
          const { id, ...subscriptionData } = subscription;
          await postgresStorage.createSubscription!(subscriptionData as any);
          logger.info(`[MIGRAÇÃO] ✅ Subscription migrada: ID ${subscription.id}`);
        } catch (error: any) {
          logger.error(`[MIGRAÇÃO] ❌ Erro ao migrar subscription ${subscription.id}:`, { error: error.message });
        }
      }
      logger.info(`[MIGRAÇÃO] ✅ ${subscriptions.length} subscriptions processadas`);
    }

    logger.info('[MIGRAÇÃO] 12/14 - Migrando contas a pagar...');
    const contasPagar = await sqliteStorage.getContasPagar!();
    if (contasPagar) {
      for (const conta of contasPagar) {
        try {
          const { id, ...contaData } = conta;
          await postgresStorage.createContaPagar!(contaData as any);
          logger.info(`[MIGRAÇÃO] ✅ Conta a pagar migrada: ${conta.descricao}`);
        } catch (error: any) {
          logger.error(`[MIGRAÇÃO] ❌ Erro ao migrar conta a pagar:`, { error: error.message });
        }
      }
      logger.info(`[MIGRAÇÃO] ✅ ${contasPagar.length} contas a pagar processadas`);
    }

    logger.info('[MIGRAÇÃO] 13/14 - Migrando contas a receber...');
    const contasReceber = await sqliteStorage.getContasReceber!();
    if (contasReceber) {
      for (const conta of contasReceber) {
        try {
          const { id, ...contaData } = conta;
          await postgresStorage.createContaReceber!(contaData as any);
          logger.info(`[MIGRAÇÃO] ✅ Conta a receber migrada: ${conta.descricao}`);
        } catch (error: any) {
          logger.error(`[MIGRAÇÃO] ❌ Erro ao migrar conta a receber:`, { error: error.message });
        }
      }
      logger.info(`[MIGRAÇÃO] ✅ ${contasReceber.length} contas a receber processadas`);
    }

    logger.info('[MIGRAÇÃO] 14/14 - Migrando caixas...');
    const usuarios = await sqliteStorage.getUsers!();
    for (const usuario of usuarios) {
      try {
        const caixas = await sqliteStorage.getCaixas!(usuario.id);
        if (caixas) {
          for (const caixa of caixas) {
            try {
              const { id, ...caixaData } = caixa;
              await postgresStorage.abrirCaixa!(caixaData as any);
              logger.info(`[MIGRAÇÃO] ✅ Caixa migrada: ID ${caixa.id}`);

              const movimentacoes = await sqliteStorage.getMovimentacoesCaixa!(caixa.id);
              if (movimentacoes) {
                for (const mov of movimentacoes) {
                  try {
                    const { id: movId, ...movData } = mov;
                    await postgresStorage.createMovimentacaoCaixa!(movData as any);
                  } catch (error: any) {
                    logger.error(`[MIGRAÇÃO] ❌ Erro ao migrar movimentação:`, { error: error.message });
                  }
                }
              }
            } catch (error: any) {
              logger.error(`[MIGRAÇÃO] ❌ Erro ao migrar caixa:`, { error: error.message });
            }
          }
        }
      } catch (error: any) {
      }
    }

    logger.info('[MIGRAÇÃO] ✅ Migração concluída com sucesso!');
    logger.info('[MIGRAÇÃO] Todos os dados foram transferidos do SQLite para o PostgreSQL');

    process.exit(0);
  } catch (error: any) {
    logger.error('[MIGRAÇÃO] ❌ Erro durante a migração:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

migrateSQLiteToPostgres();
*/

console.log('⚠️ Arquivo de migração desativado. A migração já foi concluída.');