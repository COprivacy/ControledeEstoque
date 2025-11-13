import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
// Backup local do SQLite removido - usando backups do Neon PostgreSQL
import { logger } from './logger';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';
import { autoCleanupService } from './auto-cleanup';

neonConfig.webSocketConstructor = ws;

// Função para verificar e corrigir schema automaticamente
async function autoFixDatabaseSchema() {
  if (!process.env.DATABASE_URL) {
    logger.error('[AUTO-FIX] DATABASE_URL não encontrado');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  try {
    logger.info('[AUTO-FIX] Verificando schema do banco de dados...');

    // Verificar colunas da tabela users
    const resultUsers = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);

    const existingColumnsUsers = new Set(
      resultUsers.rows.map((row: any) => row.column_name)
    );

    const requiredColumnsUsers = [
      { name: 'cpf_cnpj', type: 'TEXT', default: null },
      { name: 'telefone', type: 'TEXT', default: null },
      { name: 'endereco', type: 'TEXT', default: null },
      { name: 'asaas_customer_id', type: 'TEXT', default: null },
      { name: 'permissoes', type: 'TEXT', default: null },
      { name: 'ultimo_acesso', type: 'TEXT', default: null },
      { name: 'max_funcionarios', type: 'INTEGER', default: 1 },
      { name: 'meta_mensal', type: 'REAL', default: 15000 },
    ];

    let fixed = false;
    for (const col of requiredColumnsUsers) {
      if (!existingColumnsUsers.has(col.name)) {
        logger.info(`[AUTO-FIX] Adicionando coluna ${col.name} em users...`);

        let alterQuery = `ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`;
        if (col.default !== null) {
          alterQuery += ` DEFAULT ${typeof col.default === 'string' ? `'${col.default}'` : col.default}`;
        }

        await db.execute(sql.raw(alterQuery));
        fixed = true;
      }
    }

    // Verificar colunas da tabela vendas
    const resultVendas = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vendas'
    `);

    const existingColumnsVendas = new Set(
      resultVendas.rows.map((row: any) => row.column_name)
    );

    const requiredColumnsVendas = [
      { name: 'orcamento_id', type: 'INTEGER', default: null },
      { name: 'vendedor', type: 'TEXT', default: null },
    ];

    for (const col of requiredColumnsVendas) {
      if (!existingColumnsVendas.has(col.name)) {
        logger.info(`[AUTO-FIX] Adicionando coluna ${col.name} em vendas...`);

        let alterQuery = `ALTER TABLE vendas ADD COLUMN ${col.name} ${col.type}`;
        if (col.default !== null) {
          alterQuery += ` DEFAULT ${typeof col.default === 'string' ? `'${col.default}'` : col.default}`;
        }

        await db.execute(sql.raw(alterQuery));
        fixed = true;
      }
    }

    // Criar índice se não existir
    if (!existingColumnsVendas.has('orcamento_id')) {
      logger.info('[AUTO-FIX] Criando índice idx_vendas_orcamento_id...');
      await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS idx_vendas_orcamento_id ON vendas(orcamento_id)'));
      fixed = true;
    }

    if (fixed) {
      logger.info('[AUTO-FIX] ✅ Schema corrigido automaticamente!');
    } else {
      logger.info('[AUTO-FIX] ✅ Schema já está correto');
    }

  } catch (error: any) {
    logger.error('[AUTO-FIX] Erro ao verificar schema:', { error: error.message });
  } finally {
    await pool.end();
  }
}

const app = express();

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6
}));

// Configurar trust proxy para funcionar corretamente no Replit (que usa proxy reverso)
app.set('trust proxy', 1);

// Segurança: Helmet para headers HTTP seguros
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-eval necessário para Vite dev
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting para prevenir ataques de força bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: "Muitas requisições deste IP, tente novamente mais tarde.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Apenas 5 tentativas de login a cada 15 minutos
  message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  skipSuccessfulRequests: true,
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Verificar e corrigir schema automaticamente antes de iniciar
  await autoFixDatabaseSchema();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = '0.0.0.0';

  // reusePort is not supported on Windows
  const isWindows = process.platform === 'win32';
  const listenOptions: any = {
    port,
    host,
  };

  if (!isWindows) {
    listenOptions.reusePort = true;
  }

  server.listen(listenOptions, () => {
    log(`🚀 Servidor rodando em http://${host}:${port}`);
    log(`📍 Ambiente: ${app.get("env")}`);
  });

  // Sistema de backup automático desativado - usando backups do Neon PostgreSQL
  // backupManager.startAutoBackup();
  logger.info('[BACKUP] Sistema de backup local desativado. Usando backups do Neon PostgreSQL.');

  // Sistema de lembretes de pagamento
  const { paymentReminderService } = await import('./payment-reminder');
  paymentReminderService.startAutoCheck();

  // Sistema de Auto-Healing (verificações a cada 5 minutos)
  const { autoHealingService } = await import('./auto-healing');
  autoHealingService.startHealthChecks();

  // Iniciar limpeza automática agendada
  if (process.env.NODE_ENV === 'production') {
    autoCleanupService.startScheduledCleanup();
    logger.info('Serviço de limpeza automática iniciado', 'STARTUP');
  }

  logger.info('Servidor iniciado', 'STARTUP', { port, env: app.get("env") });

  // Limpar logs antigos a cada 24h
  setInterval(() => {
    logger.cleanOldLogs(30).catch(err =>
      logger.error('Erro ao limpar logs antigos', 'CLEANUP', { error: err })
    );
  }, 24 * 60 * 60 * 1000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    log('Shutting down gracefully...');
    logger.info('Servidor encerrando', 'SHUTDOWN');

    if ('storage' in global && typeof storage.close === 'function') {
      storage.close();
    }
    process.exit(0);
  });
})();