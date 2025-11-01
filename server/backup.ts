
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger } from './logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class BackupManager {
  private backupDir: string;
  private dbPath: string;
  private maxBackups: number;
  private backupInterval: number; // em milissegundos

  constructor(
    dbPath: string = path.join(__dirname, 'database.db'),
    maxBackups: number = 7,
    backupIntervalHours: number = 24
  ) {
    this.dbPath = dbPath;
    this.maxBackups = maxBackups;
    this.backupInterval = backupIntervalHours * 60 * 60 * 1000;
    this.backupDir = path.join(__dirname, 'backups');
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      logger.info('Diretório de backups criado', 'BACKUP', { dir: this.backupDir });
    }
  }

  private getBackupFileName(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(this.backupDir, `database-backup-${timestamp}.db`);
  }

  async createBackup(): Promise<string> {
    try {
      if (!fs.existsSync(this.dbPath)) {
        throw new Error('Arquivo de banco de dados não encontrado');
      }

      const backupPath = this.getBackupFileName();
      
      // Copia o arquivo do banco de dados
      fs.copyFileSync(this.dbPath, backupPath);

      const stats = fs.statSync(backupPath);
      logger.info('Backup criado com sucesso', 'BACKUP', {
        path: backupPath,
        size: stats.size
      });

      // Limpar backups antigos
      await this.cleanOldBackups();

      return backupPath;
    } catch (error) {
      logger.error('Erro ao criar backup', 'BACKUP', { error });
      throw error;
    }
  }

  async cleanOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('database-backup-') && file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          time: fs.statSync(path.join(this.backupDir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      // Manter apenas os últimos N backups
      if (files.length > this.maxBackups) {
        const filesToDelete = files.slice(this.maxBackups);
        
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
          logger.info('Backup antigo removido', 'BACKUP', { file: file.name });
        }
      }
    } catch (error) {
      logger.error('Erro ao limpar backups antigos', 'BACKUP', { error });
    }
  }

  async listBackups(): Promise<Array<{ name: string; size: number; date: Date }>> {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('database-backup-') && file.endsWith('.db'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            date: stats.mtime
          };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      return files;
    } catch (error) {
      logger.error('Erro ao listar backups', 'BACKUP', { error });
      return [];
    }
  }

  async restoreBackup(backupFileName: string): Promise<void> {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error('Arquivo de backup não encontrado');
      }

      // Criar backup do estado atual antes de restaurar
      const emergencyBackup = this.dbPath + '.before-restore';
      fs.copyFileSync(this.dbPath, emergencyBackup);

      // Restaurar o backup
      fs.copyFileSync(backupPath, this.dbPath);

      logger.info('Backup restaurado com sucesso', 'BACKUP', {
        restored: backupFileName,
        emergencyBackup
      });
    } catch (error) {
      logger.error('Erro ao restaurar backup', 'BACKUP', { error });
      throw error;
    }
  }

  startAutoBackup() {
    // Criar backup inicial
    this.createBackup().catch(err => 
      logger.error('Erro no backup inicial', 'BACKUP', { error: err })
    );

    // Agendar backups automáticos
    setInterval(() => {
      this.createBackup().catch(err => 
        logger.error('Erro no backup automático', 'BACKUP', { error: err })
      );
    }, this.backupInterval);

    logger.info('Sistema de backup automático iniciado', 'BACKUP', {
      interval: `${this.backupInterval / (60 * 60 * 1000)}h`,
      maxBackups: this.maxBackups
    });
  }
}

export const backupManager = new BackupManager();
