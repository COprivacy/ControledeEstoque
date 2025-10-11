import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
}

interface SalesFormProps {
  products?: Product[];
  onSubmit?: (sale: { produtoId: number; quantidade: number; valorTotal: number }) => void;
  onCancel?: () => void;
}

export default function SalesForm({ 
  products = [],
  onSubmit, 
  onCancel 
}: SalesFormProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantidade, setQuantidade] = useState("");

  const selectedProduct = products.find(p => p.id.toString() === selectedProductId);
  const valorTotal = selectedProduct ? selectedProduct.preco * parseInt(quantidade || "0") : 0;
  const hasInsufficientStock = selectedProduct && parseInt(quantidade || "0") > selectedProduct.quantidade;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasInsufficientStock) {
      alert("Estoque insuficiente para esta venda!");
      return;
    }
    const sale = {
      produtoId: parseInt(selectedProductId),
      quantidade: parseInt(quantidade),
      valorTotal,
    };
    onSubmit?.(sale);
    console.log("Venda registrada:", sale);
    setSelectedProductId("");
    setQuantidade("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Venda</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="produto">Produto</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger id="produto" data-testid="select-product">
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem 
                    key={product.id} 
                    value={product.id.toString()}
                    data-testid={`option-product-${product.id}`}
                  >
                    {product.nome} - R$ {product.preco.toFixed(2)} (Estoque: {product.quantidade})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="0"
              required
              data-testid="input-sale-quantity"
            />
            {hasInsufficientStock && (
              <p className="text-sm text-destructive" data-testid="text-insufficient-stock">
                Estoque insuficiente! Disponível: {selectedProduct.quantidade}
              </p>
            )}
          </div>
          
          {selectedProduct && quantidade && (
            <div className="p-4 bg-accent rounded-md">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-total-value">
                R$ {valorTotal.toFixed(2)}
              </p>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={hasInsufficientStock || !selectedProductId || !quantidade}
              data-testid="button-save-sale"
            >
              Registrar Venda
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
