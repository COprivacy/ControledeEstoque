import SalesForm from "../SalesForm";

export default function SalesFormExample() {
  const mockProducts = [
    { id: 1, nome: "Arroz 5kg", preco: 25.50, quantidade: 50 },
    { id: 2, nome: "Feijão 1kg", preco: 8.90, quantidade: 5 },
    { id: 3, nome: "Óleo de Soja 900ml", preco: 7.50, quantidade: 30 },
  ];

  return (
    <div className="p-4 max-w-2xl">
      <SalesForm
        products={mockProducts}
        onSubmit={(sale) => console.log("Venda registrada:", sale)}
        onCancel={() => console.log("Cancelar clicado")}
      />
    </div>
  );
}
