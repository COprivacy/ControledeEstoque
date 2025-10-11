import ExpiringProductsReport from "../ExpiringProductsReport";

export default function ExpiringProductsReportExample() {
  const mockProducts = [
    { id: 1, nome: "Feijão 1kg", categoria: "Alimentos", quantidade: 5, vencimento: "2025-10-18", codigo_barras: "7891234567891" },
    { id: 2, nome: "Leite 1L", categoria: "Laticínios", quantidade: 12, vencimento: "2025-10-25", codigo_barras: "7891234567893" },
    { id: 3, nome: "Pão de Forma", categoria: "Padaria", quantidade: 8, vencimento: "2025-11-05", codigo_barras: "7891234567894" },
  ];

  return (
    <div className="p-4">
      <ExpiringProductsReport products={mockProducts} />
    </div>
  );
}
