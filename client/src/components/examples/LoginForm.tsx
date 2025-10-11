import LoginForm from "../LoginForm";

export default function LoginFormExample() {
  return (
    <LoginForm 
      onLogin={(email, password) => console.log("Login:", email, password)}
      onRegisterClick={() => console.log("Navegar para registro")}
    />
  );
}
