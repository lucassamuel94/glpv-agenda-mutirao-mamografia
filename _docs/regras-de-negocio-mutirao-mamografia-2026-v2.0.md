# Regras de Negócio - Agenda Mutirão de Mamografia 2026

**Versão:** 2.0  
**Data:** 01/08/2026  
**Status:** Minuta consolidada para validação do cliente  
**Escopo:** API Node.js, painel Next.js, integração EZ Chat via WhatsApp e banco PostgreSQL

## 1. Objetivo e visão executiva

Este documento consolida as regras funcionais, operacionais, de segurança e de auditoria do Mutirão de Mamografia 2026. A solução deve administrar 2.000 exames distribuídos entre três clínicas, atender pelo EZ Chat, permitir operação assistida no painel e preservar rastreabilidade e proteção dos dados pessoais.

Premissas confirmadas:

- serão três clínicas;
- a capacidade total será de 2.000 exames;
- duas clínicas ofertarão 500 exames cada e uma clínica ofertará 1.000 exames;
- a janela operacional informada é de 08/09/2026 a 30/10/2026, de segunda a sexta-feira;
- a Radioclínica possui uma planilha com 500 vagas, porém a versão recebida inclui sábados e 31/10/2026;
- a opção "não poderei comparecer" no lembrete não pode cancelar o atendimento de imediato: deve existir uma confirmação explícita antes de registrar ausência confirmada.

## 2. Cadastro das clínicas

| Clínica | Capacidade | Endereço | Contatos | Situação |
|---|---:|---|---|---|
| Radioclínica | 500 | Av. Cipriano Del Fávero, 510 - Centro, Uberlândia - MG, 38400-106 | (34) 3210-2054 | Capacidade confirmada pela planilha recebida; agenda exige conciliação |
| Clínica Pro-Imagem - Unidade II | A definir entre 500 e 1.000 | R. Quintino Bocaiúva, 254 - Centro, Uberlândia - MG, 38400-108 | WhatsApp somente mensagens e telefone fixo: (34) 3230-5900 | Capacidade individual e grade ainda não informadas |
| IME | A definir entre 500 e 1.000 | Av. Getúlio Vargas, 521 - Centro, Uberlândia - MG | Telefone: (34) 3253-5353; WhatsApp: (34) 99962-1595 | Capacidade individual e grade ainda não informadas |

As capacidades da Pro-Imagem e do IME devem ser definidas antes da carga final, de modo que uma delas tenha 500 vagas e a outra 1.000 vagas.

## 3. Regras consolidadas

### 3.1 Elegibilidade

- **RN-01.** Pode agendar a mulher que tiver 40 anos ou mais na data do exame, e não apenas na data do contato ou do agendamento.
- **RN-02.** É inelegível quem declarar ter realizado mamografia nos 12 meses anteriores à data do novo exame.
- **RN-03.** A triagem ocorre no EZ Chat. A API deve revalidar a idade na criação do agendamento, independentemente do canal de origem.

### 3.2 Identificação da paciente e duplicidade

- **RN-04.** A paciente é identificada por nome completo normalizado e data de nascimento.
- **RN-05.** A normalização do nome deve converter o texto para maiúsculas, remover acentos, reduzir espaços múltiplos a um e remover espaços no início e no fim.
- **RN-06.** É permitido somente um agendamento ativo, com status `CONFIRMADO`, por paciente.
- **RN-07.** Uma possível homônima não deve ser recusada definitivamente. O atendimento deve ser encaminhado à fila humana para validação com dados adicionais.

### 3.3 Período, clínicas, capacidade e agenda

