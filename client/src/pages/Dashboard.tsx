
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatsCards from "@/components/StatsCards";
import ProductCard from "@/components/ProductCard";
import { Plus, Package, Crown, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/produtos"],
  });

  const { data: vendas = [] } = useQuery({
    queryKey: ["/api/vendas"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/produtos/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao deletar produto");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      toast({
        title: "Produto excluído!",
        description: "O produto foi removido do estoque",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteMutation.mutate(id);
    }
  };

  const lowStockProducts = products.filter((p: any) => p.quantidade < p.estoque_minimo);
  
  const today = new Date().toISOString().split('T')[0];
  const todaySales = vendas
    .filter((v: any) => v.data?.startsWith(today))
    .reduce((sum: number, v: any) => sum + (v.valor_total || 0), 0);

  // Dados para gráficos
  const categoryData = useMemo(() => {
    const categories = products.reduce((acc: any, p: any) => {
      const cat = p.categoria || 'Sem categoria';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value
    }));
  }, [products]);

  const stockLevelData = useMemo(() => {
    const normal = products.filter((p: any) => p.quantidade >= p.estoque_minimo).length;
    const low = products.filter((p: any) => p.quantidade < p.estoque_minimo && p.quantidade > 0).length;
    const out = products.filter((p: any) => p.quantidade === 0).length;
    
    return [
      { name: 'Estoque Normal', value: normal, color: '#00C49F' },
      { name: 'Estoque Baixo', value: low, color: '#FFBB28' },
      { name: 'Sem Estoque', value: out, color: '#FF8042' }
    ].filter(item => item.value > 0);
  }, [products]);

  const salesTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayName = new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' });
      const daySales = vendas
        .filter((v: any) => v.data?.startsWith(date))
        .reduce((sum: number, v: any) => sum + (v.valor_total || 0), 0);
      
      return {
        day: dayName,
        vendas: Number(daySales.toFixed(2))
      };
    });
  }, [vendas]);

  const topProducts = useMemo(() => {
    const productSales = vendas.reduce((acc: any, v: any) => {
      const produto = v.produto || 'Desconhecido';
      acc[produto] = (acc[produto] || 0) + (v.quantidade_vendida || 0);
      return acc;
    }, {});

    return Object.entries(productSales)
      .map(([name, quantidade]) => ({ name, quantidade }))
      .sort((a: any, b: any) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [vendas]);

  const chartConfig = {
    vendas: {
      label: "Vendas",
      color: "hsl(var(--primary))",
    },
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Visão geral do seu estoque</p>
          </div>
          <Badge className="bg-yellow-500 text-white">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
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

      {/* Gráficos Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Vendas dos Últimos 7 Dias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tendência de Vendas (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="day" 
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Nível de Estoque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Status do Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockLevelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stockLevelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Produtos Mais Vendidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              Top 5 Produtos Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    className="text-xs"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="quantidade" 
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Produtos por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Produtos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-destructive">Produtos com Estoque Baixo</h2>
            <span className="text-sm text-muted-foreground">({lowStockProducts.length} produtos)</span>
          </div>
          <div className="space-y-3">
            {lowStockProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                {...product}
                onEdit={(id) => setLocation(`/produtos/editar/${id}`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      
    </div>
  );
}
