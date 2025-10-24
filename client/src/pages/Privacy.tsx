import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" data-testid="link-home">
              <div className="flex items-center space-x-2 cursor-pointer">
                <Package className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Pavisoft Sistemas
                </span>
              </div>
            </Link>
            <Link href="/">
              <Button variant="outline" data-testid="button-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8" data-testid="text-privacy-title">
          Política de Privacidade
        </h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-300 mb-6" data-testid="text-last-update">
            Última atualização: 24 de outubro de 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Introdução
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              A Pavisoft Sistemas ("nós", "nosso" ou "nos") está comprometida em proteger sua privacidade. 
              Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas 
              informações quando você utiliza nosso sistema de gestão empresarial.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Ao utilizar o Pavisoft Sistema, você concorda com a coleta e uso de informações de acordo 
              com esta política.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Informações que Coletamos
            </h2>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">
              2.1 Informações Fornecidas por Você
            </h3>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2 mb-4">
              <li>Dados de cadastro: nome, e-mail, senha</li>
              <li>Informações empresariais: CNPJ, razão social, endereço</li>
              <li>Dados de clientes e fornecedores cadastrados no sistema</li>
              <li>Informações de produtos, vendas e estoque</li>
              <li>Dados fiscais e financeiros da sua empresa</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-4">
              2.2 Informações Coletadas Automaticamente
            </h3>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Endereço IP e informações do dispositivo</li>
              <li>Tipo de navegador e sistema operacional</li>
              <li>Páginas visitadas e tempo de uso do sistema</li>
              <li>Logs de acesso e atividades realizadas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. Como Usamos Suas Informações
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Utilizamos as informações coletadas para:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Fornecer e manter nosso serviço</li>
              <li>Processar transações e gerenciar sua conta</li>
              <li>Enviar notificações importantes sobre o sistema</li>
              <li>Melhorar e personalizar sua experiência</li>
              <li>Fornecer suporte ao cliente</li>
              <li>Detectar e prevenir fraudes ou atividades suspeitas</li>
              <li>Cumprir obrigações legais e fiscais</li>
              <li>Enviar comunicações de marketing (com seu consentimento)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. Compartilhamento de Informações
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Não vendemos suas informações pessoais. Podemos compartilhar suas informações nas 
              seguintes situações:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li><strong>Provedores de Serviço:</strong> Com empresas que nos ajudam a operar o sistema (hospedagem, pagamento, suporte)</li>
              <li><strong>Órgãos Reguladores:</strong> Para cumprimento de obrigações fiscais (Receita Federal, SEFAZ)</li>
              <li><strong>Requisições Legais:</strong> Quando exigido por lei ou ordem judicial</li>
              <li><strong>Proteção de Direitos:</strong> Para proteger nossos direitos, propriedade ou segurança</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Segurança dos Dados
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Criptografia SSL/TLS para transmissão de dados</li>
              <li>Armazenamento seguro em servidores protegidos</li>
              <li>Controle de acesso restrito aos dados</li>
              <li>Backups regulares e recuperação de desastres</li>
              <li>Monitoramento contínuo de segurança</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-4">
              No entanto, nenhum método de transmissão pela Internet é 100% seguro. Não podemos 
              garantir segurança absoluta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Seus Direitos (LGPD)
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
              <li><strong>Acesso:</strong> Confirmar se tratamos seus dados e acessá-los</li>
              <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou incorretos</li>
              <li><strong>Exclusão:</strong> Solicitar a eliminação de dados pessoais</li>
              <li><strong>Portabilidade:</strong> Solicitar a transferência de dados para outro fornecedor</li>
              <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> Opor-se ao tratamento de dados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. Retenção de Dados
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Mantemos suas informações pessoais pelo tempo necessário para cumprir as finalidades 
              descritas nesta política, exceto quando um período de retenção maior for exigido por lei 
              (como obrigações fiscais que requerem 5 anos de retenção).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. Cookies e Tecnologias Similares
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, incluindo cookies 
              essenciais para o funcionamento do sistema, cookies de desempenho e análise. Você pode 
              configurar seu navegador para recusar cookies, mas isso pode afetar a funcionalidade do sistema.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              9. Alterações nesta Política
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre 
              quaisquer alterações publicando a nova política nesta página e atualizando a data de 
              "Última atualização". Recomendamos que você revise esta política periodicamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              10. Contato
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Se você tiver dúvidas sobre esta Política de Privacidade ou quiser exercer seus direitos, 
              entre em contato conosco:
            </p>
            <ul className="list-none text-gray-600 dark:text-gray-300 space-y-2">
              <li><strong>Email:</strong> privacidade@pavisoft.com.br</li>
              <li><strong>Telefone:</strong> (11) 1234-5678</li>
              <li><strong>Endereço:</strong> São Paulo, SP - Brasil</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              11. Encarregado de Dados (DPO)
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Nosso Encarregado de Proteção de Dados pode ser contatado em: dpo@pavisoft.com.br
            </p>
          </section>

          <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Consentimento:</strong> Ao utilizar o Pavisoft Sistema, você reconhece que leu e 
              compreendeu esta Política de Privacidade e concorda com o tratamento de seus dados 
              conforme descrito.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/">
            <Button size="lg" data-testid="button-back-to-home">
              Voltar para a Página Inicial
            </Button>
          </Link>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Package className="h-6 w-6 text-blue-400" />
            <span className="text-white font-bold">Pavisoft Sistemas</span>
          </div>
          <p className="text-sm">© 2025 Pavisoft Sistemas. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
