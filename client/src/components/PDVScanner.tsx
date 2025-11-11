
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Scan, ShoppingCart, Plus, Minus, DollarSign, User, Check, ChevronsUpDown, CreditCard, Banknote, Percent } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { Cliente } from "@shared/schema";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [valorPago, setValorPago] = useState("");
  const [clienteId, setClienteId] = useState<string>("none");
  const [openCombobox, setOpenCombobox] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [descontoPercentual, setDescontoPercentual] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState<string>("dinheiro");
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const valorPagoRef = useRef<HTMLInputElement>(null);

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (barcode.length >= 8) {
      handleScan(barcode);
    }
  }, [barcode]);

  const subtotalSemDesconto = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const valorDesconto = subtotalSemDesconto * (descontoPercentual / 100);
  const valorTotal = subtotalSemDesconto - valorDesconto;
  const troco = parseFloat(valorPago || "0") - valorTotal;

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
      if (!userStr) return null;

      const user = JSON.parse(userStr);
      const headers: Record<string, string> = {
        "x-user-id": user.id,
        "x-user-type": user.tipo || "usuario",
      };

      if (user.tipo === "funcionario" && user.conta_id) {
        headers["x-conta-id"] = user.conta_id;
      }

      const response = await fetch(`/api/produtos/codigo/${barcode}`, { headers });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      return null;
    }
  };

  const handleScan = async (scannedBarcode: string) => {
    if (!scannedBarcode.trim() || isProcessing) return;

    const now = Date.now();
    if (now - lastScanTime < 100) return;
    
    setLastScanTime(now);
    setIsProcessing(true);

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
        
        if (newQuantity === existingItem.quantidade) {
          toast({
            title: "⚠️ Estoque insuficiente",
            description: "Quantidade máxima atingida",
            variant: "destructive",
          });
        }
        
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
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (error) {
      console.error("Erro ao processar código de barras:", error);
      playBeep(false);
      setBarcode("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isProcessing) {
      e.preventDefault();
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
      toast({
        title: "⚠️ Carrinho vazio",
        description: "Adicione produtos antes de finalizar",
        variant: "destructive",
      });
      return;
    }

    if (formaPagamento === 'dinheiro') {
      const valorPagoNum = parseFloat(valorPago || "0");
      if (valorPagoNum < valorTotal) {
        toast({
          title: "⚠️ Valor insuficiente",
          description: "O valor pago é menor que o total",
          variant: "destructive",
        });
        return;
      }
    }

    setShowConfirmDialog(true);
  };

  const confirmSale = () => {
    if (isProcessing) return;
    
    setIsProcessing(true);

    const itens = cart.map(item => ({
      codigo_barras: item.codigo_barras,
      quantidade: item.quantidade
    }));

    const saleData: { itens: typeof itens; valorTotal: number; cliente_id?: number; forma_pagamento?: string } = {
      itens,
      valorTotal,
      forma_pagamento: formaPagamento
    };

    if (clienteId && clienteId !== "none") {
      saleData.cliente_id = parseInt(clienteId);
    }

    onSaleComplete?.(saleData);
    clearCart();
    setIsProcessing(false);
  };

  const clearCart = () => {
    setCart([]);
    setBarcode("");
    setValorPago("");
    setClienteId("none");
    setDescontoPercentual(0);
    setFormaPagamento("dinheiro");
    setShowConfirmDialog(false);
    setIsProcessing(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleValorPagoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isProcessing) {
      e.preventDefault();
      handleCompleteSale();
    }
  };

  useEffect(() => {
    if (clienteId !== "none") {
      const clienteSelecionado = clientes.find(c => c.id.toString() === clienteId);
      if (clienteSelecionado && clienteSelecionado.percentual_desconto) {
        setDescontoPercentual(clienteSelecionado.percentual_desconto);
      } else {
        setDescontoPercentual(0);
      }
    } else {
      setDescontoPercentual(0);
    }
  }, [clienteId, clientes]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-3 h-full overflow-hidden">
      {/* Coluna Esquerda - Carrinho */}
      <div className="flex flex-col gap-3 h-full min-h-0">
        <Card className="flex-1 flex flex-col shadow-lg min-h-0 overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" />
              Carrinho de Compras
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-2 overflow-hidden px-4 pb-3">
            <div className="flex-1 border rounded-lg overflow-hidden min-h-0">
              <div className="h-full overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted z-10">
                    <TableRow>
                      <TableHead className="w-[40%] py-2 text-xs">Produto</TableHead>
                      <TableHead className="text-center w-[25%] py-2 text-xs">Qtd</TableHead>
                      <TableHead className="text-right w-[20%] py-2 text-xs">Preço</TableHead>
                      <TableHead className="text-right w-[15%] py-2 text-xs">Total</TableHead>
                      <TableHead className="text-center w-12 py-2 text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <ShoppingCart className="h-10 w-10 opacity-20" />
                            <p className="text-sm">Carrinho vazio</p>
                            <p className="text-xs">Escaneie um produto para começar</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      cart.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-sm py-2">{item.nome}</TableCell>
                          <TableCell className="text-center py-2">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(index, item.quantidade - 1)}
                                disabled={isProcessing}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-semibold text-sm">{item.quantidade}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(index, item.quantidade + 1)}
                                disabled={item.quantidade >= item.estoque_disponivel || isProcessing}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm py-2">R$ {item.preco.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-semibold text-sm py-2">R$ {item.subtotal.toFixed(2)}</TableCell>
                          <TableCell className="text-center py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeItem(index)}
                              disabled={isProcessing}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearCart}
                disabled={cart.length === 0 || isProcessing}
                className="flex-1 h-8 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar
              </Button>
              <Button
                onClick={handleCompleteSale}
                disabled={cart.length === 0 || isProcessing}
                className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
              >
                <Check className="h-3 w-3 mr-1" />
                Finalizar Venda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coluna Direita - Cliente, Scanner e Pagamento */}
      <div className="flex flex-col gap-3 h-full min-h-0 overflow-hidden">
        {/* Cliente */}
        <Card className="shadow-lg">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-3 w-3" />
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
                  disabled={isProcessing}
                >
                  {clienteId === "none"
                    ? "Sem cliente"
                    : clientes.find((cliente) => cliente.id.toString() === clienteId)?.nome || "Sem cliente"}
                  <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          setClienteId("none");
                          setOpenCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
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
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
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

        {/* Scanner */}
        <Card className="shadow-lg">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Scan className="h-3 w-3" />
              Código de Barras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-3">
            <Label htmlFor="barcode" className="text-xs">Digite ou escaneie o código</Label>
            <Input
              ref={inputRef}
              id="barcode"
              type="text"
              placeholder="Código de barras"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleKeyDown}
              className="font-mono text-sm h-8"
              autoComplete="off"
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Pressione Enter após digitar o código
            </p>
          </CardContent>
        </Card>

        {/* Pagamento */}
        <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CreditCard className="h-3 w-3" />
              Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-3">
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border-2 border-primary/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Total da Venda
                </span>
                <span className="text-2xl font-bold text-primary">
                  R$ {valorTotal.toFixed(2)}
                </span>
              </div>

              {descontoPercentual > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-dashed pt-1">
                  <span>Desconto ({descontoPercentual}%)</span>
                  <span className="font-medium text-red-600">- R$ {valorDesconto.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-xs">
                <CreditCard className="h-3 w-3" />
                Forma de Pagamento
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant={formaPagamento === "dinheiro" ? "default" : "outline"}
                  onClick={() => setFormaPagamento("dinheiro")}
                  className={cn("h-7 text-xs", formaPagamento === "dinheiro" && "bg-primary")}
                  disabled={isProcessing}
                >
                  <Banknote className="h-3 w-3 mr-1" />
                  Dinheiro
                </Button>
                <Button
                  variant={formaPagamento === "cartao_credito" ? "default" : "outline"}
                  onClick={() => setFormaPagamento("cartao_credito")}
                  className={cn("h-7 text-xs", formaPagamento === "cartao_credito" && "bg-primary")}
                  disabled={isProcessing}
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  Crédito
                </Button>
                <Button
                  variant={formaPagamento === "cartao_debito" ? "default" : "outline"}
                  onClick={() => setFormaPagamento("cartao_debito")}
                  className={cn("h-7 text-xs", formaPagamento === "cartao_debito" && "bg-primary")}
                  disabled={isProcessing}
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  Débito
                </Button>
                <Button
                  variant={formaPagamento === "pix" ? "default" : "outline"}
                  onClick={() => setFormaPagamento("pix")}
                  className={cn("h-7 text-xs", formaPagamento === "pix" && "bg-primary")}
                  disabled={isProcessing}
                >
                  Pix
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
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
                disabled={isProcessing}
                className="h-8 text-sm"
              />
            </div>

            {formaPagamento === 'dinheiro' && (
              <>
                <div className="space-y-1.5">
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
                    className="text-sm h-8"
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Pressione Enter para finalizar
                  </p>
                </div>

                {valorPago && parseFloat(valorPago) >= valorTotal && (
                  <div className="p-2.5 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-200 dark:border-green-800">
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Venda</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3 mt-4">
                <div className="flex justify-between text-base">
                  <span>Total:</span>
                  <span className="font-bold text-primary">R$ {valorTotal.toFixed(2)}</span>
                </div>
                
                {formaPagamento === 'dinheiro' && (
                  <>
                    <div className="flex justify-between">
                      <span>Valor Pago:</span>
                      <span className="font-semibold">R$ {parseFloat(valorPago || "0").toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Troco:</span>
                      <span className="font-bold">R$ {troco.toFixed(2)}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between border-t pt-2">
                  <span>Forma de Pagamento:</span>
                  <span className="font-semibold capitalize">
                    {formaPagamento.replace('_', ' ')}
                  </span>
                </div>

                {clienteId !== "none" && (
                  <div className="flex justify-between">
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
            <AlertDialogCancel disabled={isProcessing}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmSale} disabled={isProcessing}>
              {isProcessing ? "Processando..." : "Confirmar Venda"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
