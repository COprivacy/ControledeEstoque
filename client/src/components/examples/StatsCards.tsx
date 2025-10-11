import StatsCards from "../StatsCards";

export default function StatsCardsExample() {
  return (
    <div className="p-4">
      <StatsCards
        totalProdutos={25}
        produtosBaixoEstoque={3}
        vendasHoje={450.80}
      />
    </div>
  );
}
