import ProductCard from "../ProductCard";

export default function ProductCardExample() {
  return (
    <div className="space-y-4 p-4">
      <ProductCard
        id={1}
        nome="Arroz 5kg"
        categoria="Alimentos"
        preco={25.50}
        quantidade={50}
        estoque_minimo={10}
        onEdit={(id) => console.log("Editar produto:", id)}
        onDelete={(id) => console.log("Deletar produto:", id)}
      />
      <ProductCard
        id={2}
        nome="Feijão 1kg"
        categoria="Alimentos"
        preco={8.90}
        quantidade={5}
        estoque_minimo={10}
        onEdit={(id) => console.log("Editar produto:", id)}
        onDelete={(id) => console.log("Deletar produto:", id)}
      />
    </div>
  );
}
