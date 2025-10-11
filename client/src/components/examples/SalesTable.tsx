import SalesTable from "../SalesTable";

export default function SalesTableExample() {
  const mockSales = [
    { id: 1, produto: "Arroz 5kg", quantidade_vendida: 2, valor_total: 51.00, data: "2025-01-10" },
    { id: 2, produto: "Feijão 1kg", quantidade_vendida: 5, valor_total: 44.50, data: "2025-01-10" },
    { id: 3, produto: "Óleo de Soja 900ml", quantidade_vendida: 3, valor_total: 22.50, data: "2025-01-09" },
  ];

  return (
    <div className="p-4">
      <SalesTable sales={mockSales} />
    </div>
  );
}
