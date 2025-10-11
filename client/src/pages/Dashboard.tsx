import { useState } from "react";
import { Button } from "@/components/ui/button";
import StatsCards from "@/components/StatsCards";
import ProductCard from "@/components/ProductCard";
import { Plus, Package } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const [products] = useState([
    { id: 1, nome: "Arroz 5kg", categoria: "Alimentos", preco: 25.50, quantidade: 50, estoque_minimo: 10 },
    { id: 2, nome: "Feijão 1kg", categoria: "Alimentos", preco: 8.90, quantidade: 5, estoque_minimo: 10 },
    { id: 3, nome: "Óleo de Soja 900ml", categoria: "Alimentos", preco: 7.50, quantidade: 30, estoque_minimo: 15 },
  ]);

  const lowStockProducts = products.filter(p => p.quantidade < p.estoque_minimo);
  const todaySales = 118.00;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral do seu estoque</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setLocation("/produtos/adicionar")} data-testid="button-add-product">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
          <Button variant="outline" onClick={() => setLocation("/vendas/registrar")} data-testid="button-register-sale">
            <Package className="h-4 w-4 mr-2" />
            Registrar Venda
          </Button>
        </div>
      </div>

      <StatsCards
        totalProdutos={products.length}
        produtosBaixoEstoque={lowStockProducts.length}
        vendasHoje={todaySales}
      />

      {lowStockProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-destructive">Produtos com Estoque Baixo</h2>
            <span className="text-sm text-muted-foreground">({lowStockProducts.length} produtos)</span>
          </div>
          <div className="space-y-3">
            {lowStockProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onEdit={(id) => console.log("Editar produto:", id)}
                onDelete={(id) => console.log("Deletar produto:", id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Todos os Produtos</h2>
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
    </div>
  );
}
