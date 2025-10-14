import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Scan, Trash2, ShoppingCart, Plus, Minus } from "lucide-react";

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
  onSaleComplete?: (sale: { itens: { codigo_barras: string; quantidade: number }[]; valorTotal: number }) => void;
  onProductNotFound?: (barcode: string) => void;
  onFetchProduct?: (barcode: string) => Promise<any>;
}

export default function PDVScanner({ onSaleComplete, onProductNotFound, onFetchProduct }: PDVScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastScanTime, setLastScanTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const valorTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

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
        playBeep(false); // Som de erro
        onProductNotFound?.(scannedBarcode);
        setBarcode("");
        return;
      }

      playBeep(true); // Som de sucesso

      const existingItem = cart.find(item => item.codigo_barras === scannedBarcode);
      
      if (existingItem) {
        if (existingItem.quantidade >= existingItem.estoque_disponivel) {
          alert(`Estoque insuficiente para ${produto.nome}!`);
          setBarcode("");
          return;
        }
        
        setCart(cart.map(item =>
          item.codigo_barras === scannedBarcode
            ? {
                ...item,
                quantidade: item.quantidade + 1,
                subtotal: (item.quantidade + 1) * item.preco
              }
            : item
        ));
      } else {
        const newItem: CartItem = {
          id: produto.id,
          nome: produto.nome,
          codigo_barras: produto.codigo_barras,
          preco: produto.preco,
          quantidade: 1,
          subtotal: produto.preco,
          estoque_disponivel: produto.quantidade
        };
        setCart([...cart, newItem]);
      }

      setBarcode("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      setBarcode("");
    }
  };

  const mockFetchProduct = async (codigo: string) => {
    const mockProducts = [
      { id: 1, nome: "Arroz 5kg", codigo_barras: "7891234567890", preco: 25.50, quantidade: 50 },
      { id: 2, nome: "Feijão 1kg", codigo_barras: "7891234567891", preco: 8.90, quantidade: 5 },
      { id: 3, nome: "Óleo de Soja 900ml", codigo_barras: "7891234567892", preco: 7.50, quantidade: 30 },
    ];
    return mockProducts.find(p => p.codigo_barras === codigo);
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

    const itens = cart.map(item => ({
      codigo_barras: item.codigo_barras,
      quantidade: item.quantidade
    }));

    onSaleComplete?.({ itens, valorTotal });
    
    setCart([]);
    setBarcode("");
    inputRef.current?.focus();
  };

  const clearCart = () => {
    setCart([]);
    setBarcode("");
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scanner de Código de Barras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escaneie o código de barras ou digite e pressione Enter"
              className="pl-10 text-lg"
              autoFocus
              data-testid="input-barcode-scanner"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Para scanner USB: Conecte o scanner, posicione o cursor neste campo e escaneie o código.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrinho ({cart.length} {cart.length === 1 ? 'item' : 'itens'})
          </CardTitle>
          {cart.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearCart} data-testid="button-clear-cart">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Carrinho vazio. Escaneie um produto para começar.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-center">Quantidade</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.codigo_barras} data-testid={`cart-item-${item.codigo_barras}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.nome}</p>
                            <p className="text-xs text-muted-foreground">{item.codigo_barras}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">R$ {item.preco.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.codigo_barras, -1)}
                              disabled={item.quantidade <= 1}
                              data-testid={`button-decrease-${item.codigo_barras}`}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center" data-testid={`quantity-${item.codigo_barras}`}>
                              {item.quantidade}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.codigo_barras, 1)}
                              disabled={item.quantidade >= item.estoque_disponivel}
                              data-testid={`button-increase-${item.codigo_barras}`}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium" data-testid={`subtotal-${item.codigo_barras}`}>
                          R$ {item.subtotal.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => removeItem(item.codigo_barras)}
                            data-testid={`button-remove-${item.codigo_barras}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold" data-testid="text-total">
                    R$ {valorTotal.toFixed(2)}
                  </span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCompleteSale}
                  data-testid="button-complete-sale"
                >
                  Finalizar Venda
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
