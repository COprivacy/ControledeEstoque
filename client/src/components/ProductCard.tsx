import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";

interface ProductCardProps {
  id: number;
  nome: string;
  categoria: string;
  preco: number;
  quantidade: number;
  estoque_minimo: number;
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
  onEdit,
  onDelete 
}: ProductCardProps) {
  const isLowStock = quantidade < estoque_minimo;

  return (
    <Card className={isLowStock ? "border-destructive" : ""} data-testid={`card-product-${id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground" data-testid={`text-product-name-${id}`}>{nome}</h3>
              {isLowStock && (
                <Badge variant="destructive" className="flex items-center gap-1" data-testid={`badge-low-stock-${id}`}>
                  <AlertTriangle className="h-3 w-3" />
                  Estoque Baixo
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{categoria}</p>
            <div className="flex items-center gap-4 text-sm">
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
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              size="icon" 
              variant="outline" 
              onClick={() => onEdit?.(id)}
              data-testid={`button-edit-${id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="outline" 
              onClick={() => onDelete?.(id)}
              data-testid={`button-delete-${id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
