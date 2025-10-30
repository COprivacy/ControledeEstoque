import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { Plus, Crown, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

// Assuming apiRequest is defined elsewhere and handles authentication headers
// import { apiRequest } from "@/lib/api"; // Example import

// Mock apiRequest for demonstration if not provided
const apiRequest = async (method, url, body) => {
  const token = localStorage.getItem('authToken'); // Example of getting a token
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  // Handle potential 401 Unauthorized errors specifically
  if (response.status === 401) {
      throw new Error("Unauthorized: Please log in again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})); // Try to get JSON error, fallback to empty object
    const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  return response;
};


export default function Products() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/produtos"],
  });

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return products;
    }
    return products.filter((product: any) =>
      product.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/produtos/${id}`, undefined);
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
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o produto",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-in slide-in-from-left duration-700">
              Produtos
            </h1>
            <p className="text-sm text-muted-foreground animate-in slide-in-from-left duration-700 delay-100">
              Gerencie seu catálogo com eficiência
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-in zoom-in duration-500">
            <Crown className="h-3 w-3 mr-1 animate-pulse" />
            Premium
          </Badge>
          <div className="relative animate-in slide-in-from-top duration-700 delay-150">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-pulse" />
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 border-2 border-primary/20 focus:border-primary/50 transition-all duration-300 shadow-md hover:shadow-lg"
              data-testid="input-search-products"
            />
          </div>
          <Button 
            onClick={() => setLocation("/produtos/adicionar")} 
            data-testid="button-add-product" 
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 border-0 hover:scale-105 hover:shadow-2xl transition-all duration-300 shadow-lg animate-in zoom-in duration-700 delay-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {searchTerm && (
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="space-y-3">
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum produto cadastrado
            </p>
          ) : searchTerm && filteredProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum produto encontrado para "{searchTerm}"
            </p>
          ) : (
            (searchTerm ? filteredProducts : products).map((product: any) => (
              <ProductCard
                key={product.id}
                {...product}
                onEdit={(id) => setLocation(`/produtos/editar/${id}`)}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}