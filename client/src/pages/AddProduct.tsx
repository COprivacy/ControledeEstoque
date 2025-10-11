import { useLocation } from "wouter";
import AddProductForm from "@/components/AddProductForm";
import { useToast } from "@/hooks/use-toast";

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (product: any) => {
    console.log("Produto adicionado:", product);
    toast({
      title: "Produto adicionado!",
      description: `${product.nome} foi adicionado ao estoque`,
    });
    setLocation("/produtos");
  };

  const handleCancel = () => {
    setLocation("/produtos");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Adicionar Produto</h1>
        <p className="text-sm text-muted-foreground">Cadastre um novo produto no estoque</p>
      </div>
      
      <div className="max-w-2xl">
        <AddProductForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
