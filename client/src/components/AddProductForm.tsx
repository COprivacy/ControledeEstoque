import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AddProductFormProps {
  initialData?: any;
  onSubmit?: (product: {
    nome: string;
    categoria: string;
    preco: number;
    quantidade: number;
    estoque_minimo: number;
    codigo_barras?: string;
    vencimento?: string;
  }) => void;
  onCancel?: () => void;
}

export default function AddProductForm({ initialData, onSubmit, onCancel }: AddProductFormProps) {
  const [nome, setNome] = useState(initialData?.nome || "");
  const [categoria, setCategoria] = useState(initialData?.categoria || "");
  const [preco, setPreco] = useState(initialData?.preco?.toString() || "");
  const [quantidade, setQuantidade] = useState(initialData?.quantidade?.toString() || "");
  const [estoqueMinimo, setEstoqueMinimo] = useState(initialData?.estoque_minimo?.toString() || "");
  const [codigoBarras, setCodigoBarras] = useState(initialData?.codigo_barras || "");
  const [vencimento, setVencimento] = useState(initialData?.vencimento || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = {
      nome,
      categoria,
      preco: parseFloat(preco),
      quantidade: parseInt(quantidade),
      estoque_minimo: parseInt(estoqueMinimo),
      ...(codigoBarras && { codigo_barras: codigoBarras }),
      ...(vencimento && { vencimento }),
    };
    onSubmit?.(product);
    console.log("Produto adicionado:", product);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar Produto</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Produto</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Arroz 5kg"
              required
              data-testid="input-product-name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ex: Alimentos"
              required
              data-testid="input-category"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="codigo-barras">Código de Barras (Opcional)</Label>
            <Input
              id="codigo-barras"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              placeholder="7891234567890"
              data-testid="input-barcode"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco">Preço (R$)</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                min="0"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="0.00"
                required
                data-testid="input-price"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                min="0"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="0"
                required
                data-testid="input-quantity"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estoque-minimo">Estoque Mínimo</Label>
              <Input
                id="estoque-minimo"
                type="number"
                min="0"
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value)}
                placeholder="0"
                required
                data-testid="input-min-stock"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vencimento">Data de Vencimento (Opcional)</Label>
            <Input
              id="vencimento"
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              data-testid="input-expiry-date"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" data-testid="button-save-product">
              Salvar Produto
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
