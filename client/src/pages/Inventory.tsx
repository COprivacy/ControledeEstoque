import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, TrendingUp, Package, DollarSign } from "lucide-react";

export default function Inventory() {
  const [viewType, setViewType] = useState<"mensal" | "anual">("mensal");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Inventário
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Visualize e gerencie o inventário do seu estoque
          </p>
        </div>
      </div>

      <Tabs value={viewType} onValueChange={(value) => setViewType(value as "mensal" | "anual")} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2" data-testid="tabs-view-type">
          <TabsTrigger value="mensal" data-testid="tab-mensal">
            <Calendar className="h-4 w-4 mr-2" />
            Visão Mensal
          </TabsTrigger>
          <TabsTrigger value="anual" data-testid="tab-anual">
            <TrendingUp className="h-4 w-4 mr-2" />
            Visão Anual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mensal" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="card-produtos-estoque-mensal">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Produtos em Estoque
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-produtos-total-mensal">0</div>
                <p className="text-xs text-muted-foreground">
                  Neste mês
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-valor-total-mensal">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Valor Total em Estoque
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-valor-total-mensal">R$ 0,00</div>
                <p className="text-xs text-muted-foreground">
                  Neste mês
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-entradas-mensal">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Entradas
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-entradas-mensal">0</div>
                <p className="text-xs text-muted-foreground">
                  Produtos adicionados
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-saidas-mensal">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Saídas
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-saidas-mensal">0</div>
                <p className="text-xs text-muted-foreground">
                  Produtos vendidos
                </p>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-detalhes-mensal">
            <CardHeader>
              <CardTitle>Detalhes do Inventário Mensal</CardTitle>
              <CardDescription>
                Resumo do movimento de produtos no mês atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Aqui serão exibidos os detalhes completos do inventário mensal.</p>
                <p className="mt-2">Inclui: movimentações, produtos com baixo estoque, e análises mensais.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anual" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="card-produtos-estoque-anual">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Produtos em Estoque
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-produtos-total-anual">0</div>
                <p className="text-xs text-muted-foreground">
                  Neste ano
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-valor-total-anual">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Valor Total em Estoque
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-valor-total-anual">R$ 0,00</div>
                <p className="text-xs text-muted-foreground">
                  Neste ano
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-entradas-anual">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Entradas
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-entradas-anual">0</div>
                <p className="text-xs text-muted-foreground">
                  Produtos adicionados
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-saidas-anual">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Saídas
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-saidas-anual">0</div>
                <p className="text-xs text-muted-foreground">
                  Produtos vendidos
                </p>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-detalhes-anual">
            <CardHeader>
              <CardTitle>Detalhes do Inventário Anual</CardTitle>
              <CardDescription>
                Resumo do movimento de produtos no ano atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Aqui serão exibidos os detalhes completos do inventário anual.</p>
                <p className="mt-2">Inclui: evolução anual, tendências, comparativos mês a mês.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
