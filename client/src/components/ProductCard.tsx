import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, AlertTriangle, Calendar, Barcode } from "lucide-react";
import { getDaysUntilExpiry, getExpiryStatus, formatDate } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: number;
  nome: string;
  categoria: string;
  preco: number;
  quantidade: number;
  estoque_minimo: number;
  codigo_barras?: string | null;
  vencimento?: string | null;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function ProductCard({ 
  id, 
  nome, 
  categoria, 
  preco, 
  quantidade, 
  estoque_minimo,
  codigo_barras,
  vencimento,
  onEdit,
  onDelete 
}: ProductCardProps) {
  const isLowStock = quantidade < estoque_minimo;
  const expiryStatus = getExpiryStatus(vencimento || null);
  const daysUntilExpiry = getDaysUntilExpiry(vencimento || null);

  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br backdrop-blur-sm",
      isLowStock 
        ? "from-orange-500/10 via-orange-500/5 to-transparent" 
        : "from-blue-500/5 via-purple-500/5 to-transparent"
    )} data-testid={`card-product-${id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" data-testid={`text-product-name-${id}`}>{nome}</h3>
              {isLowStock && (
                <Badge variant="destructive" className="flex items-center gap-1" data-testid={`badge-low-stock-${id}`}>
                  <AlertTriangle className="h-3 w-3" />
                  Estoque Baixo
                </Badge>
              )}
              {expiryStatus === 'critical' && daysUntilExpiry !== null && (
                <Badge variant="destructive" className="flex items-center gap-1" data-testid={`badge-expiry-critical-${id}`}>
                  <Calendar className="h-3 w-3" />
                  Vence em {daysUntilExpiry} dia{daysUntilExpiry !== 1 ? 's' : ''}
                </Badge>
              )}
              {expiryStatus === 'warning' && daysUntilExpiry !== null && (
                <Badge className="flex items-center gap-1 bg-orange-500 text-white" data-testid={`badge-expiry-warning-${id}`}>
                  <Calendar className="h-3 w-3" />
                  Vence em {daysUntilExpiry} dias
                </Badge>
              )}
              {expiryStatus === 'expired' && (
                <Badge variant="destructive" className="flex items-center gap-1" data-testid={`badge-expired-${id}`}>
                  <Calendar className="h-3 w-3" />
                  Vencido
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{categoria}</p>
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <div>
                <span className="text-muted-foreground">Preço: </span>
                <span className="font-medium" data-testid={`text-price-${id}`}>R$ {preco.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Qtd: </span>
                <span className={`font-medium ${isLowStock ? 'text-destructive' : ''}`} data-testid={`text-quantity-${id}`}>
                  {quantidade}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Mín: </span>
                <span className="font-medium">{estoque_minimo}</span>
              </div>
              {codigo_barras && (
                <div className="flex items-center gap-1">
                  <Barcode className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs" data-testid={`text-barcode-${id}`}>{codigo_barras}</span>
                </div>
              )}
              {vencimento && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs" data-testid={`text-expiry-${id}`}>{formatDate(vencimento)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              size="icon" 
              variant="outline" 
              onClick={() => onEdit?.(id)}
              data-testid={`button-edit-${id}`}
              className="bg-transparent hover:bg-accent border-accent/50 hover:border-accent text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="outline" 
              onClick={() => onDelete?.(id)}
              data-testid={`button-delete-${id}`}
              className="bg-transparent hover:bg-accent border-accent/50 hover:border-accent text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}