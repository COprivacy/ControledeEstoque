import RegisterForm from "../RegisterForm";

export default function RegisterFormExample() {
  return (
    <RegisterForm 
      onRegister={(name, email, password) => console.log("Registro:", name, email, password)}
      onLoginClick={() => console.log("Navegar para login")}
    />
  );
}
