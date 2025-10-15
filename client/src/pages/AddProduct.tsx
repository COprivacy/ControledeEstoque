import { useLocation, useParams } from "wouter";
import AddProductForm from "@/components/AddProductForm";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const { data: product } = useQuery({
    queryKey: [`/api/produtos/${id}`],
    enabled: isEditing,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao criar produto");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      toast({
        title: "Produto adicionado!",
        description: `${data.nome} foi adicionado ao estoque`,
      });
      setLocation("/produtos");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/produtos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao atualizar produto");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      toast({
        title: "Produto atualizado!",
        description: `${data.nome} foi atualizado`,
      });
      setLocation("/produtos");
    },
  });

  const handleSubmit = (productData: any) => {
    if (isEditing) {
      updateMutation.mutate(productData);
    } else {
      createMutation.mutate(productData);
    }
  };

  const handleCancel = () => {
    setLocation("/produtos");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "Editar Produto" : "Adicionar Produto"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Atualize as informações do produto" : "Cadastre um novo produto no estoque"}
          </p>
        </div>
        <Badge className="bg-yellow-500 text-white">
          <Crown className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      </div>
      
      <div className="max-w-2xl">
        <AddProductForm 
          initialData={product}
          onSubmit={handleSubmit} 
          onCancel={handleCancel} 
        />
      </div>
    </div>
  );
}
