import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle } from "lucide-react";
import { getDaysUntilExpiry, formatDate } from "@/lib/dateUtils";

interface ExpiringProduct {
  id: number;
  nome: string;
  categoria: string;
  quantidade: number;
  vencimento: string;
  codigo_barras?: string;
}

interface ExpiringProductsReportProps {
  products?: ExpiringProduct[];
}

export default function ExpiringProductsReport({ products = [] }: ExpiringProductsReportProps) {
  const sortedProducts = [...products].sort((a, b) => {
    const daysA = getDaysUntilExpiry(a.vencimento) || 0;
    const daysB = getDaysUntilExpiry(b.vencimento) || 0;
    return daysA - daysB;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Produtos Próximos ao Vencimento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum produto próximo ao vencimento
                  </TableCell>
                </TableRow>
              ) : (
                sortedProducts.map((product) => {
                  const daysUntilExpiry = getDaysUntilExpiry(product.vencimento);
                  const isCritical = daysUntilExpiry !== null && daysUntilExpiry <= 7;
                  
                  return (
                    <TableRow key={product.id} data-testid={`row-expiring-${product.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.nome}</p>
                          {product.codigo_barras && (
                            <p className="text-xs text-muted-foreground">{product.codigo_barras}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.categoria}</TableCell>
                      <TableCell className="text-center">{product.quantidade}</TableCell>
                      <TableCell>{formatDate(product.vencimento)}</TableCell>
                      <TableCell>
                        {daysUntilExpiry !== null && (
                          <Badge 
                            variant={isCritical ? "destructive" : "default"}
                            className={!isCritical ? "bg-orange-500 text-white" : ""}
                            data-testid={`badge-status-${product.id}`}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {daysUntilExpiry} dia{daysUntilExpiry !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
