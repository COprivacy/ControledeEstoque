import { useState } from "react";
import ReportsCard from "@/components/ReportsCard";
import SalesTable from "@/components/SalesTable";
import ExpiringProductsReport from "@/components/ExpiringProductsReport";

export default function Reports() {
  const [filteredSales, setFilteredSales] = useState([
    { id: 1, produto: "Arroz 5kg", quantidade_vendida: 2, valor_total: 51.00, data: "2025-01-10T10:30:00" },
    { id: 2, produto: "Feijão 1kg", quantidade_vendida: 5, valor_total: 44.50, data: "2025-01-10T14:15:00" },
    { id: 3, produto: "Óleo de Soja 900ml", quantidade_vendida: 3, valor_total: 22.50, data: "2025-01-09T16:45:00" },
  ]);

  const [expiringProducts] = useState([
    { id: 2, nome: "Feijão 1kg", categoria: "Alimentos", quantidade: 5, vencimento: "2025-10-18", codigo_barras: "7891234567891" },
    { id: 6, nome: "Leite 1L", categoria: "Laticínios", quantidade: 12, vencimento: "2025-10-25" },
  ]);

  const dailyTotal = 95.50;
  const weeklyTotal = 186.60;

  const handleFilter = (startDate: string, endDate: string) => {
    console.log("Filtrar vendas entre:", startDate, "e", endDate);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Análise de vendas e desempenho</p>
      </div>

      <ReportsCard
        dailyTotal={dailyTotal}
        weeklyTotal={weeklyTotal}
        onFilter={handleFilter}
      />

      <ExpiringProductsReport products={expiringProducts} />

      <SalesTable sales={filteredSales} />
    </div>
  );
}