- **RN-08.** A janela operacional válida do mutirão é de 08/09/2026 a 30/10/2026, inclusive, somente de segunda a sexta-feira.
- **RN-09.** A capacidade global é de 2.000 exames, distribuída entre três clínicas: duas com 500 vagas cada e uma com 1.000 vagas.
- **RN-10.** A Radioclínica terá 500 vagas. A atribuição de 500 ou 1.000 vagas à Pro-Imagem e ao IME deve ser configurada e validada antes da publicação da agenda.
- **RN-11.** Cada vaga pertence a uma única clínica e contém data e horário próprios. O mesmo horário pode existir em clínicas diferentes, pois são vagas distintas.
- **RN-12.** A agenda final de cada clínica deve ser carregada a partir de arquivo aprovado pelo cliente. A carga deve rejeitar datas fora da janela, sábados, domingos, horários duplicados na mesma clínica e total diferente da capacidade configurada.
- **RN-13.** A planilha atual da Radioclínica não deve ser importada como agenda definitiva. Ela contém 500 vagas em 46 datas, de 08/09/2026 a 31/10/2026, sendo 438 vagas de segunda a sexta até 30/10 e 62 vagas aos sábados. As 62 vagas devem ser redistribuídas para dias úteis ou substituídas em uma nova versão aprovada.
- **RN-14.** A imagem de referência da Radioclínica, com 20 agendamentos por dia, é informativa. Como seus horários não coincidem com a planilha detalhada, ela não deve ser combinada automaticamente com a planilha. A agenda revisada e aprovada será a fonte oficial.
- **RN-15.** Não existe tela de criação ou edição em massa da agenda no MVP. A carga inicial é controlada na implantação, com relatório de validação antes da publicação.

### 3.4 Vagas e estados operacionais

- **RN-16.** Os estados possíveis de uma vaga são `LIVRE`, `RESERVADA` e `OCUPADA`.
- **RN-17.** Uma vaga `RESERVADA` está temporariamente indisponível para todos os demais canais.
- **RN-18.** A confirmação transforma a vaga reservada em `OCUPADA`.
- **RN-19.** O cancelamento válido libera a vaga e a devolve ao estado `LIVRE`, preservando o histórico do agendamento cancelado.

### 3.5 Oferta de vaga pelo EZ Chat

- **RN-20.** A paciente não escolhe a clínica. O sistema define a clínica ao gerar a oferta e apresenta clínica, data, horário, endereço e telefone de contato.
- **RN-21.** O sistema oferece uma vaga por vez, nunca uma lista de opções.
- **RN-22.** A clínica é definida pelo menor percentual de ocupação, calculado por `(OCUPADAS + RESERVADAS) / capacidade da clínica`.
- **RN-23.** Em empate no percentual, vence a clínica com menor quantidade absoluta de vagas ocupadas e reservadas. Persistindo o empate, vence a clínica com menor identificador interno.
- **RN-24.** Cada oferta cria uma reserva temporária de 10 minutos. Durante esse período, a vaga não pode ser oferecida em outro atendimento ou canal.
- **RN-25.** A expiração da reserva devolve a vaga a `LIVRE`. Uma confirmação recebida depois da expiração não ocupa a vaga antiga e deve iniciar nova oferta.
- **RN-26.** São permitidas três ofertas por conversa: a inicial e duas reofertas. Após três recusas, o atendimento segue para a fila humana do EZ Chat.
- **RN-27.** A reoferta prioriza outro dia; se não houver, outro turno no mesmo dia; se ainda não houver, qualquer vaga livre. Uma vaga recusada não pode ser repetida na mesma conversa. Uma nova conversa reinicia o contador.

### 3.6 Confirmação do agendamento

- **RN-28.** A confirmação deve referenciar o identificador da oferta e da reserva, sem recalcular ou substituir a vaga apresentada.
- **RN-29.** O endpoint de confirmação deve ser idempotente. O reenvio da mesma oferta retorna o agendamento já criado, sem duplicidade.
- **RN-30.** A confirmação gera protocolo de seis caracteres alfanuméricos, não sequencial, sem `O`, `0`, `I`, `1` e `L`.
- **RN-31.** A consulta pelo protocolo exige protocolo e data de nascimento.
- **RN-32.** O agendamento manual pelo painel obedece às regras de idade, duplicidade e concorrência. O atendente escolhe uma vaga livre na grade, sem balanceamento automático.
- **RN-33.** A mensagem final de confirmação deve repetir protocolo, clínica, endereço, data, horário e canais de contato da clínica.

### 3.7 Cancelamento

