import { useState } from "react";
import { useLocation } from "wouter";
import SalesForm from "@/components/SalesForm";
import { useToast } from "@/hooks/use-toast";

export default function RegisterSale() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [products] = useState([
    { id: 1, nome: "Arroz 5kg", preco: 25.50, quantidade: 50 },
    { id: 2, nome: "Feijão 1kg", preco: 8.90, quantidade: 5 },
    { id: 3, nome: "Óleo de Soja 900ml", preco: 7.50, quantidade: 30 },
    { id: 4, nome: "Macarrão 500g", preco: 4.50, quantidade: 25 },
    { id: 5, nome: "Açúcar 1kg", preco: 5.90, quantidade: 40 },
  ]);

  const handleSubmit = (sale: any) => {
    console.log("Venda registrada:", sale);
    toast({
      title: "Venda registrada!",
      description: `Total: R$ ${sale.valorTotal.toFixed(2)}`,
    });
    setLocation("/vendas");
  };

  const handleCancel = () => {
    setLocation("/vendas");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Registrar Venda</h1>
        <p className="text-sm text-muted-foreground">Registre uma nova venda no sistema</p>
      </div>
      
      <div className="max-w-2xl">
        <SalesForm products={products} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
