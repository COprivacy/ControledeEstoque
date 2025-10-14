import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/dateUtils";

interface Sale {
  id: number;
  produto: string;
  quantidade_vendida: number;
  valor_total: number;
  data: string;
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
            <TableHead className="text-right">Valor Total</TableHead>
            <TableHead className="text-right">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-medium">{sale.produto || 'N/A'}</TableCell>
              <TableCell className="text-center">{sale.quantidade_vendida || 0}</TableCell>
              <TableCell className="text-right font-medium" data-testid={`text-value-${sale.id}`}>
                R$ {(sale.valor_total || 0).toFixed(2)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {sale.data ? formatDateTime(sale.data) : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}