- **RN-34.** Não existe reagendamento direto. A alteração de clínica, data ou horário exige cancelar o agendamento atual e criar outro.
- **RN-35.** Todo cancelamento exige motivo tipificado: `ERRO_OPERACIONAL`, `DESISTENCIA` ou `AUSENCIA_CONFIRMADA`.
- **RN-36.** `ERRO_OPERACIONAL` é usado pelo painel, libera a vaga e não bloqueia novo agendamento pelo bot.
- **RN-37.** `DESISTENCIA` pode ser usado pelo bot ou painel, libera a vaga e bloqueia novo agendamento automático pelo bot.
- **RN-38.** `AUSENCIA_CONFIRMADA` pode ser usado no fluxo de lembrete ou pelo painel, libera a vaga e bloqueia novo agendamento automático pelo bot.
- **RN-39.** O bloqueio de novo agendamento vale somente para o bot. O painel pode criar novo agendamento para uma paciente bloqueada, inclusive no atendimento da lista de espera.
- **RN-40.** Cancelamento é mudança de status, nunca exclusão. O sistema preserva data, hora, canal, motivo e responsável pela ação.
- **RN-41.** Selecionar "não poderei comparecer" no lembrete não cancela o agendamento. Essa escolha inicia um estado de confirmação dentro da conversa, mantendo o agendamento `CONFIRMADO`.
- **RN-42.** O cancelamento por ausência somente é efetivado após resposta afirmativa explícita à pergunta de confirmação. A resposta negativa, a falta de resposta ou uma resposta não reconhecida mantêm o agendamento confirmado.

Texto funcional recomendado para a confirmação:

> Você confirma que deseja cancelar seu atendimento de mamografia em **DD/MM/AAAA**, às **HH:MM**, na **Clínica X**?  
> **Sim, cancelar atendimento**  
> **Não, manter atendimento**

Depois de "Sim, cancelar atendimento", o fluxo registra `AUSENCIA_CONFIRMADA`, informa que a vaga foi cancelada e pergunta sobre a lista de espera. Depois de "Não, manter atendimento", informa que o agendamento continua confirmado.

### 3.8 Lista de espera

- **RN-43.** A paciente que confirmou ausência ou desistência pode optar por entrar na lista de espera.
- **RN-44.** A lista de espera registra nome, data de nascimento, telefone principal, telefone alternativo quando informado e data de entrada.
- **RN-45.** O painel permite incluir, consultar, marcar como contatada e remover uma pessoa da lista, mantendo o histórico de ações. A ordenação padrão é pela data de entrada mais antiga.
- **RN-46.** A lista de espera não garante vaga. Havendo disponibilidade, o atendente entra em contato e cria o agendamento pelo painel.

### 3.9 Lembrete de presença

- **RN-47.** O disparo do lembrete é agendado e executado pela plataforma EZ Chat.
- **RN-48.** A API fornece ao EZ Chat os dados necessários do agendamento e recebe a resposta da paciente de forma idempotente.
- **RN-49.** O lembrete apresenta, no mínimo, data, horário, clínica e uma pergunta objetiva de confirmação de presença.
- **RN-50.** A opção de comparecimento mantém o agendamento confirmado e registra o evento de resposta.
- **RN-51.** A opção de não comparecimento executa obrigatoriamente o fluxo de dupla confirmação das RN-41 e RN-42 antes de qualquer cancelamento.
- **RN-52.** A antecedência, a quantidade de tentativas e os horários de disparo do lembrete são parâmetros operacionais do EZ Chat e devem ser aprovados antes da ativação.

### 3.10 Painel, perfis, relatórios, segurança e auditoria

- **RN-53.** O perfil `ATENDENTE` acessa a grade, busca pacientes, cria agendamento manual, cancela atendimento e gerencia a lista de espera.
- **RN-54.** O perfil `ADM` possui todas as permissões do atendente e também acessa dashboard, relatório Excel e gestão de usuários e perfis.
- **RN-55.** O painel autentica por login e senha próprios, com sessão protegida por JWT. A integração do EZ Chat usa chave de API com escopo restrito aos endpoints do bot.
- **RN-56.** Toda escrita deve ser auditada, incluindo oferta, reserva, confirmação, cancelamento, entrada ou saída da lista de espera e gestão de usuário.
- **RN-57.** A auditoria registra autor ou integração, data e hora, entidade, identificador, ação, valores anteriores e novos valores quando aplicável.
- **RN-58.** Dados de saúde e identificação pessoal são tratados como dados pessoais sensíveis: acesso autenticado, privilégio mínimo, ausência de dados pessoais em URL e logs sem conteúdo de paciente.
- **RN-59.** Dashboard e relatório devem separar resultados por clínica e consolidar o mutirão, incluindo capacidade, vagas livres, reservadas e ocupadas, confirmações, cancelamentos por motivo e lista de espera.

