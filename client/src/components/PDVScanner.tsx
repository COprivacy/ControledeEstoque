replit_final_file>
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Scan, ShoppingCart, Plus, Minus, DollarSign, Wallet, User, Check, ChevronsUpDown, Users, CreditCard, Banknote, Percent } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { Cliente } from "@shared/schema";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface CartItem {
  id: number;
  nome: string;
  codigo_barras: string;
  preco: number;
  quantidade: number;
  subtotal: number;
  estoque_disponivel: number;
}

interface PDVScannerProps {
  onSaleComplete?: (sale: { itens: { codigo_barras: string; quantidade: number }[]; valorTotal: number; cliente_id?: number; forma_pagamento?: string }) => void;
  onProductNotFound?: (barcode: string) => void;
  onFetchProduct?: (barcode: string) => Promise<any>;
}

export default function PDVScanner({ onSaleComplete, onProductNotFound, onFetchProduct }: PDVScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [valorPago, setValorPago] = useState("");
  const [clienteId, setClienteId] = useState<string>("none");
  const [openCombobox, setOpenCombobox] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [descontoPercentual, setDescontoPercentual] = useState(0); // Novo estado para o percentual de desconto
  const [formaPagamento, setFormaPagamento] = useState<string>("dinheiro"); // Novo estado para a forma de pagamento
  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const valorPagoRef = useRef<HTMLInputElement>(null);

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    if (barcode.length >= 8) {
      // Removed setTimeout for immediate scan processing for better fluidity
      handleScan(barcode);
    }

    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [barcode]);

  const subtotalSemDesconto = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const valorDesconto = subtotalSemDesconto * (descontoPercentual / 100);
  const valorTotal = subtotalSemDesconto - valorDesconto;
  const troco = parseFloat(valorPago || "0") - valorTotal;

  const mockFetchProduct = async (codigo: string) => {
    const mockProducts = [
      { id: 1, nome: "Arroz 5kg", codigo_barras: "7891234567890", preco: 25.50, quantidade: 50 },
      { id: 2, nome: "Feijão 1kg", codigo_barras: "7891234567891", preco: 8.90, quantidade: 5 },
      { id: 3, nome: "Óleo de Soja 900ml", codigo_barras: "7891234567892", preco: 7.50, quantidade: 30 },
    ];
    return mockProducts.find(p => p.codigo_barras === codigo);
  };

  const playBeep = (success: boolean = true) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = success ? 1200 : 400;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const fetchProduct = async (barcode: string) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        console.error("Usuário não autenticado");
        return null;
      }

      const user = JSON.parse(userStr);
      const headers: Record<string, string> = {
        "x-user-id": user.id,
        "x-user-type": user.tipo || "usuario",
      };

      if (user.tipo === "funcionario" && user.conta_id) {
        headers["x-conta-id"] = user.conta_id;
      }

      const response = await fetch(`/api/produtos/codigo/${barcode}`, { headers });
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      return null;
    }
  };


  const handleScan = async (scannedBarcode: string) => {
    if (!scannedBarcode.trim()) return;

    const now = Date.now();
    if (now - lastScanTime < 100) { // Basic debounce for rapid scans
      return;
    }
    setLastScanTime(now);

    try {
      const produto = onFetchProduct
        ? await onFetchProduct(scannedBarcode)
        : await fetchProduct(scannedBarcode);

      if (!produto) {
        playBeep(false);
        onProductNotFound?.(scannedBarcode);
        setBarcode("");
        return;
      }

      playBeep(true);

      const existingItemIndex = cart.findIndex(item => item.codigo_barras === scannedBarcode);

      if (existingItemIndex > -1) {
        const updatedCart = [...cart];
        const existingItem = updatedCart[existingItemIndex];
        const newQuantity = Math.min(existingItem.quantidade + 1, existingItem.estoque_disponivel);
        updatedCart[existingItemIndex] = {
          ...existingItem,
          quantidade: newQuantity,
          subtotal: newQuantity * existingItem.preco
        };
        setCart(updatedCart);
      } else {
        setCart([...cart, {
          id: produto.id,
          nome: produto.nome,
          codigo_barras: scannedBarcode,
          preco: produto.preco,
          quantidade: 1,
          subtotal: produto.preco,
          estoque_disponivel: produto.quantidade
        }]);
      }

      setBarcode("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Erro ao processar código de barras:", error);
      playBeep(false);
      setBarcode("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleScan(barcode);
    }
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    setCart(cart.map((item, i) => {
      if (i === index) {
        const quantity = Math.max(1, Math.min(newQuantity, item.estoque_disponivel));
        return {
          ...item,
          quantidade: quantity,
          subtotal: quantity * item.preco
        };
      }
      return item;
    }));
  };

  const removeItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      alert("Carrinho vazio!");
      return;
    }

    if (formaPagamento === 'dinheiro') {
      const valorPagoNum = parseFloat(valorPago || "0");
      if (valorPagoNum < valorTotal) {
        alert("Valor pago insuficiente!");
        return;
      }
    }

    const itens = cart.map(item => ({
      codigo_barras: item.codigo_barras,
      quantidade: item.quantidade
    }));

    const saleData: { itens: typeof itens; valorTotal: number; cliente_id?: number; forma_pagamento?: string } = {
      itens,
      valorTotal,
      forma_pagamento: formaPagamento // Adiciona a forma de pagamento
    };

    if (clienteId && clienteId !== "none") {
      saleData.cliente_id = parseInt(clienteId);
    }

    onSaleComplete?.(saleData);

    clearCart();
  };

  const clearCart = () => {
    setCart([]);
    setBarcode("");
    setValorPago("");
    setClienteId("none");
    setDescontoPercentual(0); // Reseta o desconto ao limpar o carrinho
    setFormaPagamento("dinheiro"); // Reseta a forma de pagamento
    setShowConfirmDialog(false);
    inputRef.current?.focus();
  };

  const handleValorPagoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const valorPagoNum = parseFloat(valorPago || "0");

      if (cart.length === 0) {
        alert("Carrinho vazio!");
        return;
      }

      if (valorPagoNum < valorTotal) {
        alert("Valor pago insuficiente!");
        return;
      }

      setShowConfirmDialog(true);
    }
  };

  // Lógica para aplicar desconto ao cliente selecionado
  useEffect(() => {
    if (clienteId !== "none") {
      const clienteSelecionado = clientes.find(c => c.id.toString() === clienteId);
      if (clienteSelecionado && clienteSelecionado.percentual_desconto) {
        setDescontoPercentual(clienteSelecionado.percentual_desconto);
      } else {
        setDescontoPercentual(0); // Reseta se o cliente não tiver desconto ou não for encontrado
      }
    } else {
      setDescontoPercentual(0); // Reseta se nenhum cliente for selecionado
    }
  }, [clienteId, clientes]);

  const totalComDesconto = valorTotal; // Renomeado para clareza no contexto de descontinuar o uso de subtotalSemDesconto diretamente

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-[calc(100vh-180px)]">
      {/* Coluna Esquerda - Carrinho */}
      <div className="space-y-3 flex flex-col overflow-hidden">
        <Card className="shadow-md flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" />
              Carrinho de Compras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-3 flex-1 overflow-auto">
            <div className="border rounded-md overflow-hidden flex-1">
              <div className="max-h-full overflow-y-auto">
                <table className="w-full text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left p-2 text-xs font-semibold">Produto</TableHead>
                      <TableHead className="text-center p-2 text-xs font-semibold">Qtd</TableHead>
                      <TableHead className="text-right p-2 text-xs font-semibold">Preço Unit.</TableHead>
                      <TableHead className="text-right p-2 text-xs font-semibold">Subtotal</TableHead>
                      <TableHead className="text-center p-2 text-xs font-semibold w-16">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center p-4 text-muted-foreground text-xs">
                          Carrinho vazio. Escaneie um produto para começar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      cart.map((item, index) => (
                        <TableRow key={index} className="border-t hover:bg-muted/30">
                          <TableCell className="p-2 text-xs">{item.nome}</TableCell>
                          <TableCell className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(index, item.quantidade - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center font-medium text-xs">{item.quantidade}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(index, item.quantidade + 1)}
                                disabled={item.quantidade >= item.estoque_disponivel}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="p-2 text-right text-xs">R$ {item.preco.toFixed(2)}</TableCell>
                          <TableCell className="p-2 text-right font-semibold text-xs">R$ {item.subtotal.toFixed(2)}</TableCell>
                          <TableCell className="p-2 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </table>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                onClick={clearCart}
                disabled={cart.length === 0}
                className="flex-1 h-8 text-xs"
                size="sm"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar
              </Button>
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={cart.length === 0}
                className="flex-1 h-8 text-xs bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                size="sm"
              >
                <Check className="h-3 w-3 mr-1" />
                Finalizar Venda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coluna Direita - Scanner e Pagamento */}
      <div className="space-y-3 flex flex-col overflow-hidden">
        {/* Seleção de Cliente */}
        <Card className="shadow-md">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              Cliente (Opcional)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between h-8 text-xs"
                  size="sm"
                >
                  {clienteId === "none"
                    ? "Sem cliente"
                    : clientes.find((cliente) => cliente.id.toString() === clienteId)?.nome || "Sem cliente"}
                  <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." className="h-8 text-xs" />
                  <CommandList>
                    <CommandEmpty className="text-xs">Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          setClienteId("none");
                          setOpenCombobox(false);
                        }}
                        className="text-xs"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3 w-3",
                            clienteId === "none" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Sem cliente
                      </CommandItem>
                      {clientes.map((cliente) => (
                        <CommandItem
                          key={cliente.id}
                          value={cliente.id.toString()}
                          onSelect={(currentValue) => {
                            setClienteId(currentValue);
                            setOpenCombobox(false);
                          }}
                          className="text-xs"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3 w-3",
                              clienteId === cliente.id.toString() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {cliente.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Scanner de Código de Barras */}
        <Card className="shadow-md">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Scan className="h-4 w-4" />
              Código de barras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-3">
            <div className="space-y-1">
              <Label htmlFor="barcode" className="text-xs">Digite ou escaneie o código</Label>
              <Input
                ref={inputRef}
                id="barcode"
                type="text"
                placeholder="Código de barras"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={handleKeyDown}
                className="font-mono h-8 text-xs"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Escaneie ou digite o código
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Pagamento */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-md flex-1">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4" />
              Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-3">
            <div className="bg-background/60 backdrop-blur-sm rounded-md p-3 border-2 border-primary/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Total da Venda
                </span>
                <span className="text-2xl font-bold text-primary">
                  R$ {totalComDesconto.toFixed(2)}
                </span>
              </div>

              {descontoPercentual > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-dashed pt-1 mt-1">
                  <span>Desconto ({descontoPercentual}%)</span>
                  <span className="font-medium text-red-600">- R$ {valorDesconto.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-xs">
                <CreditCard className="h-3 w-3" />
                Forma de Pagamento
              </Label>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant={formaPagamento === "dinheiro" ? "default" : "outline"}
                  onClick={() => setFormaPagamento("dinheiro")}
                  className={cn(
                    "h-7 text-xs",
                    formaPagamento === "dinheiro" && "bg-primary"
                  )}
                  size="sm"
                >
                  <Banknote className="h-3 w-3 mr-1" />
                  Dinheiro
                </Button>
                <Button
                  variant={formaPagamento === "cartao_credito" ? "default" : "outline"}
                  onClick={() => setFormaPagamento("cartao_credito")}
                  className={cn(
                    "h-7 text-xs",
                    formaPagamento === "cartao_credito" && "bg-primary"
                  )}
                  size="sm"
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  Crédito
                </Button>
                <Button
                  variant={formaPagamento === "cartao_debito" ? "default" : "outline"}
                  onClick={() => setFormaPagamento("cartao_debito")}
                  className={cn(
                    "h-7 text-xs",
                    formaPagamento === "cartao_debito" && "bg-primary"
                  )}
                  size="sm"
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  Débito
                </Button>
                <Button
                  variant={formaPagamento === "pix" ? "default" : "outline"}
                  onClick={() => setFormaPagamento("pix")}
                  className={cn(
                    "h-7 text-xs",
                    formaPagamento === "pix" && "bg-primary"
                  )}
                  size="sm"
                >
                  Pix
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-xs">
                <Percent className="h-3 w-3" />
                Desconto (%)
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={descontoPercentual}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setDescontoPercentual(Math.min(100, Math.max(0, value)));
                }}
                placeholder="0"
                className="h-8 text-xs"
              />
            </div>

            {formaPagamento === 'dinheiro' && (
              <div className="space-y-1">
                <Label htmlFor="valor-pago" className="flex items-center gap-1 text-xs">
                  <DollarSign className="h-3 w-3" />
                  Valor Pago
                </Label>
                <Input
                  ref={valorPagoRef}
                  id="valor-pago"
                  type="number"
                  step="0.01"
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                  onKeyDown={handleValorPagoKeyDown}
                  placeholder="0,00"
                  className="text-lg h-8 text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Pressione Enter para finalizar
                </p>
              </div>
            )}

            {formaPagamento === 'dinheiro' && valorPago && parseFloat(valorPago) >= valorTotal && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Troco:
                  </span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    R$ {troco.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <AlertDialog open={showConfirmDialog} onOpenChange={(isOpen) => {
              setShowConfirmDialog(isOpen);
              if (!isOpen && valorPagoRef.current) {
                valorPagoRef.current.focus(); // Focus on valorPago input after dialog closes
              }
            }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Finalização da Venda</AlertDialogTitle>
                  <AlertDialogDescription>
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between">
                        <span>Total da Venda:</span>
                        <span className="font-semibold">R$ {valorTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor Pago:</span>
                        <span className="font-semibold">R$ {parseFloat(valorPago || "0").toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Troco:</span>
                        <span className="font-bold">R$ {troco.toFixed(2)}</span>
                      </div>
                      {clienteId !== "none" && (
                        <div className="flex justify-between mt-4 pt-2 border-t">
                          <span>Cliente:</span>
                          <span className="font-semibold">
                            {clientes.find((c) => c.id.toString() === clienteId)?.nome || ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => valorPagoRef.current?.focus()}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleCompleteSale}>
                    Confirmar Venda
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
</replit_final_file>