
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, Shield, Lock, Eye, UserCheck, Database, Mail, Phone, FileText } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <nav className="sticky top-0 z-50 bg-slate-900/50 backdrop-blur-xl border-b border-blue-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <Package className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Pavisoft Sistemas
                </span>
              </div>
            </Link>
            <Link href="/">
              <Button variant="outline" className="border-blue-400/30 hover:border-blue-400 hover:bg-blue-500/10">
                Voltar ao Site
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Política de Privacidade
            </h1>
            <p className="text-gray-400 text-lg">
              Seu dados seguros e protegidos conforme a LGPD
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Última atualização: 13 de novembro de 2025
            </p>
          </div>

          {/* Compromisso com a Privacidade */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30 mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Nosso Compromisso com Sua Privacidade</h3>
                  <p className="text-gray-300">
                    A Pavisoft Sistemas está comprometida em proteger sua privacidade e seus dados pessoais. 
                    Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas 
                    informações de acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conteúdo Principal */}
          <Card className="bg-slate-900/50 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-3xl text-white">Política de Privacidade do Pavisoft Sistemas</CardTitle>
              <CardDescription className="text-gray-400">
                Como tratamos, protegemos e respeitamos seus dados pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <div className="space-y-8 text-gray-300">
                {/* 1. Identificação */}
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-blue-400" />
                    1. Identificação do Controlador de Dados
                  </h2>
                  <p className="mb-4">
                    <strong className="text-white">Razão Social:</strong> Pavisoft Sistemas Ltda.
                  </p>
                  <p className="mb-4">
                    <strong className="text-white">CNPJ:</strong> [INSERIR CNPJ]
                  </p>
                  <p className="mb-4">
                    <strong className="text-white">Endereço:</strong> [INSERIR ENDEREÇO COMPLETO]
                  </p>
                  <p className="mb-4">
                    <strong className="text-white">Email de Contato para Privacidade:</strong> privacidade@pavisoft.com.br
                  </p>
                  <p>
                    <strong className="text-white">Encarregado de Dados (DPO):</strong> [INSERIR NOME DO DPO]
                  </p>
                </section>

                {/* 2. Dados Coletados */}
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Database className="h-6 w-6 text-blue-400" />
                    2. Dados Pessoais Coletados
                  </h2>
                  
                  <h3 className="text-xl font-semibold text-white mb-3">2.1 Dados Cadastrais</h3>
                  <p className="mb-4">Ao criar sua conta no Pavisoft, coletamos:</p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Nome completo</li>
                    <li>Email</li>
                    <li>Senha (armazenada de forma criptografada)</li>
                    <li>CPF ou CNPJ</li>
                    <li>Telefone</li>
                    <li>Endereço comercial</li>
                    <li>Dados da empresa (razão social, nome fantasia, etc.)</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mb-3">2.2 Dados de Uso do Sistema</h3>
                  <p className="mb-4">Durante o uso do Pavisoft, coletamos automaticamente:</p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Logs de acesso e atividades no sistema</li>
                    <li>Endereço IP</li>
                    <li>Navegador e sistema operacional</li>
                    <li>Data e hora de acesso</li>
                    <li>Funcionalidades utilizadas</li>
                    <li>Métricas de desempenho e uso</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mb-3">2.3 Dados de Pagamento</h3>
                  <p className="mb-4">Para processar pagamentos, coletamos:</p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Informações de cartão de crédito (processadas via Mercado Pago - não armazenamos dados completos do cartão)</li>
                    <li>Histórico de transações</li>
                    <li>Dados de cobrança</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mb-3">2.4 Dados Inseridos por Você no Sistema</h3>
                  <p className="mb-4">Você insere e controla os seguintes dados em seu uso do sistema:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Dados de clientes e fornecedores</li>
                    <li>Informações de produtos e estoque</li>
                    <li>Registros de vendas e compras</li>
                    <li>Dados fiscais e tributários</li>
                    <li>Informações financeiras da empresa</li>
                  </ul>
                </section>

                {/* 3. Finalidade */}
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Eye className="h-6 w-6 text-blue-400" />
                    3. Finalidade do Tratamento de Dados
                  </h2>
                  <p className="mb-4">Utilizamos seus dados pessoais para as seguintes finalidades:</p>
                  
                  <h3 className="text-xl font-semibold text-white mb-3">3.1 Fornecimento do Serviço</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Criar e gerenciar sua conta</li>
                    <li>Processar suas transações e vendas</li>
                    <li>Fornecer funcionalidades do sistema</li>
                    <li>Emitir notas fiscais eletrônicas</li>
                    <li>Processar pagamentos de assinaturas</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mb-3">3.2 Comunicação</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Enviar notificações importantes sobre o serviço</li>
                    <li>Responder suas solicitações de suporte</li>
                    <li>Informar sobre atualizações e novidades (com seu consentimento)</li>
                    <li>Enviar lembretes de pagamento e renovação</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mb-3">3.3 Melhorias e Segurança</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Melhorar nossos serviços e funcionalidades</li>
                    <li>Detectar e prevenir fraudes</li>
                    <li>Garantir a segurança da plataforma</li>
                    <li>Realizar análises estatísticas e de desempenho</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mb-3">3.4 Cumprimento Legal</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Cumprir obrigações legais e regulatórias</li>
                    <li>Atender solicitações de autoridades competentes</li>
                    <li>Manter registros fiscais e contábeis</li>
                  </ul>
                </section>

                {/* 4. Base Legal */}
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                    <UserCheck className="h-6 w-6 text-blue-400" />
                    4. Base Legal para o Tratamento
                  </h2>
                  <p className="mb-4">Tratamos seus dados pessoais com base nas seguintes hipóteses legais previstas na LGPD:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong className="text-white">Execução de contrato:</strong> Para fornecer os serviços contratados</li>
                    <li><strong className="text-white">Consentimento:</strong> Para envio de comunicações de marketing (quando aplicável)</li>
                    <li><strong className="text-white">Legítimo interesse:</strong> Para melhorias do serviço e segurança</li>
                    <li><strong className="text-white">Cumprimento de obrigação legal:</strong> Para atender requisitos fiscais e regulatórios</li>
                  </ul>
                </section>

                {/* 5. Compartilhamento */}
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">5. Compartilhamento de Dados</h2>
                  <p className="mb-4">Compartilhamos seus dados apenas nas seguintes situações:</p>
                  
                  <h3 className="text-xl font-semibold text-white mb-3">5.1 Prestadores de Serviços</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li><strong className="text-white">Mercado Pago:</strong> Processamento de pagamentos</li>
                    <li><strong className="text-white">Focus NFe:</strong> Emissão de notas fiscais eletrônicas</li>
                    <li><strong className="text-white">Neon PostgreSQL:</strong> Armazenamento de banco de dados</li>
                    <li><strong className="text-white">Replit:</strong> Hospedagem da aplicação</li>
                    <li><strong className="text-white">Serviços de email:</strong> Envio de notificações</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mb-3">5.2 Autoridades Competentes</h3>
                  <p className="mb-4">
                    Podemos compartilhar dados quando exigido por lei, ordem judicial ou solicitação de autoridades governamentais.
                  </p>

                  <h3 className="text-xl font-semibold text-white mb-3">5.3 Não Vendemos Seus Dados</h3>
                  <p>
                    <strong className="text-white">Importante:</strong> Não vendemos, alugamos ou comercializamos seus dados pessoais com terceiros para fins de marketing.
                  </p>
                </section>

                {/* 6. Segurança */}
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Lock className="h-6 w-6 text-blue-400" />
                    6. Segurança e Proteção de Dados
                  </h2>
                  <p className="mb-4">Implementamos medidas técnicas e organizacionais para proteger seus dados:</p>
                  
                  <h3 className="text-xl font-semibold text-white mb-3">6.1 Medidas Técnicas</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Criptografia de dados sensíveis (senhas, informações de pagamento)</li>
                    <li>Conexões seguras via HTTPS/SSL</li>
                    <li>Backups regulares e automáticos</li>
                    <li>Monitoramento de segurança 24/7</li>
                    <li>Controle de acesso baseado em permissões</li>
                    <li>Logs de auditoria de todas as atividades</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mb-3">6.2 Medidas Organizacionais</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Políticas internas de segurança da informação</li>
                    <li>Treinamento de equipe em proteção de dados</li>
                    <li>Contratos de confidencialidade</li>
                    <li>Processo de resposta a incidentes de segurança</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mb-3">6.3 Notificação de Incidentes</h3>
                  <p>
                    Em caso de incidente de segurança que possa gerar risco ou dano relevante aos titulares de dados, 
                    notificaremos você e a Autoridade Nacional de Proteção de Dados (ANPD) conforme exigido pela LGPD.
                  </p>
                </section>

                {/* 7. Armazenamento */}
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">7. Retenção e Armazenamento de Dados</h2>
                  
                  <h3 className="text-xl font-semibold text-white mb-3">7.1 Período de Armazenamento</h3>
                  <p className="mb-4">Mantemos seus dados pessoais pelo seguinte período:</p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li><strong className="text-white">Dados cadastrais:</strong> Enquanto sua conta estiver ativa</li>
                    <li><strong className="text-white">Dados de uso:</strong> 12 meses após a coleta</li>
                    <li><strong className="text-white">Dados fiscais:</strong> 5 anos (conforme legislação tributária)</li>
                    <li><strong className="text-white">Dados financeiros:</strong> 5 anos (conforme legislação contábil)</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mb-3">7.2 Cancelamento de Conta</h3>
                  <p className="mb-4">
                    Após o cancelamento de sua conta, seus dados serão mantidos por 90 dias para permitir reativação. 
                    Após esse período, os dados serão permanentemente excluídos, exceto:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Dados necessários para cumprimento de obrigações legais</li>
                    <li>Dados necessários para exercício de direitos em processos judiciais</li>
                    <li>Dados anonimizados para fins estatísticos</li>
                  </ul>
                </section>

                {/* 8. Seus Direitos */}
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">8. Seus Direitos como Titular de Dados</h2>
                  <p className="mb-4">De acordo com a LGPD, você tem os seguintes direitos:</p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li><strong className="text-white">Confirmação e acesso:</strong> Confirmar se tratamos seus dados e acessá-los</li>
                    <li><strong className="text-white">Correção:</strong> Solicitar correção de dados incompletos, inexatos ou desatualizados</li>
                    <li><strong className="text-white">Anonimização, bloqueio ou eliminação:</strong> De dados desnecessários, excessivos ou tratados em desconformidade</li>
                    <li><strong className="text-white">Portabilidade:</strong> Receber seus dados em formato estruturado e interoperável</li>
                    <li><strong className="text-white">Eliminação:</strong> Solicitar exclusão de dados tratados com base em consentimento</li>
                    <li><strong className="text-white">Informação:</strong> Saber com quem compartilhamos seus dados</li>
                    <li><strong className="text-white">Revogação de consentimento:</strong> Retirar consentimento a qualquer momento</li>
                    <li><strong className="text-white">Oposição:</strong> Se opor ao tratamento realizado sem consentimento</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-white mb-3">8.1 Como Exercer Seus Direitos</h3>
                  <p className="mb-4">Para exercer qualquer um desses direitos, você pode:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Acessar as configurações da sua conta no sistema</li>
                    <li>Enviar email para: <strong className="text-white">privacidade@pavisoft.com.br</strong></li>
                    <li>Entrar em contato pelo WhatsApp: <strong className="text-white">(98) 98508-5498</strong></li>
                  </ul>
                  <p className="mt-4">
                    Responderemos sua solicitação em até 15 dias úteis, conforme previsto na LGPD.
                  </p>
                </section>

                {/* 9. Cookies */}
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">9. Cookies e Tecnologias Similares</h2>
                  <p className="mb-4">Utilizamos cookies e tecnologias similares para:</p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Manter você conectado ao sistema</li>
                    <li>Lembrar suas preferências</li>
                    <li>Analisar o uso da plataforma</li>
                    <li>Melhorar a experiência do usuário</li>
                  </ul>
                  <p className="mb-4">
                    <strong className="text-white">Tipos de cookies utilizados:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong className="text-white">Cookies essenciais:</strong> Necessários para o funcionamento do sistema</li>
                    <li><strong className="text-white">Cookies de desempenho:</strong> Coletam informações sobre como você usa o site</li>
                    <li><strong className="text-white">Cookies de preferência:</strong> Lembram suas escolhas e preferências</li>
                  </ul>
                  <p className="mt-4">
                    Você pode gerenciar cookies nas configurações do seu navegador, mas isso pode afetar 
                    funcionalidades do sistema.
                  </p>
                </section>

                {/* 10. Menores de Idade */}
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">10. Dados de Menores de Idade</h2>
                  <p className="mb-4">
                    O Pavisoft é destinado a pessoas jurídicas e maiores de 18 anos. Não coletamos 
                    intencionalmente dados de menores de idade.
                  </p>
                  <p>
                    Se tomarmos conhecimento de que coletamos dados de menores sem o devido consentimento 
                    dos responsáveis, tomaremos medidas imediatas para excluir essas informações.
                  </p>
                </section>

                {/* 11. Transferência Internacional */}
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">11. Transferência Internacional de Dados</h2>
                  <p className="mb-4">
                    Alguns de nossos prestadores de serviços podem estar localizados fora do Brasil. 
                    Nestes casos, garantimos que:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>A transferência seja necessária para a prestação do serviço</li>
                    <li>O país de destino ofereça nível adequado de proteção de dados</li>
                    <li>Sejam adotadas garantias contratuais de proteção (cláusulas-padrão)</li>
                    <li>Você seja informado sobre a transferência</li>
                  </ul>
                </section>

                {/* 12. Alterações */}
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">12. Alterações nesta Política</h2>
                  <p className="mb-4">
                    Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças 
                    em nossas práticas ou na legislação aplicável.
                  </p>
                  <p className="mb-4">
                    Quando fizermos alterações significativas, notificaremos você por:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Email cadastrado</li>
                    <li>Notificação no sistema</li>
                    <li>Aviso destacado em nosso site</li>
                  </ul>
                  <p>
                    Recomendamos que você revise esta política periodicamente para se manter informado 
                    sobre como protegemos seus dados.
                  </p>
                </section>

                {/* 13. Legislação Aplicável */}
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">13. Legislação e Foro</h2>
                  <p className="mb-4">
                    Esta Política de Privacidade é regida pela legislação brasileira, especialmente:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</li>
                    <li>Marco Civil da Internet (Lei nº 12.965/2014)</li>
                    <li>Código de Defesa do Consumidor (Lei nº 8.078/1990)</li>
                  </ul>
                  <p>
                    Fica eleito o foro da comarca de [INSERIR CIDADE], Estado de [INSERIR ESTADO], 
                    para dirimir quaisquer controvérsias decorrentes desta Política.
                  </p>
                </section>

                {/* 14. Contato */}
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Mail className="h-6 w-6 text-blue-400" />
                    14. Entre em Contato
                  </h2>
                  <p className="mb-4">
                    Para questões relacionadas à privacidade, proteção de dados ou para exercer seus direitos, 
                    entre em contato conosco:
                  </p>
                  <div className="bg-slate-800/50 rounded-lg p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-400">Email de Privacidade</p>
                        <p className="text-white font-medium">privacidade@pavisoft.com.br</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-400">Suporte Geral</p>
                        <p className="text-white font-medium">pavisoft.suporte@gmail.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-400">WhatsApp</p>
                        <p className="text-white font-medium">(98) 98508-5498</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-400">Encarregado de Dados (DPO)</p>
                        <p className="text-white font-medium">[INSERIR NOME DO DPO]</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Box de Aceitação */}
                <div className="mt-12 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-blue-400" />
                    Consentimento e Aceitação
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Ao criar uma conta e utilizar o Pavisoft Sistemas, você declara ter lido, compreendido 
                    e concordado com esta Política de Privacidade.
                  </p>
                  <p className="text-gray-300">
                    Você reconhece que forneceu seu consentimento livre, informado e inequívoco para o 
                    tratamento de seus dados pessoais conforme descrito nesta política.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Links Úteis */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ajuda">
              <Button variant="outline" className="border-blue-400/30 hover:border-blue-400 hover:bg-blue-500/10">
                Ver Termos de Uso
              </Button>
            </Link>
            <Link href="/contato">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Fale Conosco
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 py-8 mt-20">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Package className="h-6 w-6 text-blue-400" />
            <span className="text-white font-bold">Pavisoft Sistemas</span>
          </div>
          <p className="text-sm">© 2025 Pavisoft Sistemas. Todos os direitos reservados.</p>
          <div className="mt-4 flex justify-center gap-4 text-sm">
            <a href="#" className="text-gray-400 hover:text-blue-400">Privacidade</a>
            <span>•</span>
            <Link href="/ajuda" className="text-gray-400 hover:text-blue-400">Termos de Uso</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
