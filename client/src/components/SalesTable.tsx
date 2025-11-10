import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/badge";

interface Sale {
  id: number;
  produto: string;
  quantidade_vendida: number;
  valor_total: number;
  forma_pagamento: string;
  data: string;
  orcamento_id?: number; // Adicionado campo orcamento_id
  vendedor?: string; // Adicionado campo vendedor
}

interface SalesTableProps {
  sales: Sale[];
}

export default function SalesTable({ sales }: SalesTableProps) {
  if (!sales || sales.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma venda encontrada
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead className="text-center">Quantidade</TableHead>
            <TableHead>Forma de Pagamento</TableHead>
            <TableHead className="text-right">Valor Total</TableHead>
            <TableHead>Origem/Vendedor</TableHead>
            <TableHead className="text-right">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Nenhuma venda registrada
              </TableCell>
            </TableRow>
          ) : (
            sales.map((sale: any) => {
              let formaPagamento = 'Dinheiro';
              if (sale.forma_pagamento === 'cartao_credito') formaPagamento = 'Cartão Crédito';
              else if (sale.forma_pagamento === 'cartao_debito') formaPagamento = 'Cartão Débito';
              else if (sale.forma_pagamento === 'pix') formaPagamento = 'PIX';

              return (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.produto || 'N/A'}</TableCell>
                  <TableCell className="text-center">{sale.quantidade_vendida || 0}</TableCell>
                  <TableCell>{formaPagamento}</TableCell>
                  <TableCell className="text-right font-medium" data-testid={`text-value-${sale.id}`}>
                    R$ {(sale.valor_total || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {sale.orcamento_id && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 w-fit">
                          📋 Orçamento #{sale.orcamento_id}
                        </Badge>
                      )}
                      {sale.vendedor && (
                        <span className="text-sm text-muted-foreground">
                          👤 {sale.vendedor}
                        </span>
                      )}
                      {!sale.orcamento_id && !sale.vendedor && (
                        <span className="text-sm text-muted-foreground">Venda direta</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {sale.data ? formatDateTime(sale.data) : 'N/A'}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}