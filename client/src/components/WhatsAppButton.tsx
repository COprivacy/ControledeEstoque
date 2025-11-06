
import { MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

interface WhatsAppButtonProps {
  phoneNumber: string;
  message?: string;
}

export default function WhatsAppButton({ 
  phoneNumber, 
  message = "Olá! Gostaria de tirar uma dúvida sobre o sistema." 
}: WhatsAppButtonProps) {
  const [location] = useLocation();
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Não mostrar nas páginas de Caixa e PDV
  const hiddenPages = ['/caixa', '/pdv'];
  if (hiddenPages.includes(location)) {
    return null;
  }

  const handleClick = () => {
    if (!showConfirmation) {
      // Primeiro clique: mostra a confirmação
      setShowConfirmation(true);
      
      // Remove a confirmação após 3 segundos se não clicar
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
    } else {
      // Segundo clique: abre o WhatsApp
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      setShowConfirmation(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
      aria-label="Falar no WhatsApp"
      data-testid="whatsapp-button"
    >
      {!showConfirmation ? (
        // Estado inicial: apenas o ícone do WhatsApp
        <div className="flex items-center justify-center w-14 h-14">
          <MessageCircle className="h-6 w-6" />
        </div>
      ) : (
        // Estado de confirmação: mostra "Fale Conosco?"
        <div className="flex items-center gap-2 px-5 py-3 animate-in fade-in slide-in-from-right-2">
          <MessageCircle className="h-5 w-5" />
          <span className="font-semibold whitespace-nowrap">Fale Conosco?</span>
        </div>
      )}

      {/* Animação de pulso */}
      <span className="absolute inset-0 rounded-full bg-green-400 opacity-0 group-hover:opacity-20 group-hover:animate-ping"></span>
    </button>
  );
}
