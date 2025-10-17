import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Scan, ShoppingCart, Plus, Minus, DollarSign, Wallet, User, Check, ChevronsUpDown, Users } from "lucide-react";
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
  onSaleComplete?: (sale: { itens: { codigo_barras: string; quantidade: number }[]; valorTotal: number; cliente_id?: number }) => void;
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
      scanTimeoutRef.current = setTimeout(() => {
        handleScan(barcode);
      }, 100);
    }

    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [barcode]);

  const valorTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
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

  const handleScan = async (scannedBarcode: string) => {
    if (!scannedBarcode.trim()) return;

    const now = Date.now();
    if (now - lastScanTime < 100) {
      return;
    }
    setLastScanTime(now);

    try {
      const produto = onFetchProduct 
        ? await onFetchProduct(scannedBarcode)
        : await mockFetchProduct(scannedBarcode);

      if (!produto) {
        playBeep(false);
        onProductNotFound?.(scannedBarcode);
        setBarcode("");
        return;
      }

      playBeep(true);

      const existingItem = cart.find(item => item.codigo_barras === scannedBarcode);

      if (existingItem) {
        setCart(cart.map(item =>
          item.codigo_barras === scannedBarcode
            ? {
                ...item,
                quantidade: Math.min(item.quantidade + 1, item.estoque_disponivel),
                subtotal: Math.min(item.quantidade + 1, item.estoque_disponivel) * item.preco
              }
            : item
        ));
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

  const updateQuantity = (codigo_barras: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.codigo_barras === codigo_barras) {
        const newQuantity = Math.max(1, Math.min(item.quantidade + delta, item.estoque_disponivel));
        return {
          ...item,
          quantidade: newQuantity,
          subtotal: newQuantity * item.preco
        };
      }
      return item;
    }));
  };

  const removeItem = (codigo_barras: string) => {
    setCart(cart.filter(item => item.codigo_barras !== codigo_barras));
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      alert("Carrinho vazio!");
      return;
    }

    const valorPagoNum = parseFloat(valorPago || "0");
    if (valorPagoNum < valorTotal) {
      alert("Valor pago insuficiente!");
      return;
    }

    const itens = cart.map(item => ({
      codigo_barras: item.codigo_barras,
      quantidade: item.quantidade
    }));

    const saleData: { itens: typeof itens; valorTotal: number; cliente_id?: number } = { 
      itens, 
      valorTotal 
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

  return (
    <div className="space-y-6">
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carrinho de Compras */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrinho de Compras
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Escaneie produtos para começar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead className="text-right">Preço Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.codigo_barras}>
                          <TableCell className="font-medium">{item.nome}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.codigo_barras, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantidade}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.codigo_barras, 1)}
                                disabled={item.quantidade >= item.estoque_disponivel}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">R$ {item.preco.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            R$ {item.subtotal.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.codigo_barras)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Painel de Pagamento */}
        <div className="space-y-4">
          {/* Seletor de Cliente */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="cliente" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente (Opcional)
                </Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full h-11 justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {clienteId === "none"
                          ? "Sem cliente"
                          : clientes.find((c) => c.id.toString() === clienteId)?.nome || "Selecione um cliente"}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
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
                              value={cliente.nome}
                              onSelect={() => {
                                setClienteId(cliente.id.toString());
                                setOpenCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  clienteId === cliente.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{cliente.nome}</span>
                                {cliente.cpf_cnpj && (
                                  <span className="text-xs text-muted-foreground">
                                    {cliente.cpf_cnpj}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Scanner discreto */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="relative">
                <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Código de barras"
                  className="pl-10"
                  autoFocus
                  data-testid="input-barcode-scanner"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Escaneie ou digite o código
              </p>
            </CardContent>
          </Card>

          {/* Resumo e Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold text-2xl">R$ {valorTotal.toFixed(2)}</span>
                </div>
              </div>

              {cart.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="valor-pago" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
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
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Pressione Enter para finalizar
                    </p>
                  </div>

                  {valorPago && parseFloat(valorPago) >= valorTotal && (
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

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={clearCart}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleCompleteSale}
                      disabled={!valorPago || parseFloat(valorPago) < valorTotal}
                    >
                      Finalizar
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}