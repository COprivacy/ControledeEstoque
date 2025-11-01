
import { describe, it, expect } from 'vitest';

// Funções de validação para testar
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

export function validatePrice(price: number): boolean {
  return price > 0 && Number.isFinite(price);
}

export function validateQuantity(quantity: number): boolean {
  return quantity >= 0 && Number.isInteger(quantity);
}

// Testes
describe('Validadores', () => {
  describe('validateEmail', () => {
    it('deve validar emails corretos', () => {
      expect(validateEmail('teste@example.com')).toBe(true);
      expect(validateEmail('usuario.teste@empresa.com.br')).toBe(true);
    });

    it('deve rejeitar emails inválidos', () => {
      expect(validateEmail('invalido')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('teste@')).toBe(false);
      expect(validateEmail('a'.repeat(255) + '@test.com')).toBe(false);
    });
  });

  describe('validateCPF', () => {
    it('deve validar CPFs corretos', () => {
      expect(validateCPF('123.456.789-09')).toBe(true);
      expect(validateCPF('12345678909')).toBe(true);
    });

    it('deve rejeitar CPFs inválidos', () => {
      expect(validateCPF('000.000.000-00')).toBe(false);
      expect(validateCPF('111.111.111-11')).toBe(false);
      expect(validateCPF('123.456.789-00')).toBe(false);
      expect(validateCPF('12345')).toBe(false);
    });
  });

  describe('validateCNPJ', () => {
    it('deve validar CNPJs corretos', () => {
      expect(validateCNPJ('11.222.333/0001-81')).toBe(true);
      expect(validateCNPJ('11222333000181')).toBe(true);
    });

    it('deve rejeitar CNPJs inválidos', () => {
      expect(validateCNPJ('00.000.000/0000-00')).toBe(false);
      expect(validateCNPJ('11.111.111/1111-11')).toBe(false);
      expect(validateCNPJ('11.222.333/0001-00')).toBe(false);
      expect(validateCNPJ('1234567')).toBe(false);
    });
  });

  describe('validatePrice', () => {
    it('deve validar preços válidos', () => {
      expect(validatePrice(10.50)).toBe(true);
      expect(validatePrice(0.01)).toBe(true);
      expect(validatePrice(1000)).toBe(true);
    });

    it('deve rejeitar preços inválidos', () => {
      expect(validatePrice(0)).toBe(false);
      expect(validatePrice(-10)).toBe(false);
      expect(validatePrice(Infinity)).toBe(false);
      expect(validatePrice(NaN)).toBe(false);
    });
  });

  describe('validateQuantity', () => {
    it('deve validar quantidades válidas', () => {
      expect(validateQuantity(0)).toBe(true);
      expect(validateQuantity(10)).toBe(true);
      expect(validateQuantity(1000)).toBe(true);
    });

    it('deve rejeitar quantidades inválidas', () => {
      expect(validateQuantity(-1)).toBe(false);
      expect(validateQuantity(10.5)).toBe(false);
      expect(validateQuantity(NaN)).toBe(false);
    });
  });
});
