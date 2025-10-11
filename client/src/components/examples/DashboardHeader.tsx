import DashboardHeader from "../DashboardHeader";

export default function DashboardHeaderExample() {
  return (
    <DashboardHeader 
      userEmail="loja1@gmail.com"
      onLogout={() => console.log("Logout clicado")}
    />
  );
}