### 3.11 Convenções técnicas

- **RN-60.** Datas e horários de vagas e agendamentos são armazenados como horário local sem timezone (`timestamp`), sob a convenção documentada `America/Sao_Paulo`. A mesma convenção deve ser aplicada na API, no banco, no painel e nas mensagens, sem conversões de fuso.
- **RN-61.** A concorrência de vaga deve ser garantida no banco por transação e bloqueio ou restrição equivalente, e não apenas por validação prévia na API.
- **RN-62.** Operações sujeitas a repetição da plataforma, como confirmação, resposta ao lembrete e cancelamento, devem aceitar chave de idempotência e retornar o resultado já processado.

### 3.12 Limitações aceitas

- **RN-63.** A informação de ausência de mamografia nos últimos 12 meses é autodeclarada, sem validação externa.
- **RN-64.** O sistema não registra comparecimento no local. O relatório de ausências contém somente ausências confirmadas antes do exame.
- **RN-65.** A fila humana após três recusas usa o mesmo conjunto de vagas; próxima da lotação, pode não haver alternativa disponível.
- **RN-66.** Homônimas com mesma data de nascimento exigem tratamento manual.
- **RN-67.** Variações de digitação do nome podem gerar duplicidade não detectada; o risco residual é aceito, com mitigação por busca no painel e auditoria.

## 4. Conciliação da agenda da Radioclínica

### 4.1 Resultado da análise da planilha recebida

| Indicador | Resultado |
|---|---:|
| Vagas totais | 500 |
| Datas cadastradas | 46 |
| Período encontrado | 08/09/2026 a 31/10/2026 |
| Dias úteis dentro da janela informada | 38 |
| Vagas válidas de segunda a sexta até 30/10 | 438 |
| Vagas em sábados | 62 |
| Vagas a redistribuir ou substituir | 62 |

Os sábados encontrados são 12/09, 19/09, 26/09, 03/10, 10/10, 17/10, 24/10 e 31/10. A agenda só deve ser publicada após receber uma grade revisada com 500 horários válidos entre 08/09 e 30/10, de segunda a sexta-feira.

### 4.2 Divergência com a imagem de referência

A imagem da Radioclínica indica 20 agendamentos por dia nos horários 08:10, 08:40, 09:10, 09:30, 09:50, 13:00, 13:10, 13:20, 13:30, 13:45, 14:00, 14:10, 14:20, 14:30, 14:40, 14:50, 15:00, 15:10, 15:20 e 15:30.

A planilha apresenta horários diferentes, em geral entre 11:50 e 12:50 e entre 17:50 e 18:40 nos dias úteis, além de horários aos sábados. Por isso, nenhum dos dois materiais deve ser extrapolado ou mesclado automaticamente. A versão final aprovada da planilha deve prevalecer.

## 5. Pendências obrigatórias antes da publicação

1. Definir qual clínica, entre Pro-Imagem e IME, terá 1.000 vagas e qual terá 500 vagas.
2. Receber e validar as grades de horários da Pro-Imagem e do IME.
3. Receber a grade revisada da Radioclínica com 500 vagas válidas em dias úteis, até 30/10/2026.
4. Aprovar a antecedência, a quantidade de tentativas e os horários dos lembretes no EZ Chat.
5. Aprovar o texto final das mensagens de confirmação, cancelamento e lista de espera.

Essas pendências não impedem o desenvolvimento das regras gerais, mas impedem a publicação da agenda definitiva e o início seguro da operação.

## 6. Critérios de aceite

A solução poderá ser considerada pronta para operação quando:

- as três clínicas estiverem cadastradas com capacidade individual e total de 2.000;
- todas as vagas estiverem dentro da janela e em dias úteis;
- nenhuma clínica tiver vagas duplicadas para o mesmo horário;
- a soma de vagas por clínica corresponder à capacidade aprovada;
- oferta, reserva, expiração, confirmação e cancelamento passarem pelos testes de concorrência e idempotência;
- o fluxo "não poderei comparecer" exigir confirmação explícita e não cancelar por silêncio, erro ou resposta negativa;
- perfis e auditoria estiverem validados;
- relatório de carga e testes de ponta a ponta do EZ Chat estiverem aprovados.
