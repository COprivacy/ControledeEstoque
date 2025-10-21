
export interface AppSettings {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  storeName: string;
  fontSize: string;
  borderRadius: string;
  language: string;
  currency: string;
  dateFormat: string;
  enableAnimations: boolean;
  enableSounds: boolean;
  compactMode: boolean;
  showWelcomeMessage: boolean;
  autoSaveInterval: number;
  lowStockThreshold: number;
  itemsPerPage: number;
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  emailForAlerts: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  logoUrl: "",
  primaryColor: "#3B82F6",
  secondaryColor: "#10B981",
  accentColor: "#F59E0B",
  backgroundColor: "#000000",
  storeName: "Controle de Estoque",
  fontSize: "medium",
  borderRadius: "medium",
  language: "pt-BR",
  currency: "BRL",
  dateFormat: "DD/MM/YYYY",
  enableAnimations: true,
  enableSounds: false,
  compactMode: false,
  showWelcomeMessage: true,
  autoSaveInterval: 30,
  lowStockThreshold: 10,
  itemsPerPage: 10,
  enableNotifications: true,
  enableEmailAlerts: false,
  emailForAlerts: "",
};

export class SettingsManager {
  private static instance: SettingsManager;
  private settings: AppSettings;

  private constructor() {
    this.settings = this.loadSettings();
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  private loadSettings(): AppSettings {
    try {
      const saved = localStorage.getItem("customization");
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
    return DEFAULT_SETTINGS;
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  updateSettings(updates: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...updates };
    localStorage.setItem("customization", JSON.stringify(this.settings));
  }

  resetSettings(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    localStorage.removeItem("customization");
  }

  // Métodos utilitários
  formatCurrency(value: number): string {
    const currency = this.settings.currency;
    const locale = this.settings.language;
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(value);
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const format = this.settings.dateFormat;
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  }

  isLowStock(quantity: number): boolean {
    return quantity <= this.settings.lowStockThreshold;
  }
}

export const settingsManager = SettingsManager.getInstance();
