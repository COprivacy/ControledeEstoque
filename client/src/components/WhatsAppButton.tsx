
import { MessageCircle } from "lucide-react";
import { useLocation } from "wouter";

interface WhatsAppButtonProps {
  phoneNumber: string;
  message?: string;
}

export default function WhatsAppButton({ 
  phoneNumber, 
  message = "Olá! Gostaria de tirar uma dúvida sobre o sistema." 
}: WhatsAppButtonProps) {
  const [location] = useLocation();

  // Não mostrar nas páginas de Caixa e PDV
  const hiddenPages = ['/caixa', '/pdv'];
  if (hiddenPages.includes(location)) {
    return null;
  }

  const handleClick = () => {
    // Remove caracteres não numéricos do telefone
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    // Codifica a mensagem para URL
    const encodedMessage = encodeURIComponent(message);
    // Abre o WhatsApp Web ou App
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
      aria-label="Falar no WhatsApp"
      data-testid="whatsapp-button"
    >
      {/* Versão mobile - apenas ícone */}
      <div className="flex items-center justify-center w-14 h-14 md:hidden">
        <MessageCircle className="h-6 w-6" />
      </div>

      {/* Versão desktop - ícone + texto */}
      <div className="hidden md:flex items-center gap-2 px-5 py-3">
        <MessageCircle className="h-5 w-5" />
        <span className="font-semibold">Fale Conosco</span>
      </div>

      {/* Animação de pulso */}
      <span className="absolute inset-0 rounded-full bg-green-400 opacity-0 group-hover:opacity-20 group-hover:animate-ping"></span>
    </button>
  );
}
