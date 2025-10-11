import ReportsCard from "../ReportsCard";

export default function ReportsCardExample() {
  return (
    <div className="p-4">
      <ReportsCard
        dailyTotal={118.00}
        weeklyTotal={850.50}
        onFilter={(start, end) => console.log("Filtrar:", start, end)}
      />
    </div>
  );
}
