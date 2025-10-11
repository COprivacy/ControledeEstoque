import { useState } from "react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function Products() {
  const [, setLocation] = useLocation();
  
  const [products] = useState([
    { id: 1, nome: "Arroz 5kg", categoria: "Alimentos", preco: 25.50, quantidade: 50, estoque_minimo: 10 },
    { id: 2, nome: "Feijão 1kg", categoria: "Alimentos", preco: 8.90, quantidade: 5, estoque_minimo: 10 },
    { id: 3, nome: "Óleo de Soja 900ml", categoria: "Alimentos", preco: 7.50, quantidade: 30, estoque_minimo: 15 },
    { id: 4, nome: "Macarrão 500g", categoria: "Alimentos", preco: 4.50, quantidade: 25, estoque_minimo: 20 },
    { id: 5, nome: "Açúcar 1kg", categoria: "Alimentos", preco: 5.90, quantidade: 40, estoque_minimo: 10 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground">Gerencie seu catálogo de produtos</p>
        </div>
        <Button onClick={() => setLocation("/produtos/adicionar")} data-testid="button-add-product">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            onEdit={(id) => setLocation(`/produtos/editar/${id}`)}
            onDelete={(id) => console.log("Deletar produto:", id)}
          />
        ))}
      </div>
    </div>
  );
}
