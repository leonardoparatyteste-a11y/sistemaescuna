/**
 * data.js — Dados fictícios para demonstração
 * Calamar Flats — Painel Operacional
 *
 * Todos os nomes, telefones e dados são fictícios.
 */

const DadosDemonstracao = (function () {
  'use strict';

  // Data de hoje para calcular datas relativas
  const hoje = new Date();
  const yyyymmdd = (d) => d.toISOString().split('T')[0];
  const diasDepois = (n) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() + n);
    return yyyymmdd(d);
  };
  const diasAntes = (n) => diasDepois(-n);

  // ─── Flats ────────────────────────────────────────────────────────────────
  const flats = [
    { id: 'flat-01', numero: 'Flat 01', status: 'Pronto',              observacoes: '', checklist: checklistVazio() },
    { id: 'flat-02', numero: 'Flat 02', status: 'Aguardando limpeza',  observacoes: 'Checkout realizado às 10h', checklist: checklistVazio() },
    { id: 'flat-03', numero: 'Flat 03', status: 'Ocupado',             observacoes: '', checklist: checklistCompleto() },
    { id: 'flat-04', numero: 'Flat 04', status: 'Pronto',              observacoes: '', checklist: checklistCompleto() },
    { id: 'flat-05', numero: 'Flat 05', status: 'Em limpeza',          observacoes: 'Camareira Joana iniciou às 11h', checklist: checklistParcial() },
    { id: 'flat-06', numero: 'Flat 06', status: 'Ocupado',             observacoes: '', checklist: checklistCompleto() },
    { id: 'flat-07', numero: 'Flat 07', status: 'Bloqueado para manutenção', observacoes: 'Ar-condicionado com defeito', checklist: checklistVazio() },
    { id: 'flat-08', numero: 'Flat 08', status: 'Aguardando conferência', observacoes: 'Limpeza concluída, aguardando vistoria', checklist: checklistCompleto() },
  ];

  function checklistVazio() {
    return {
      roupaCama: false, toalhas: false, banheiro: false, cozinha: false,
      frigobar: false, televisao: false, arCondicionado: false, wifi: false,
      amenities: false, lixoRetirado: false, conferenciaFinal: false,
    };
  }

  function checklistCompleto() {
    return {
      roupaCama: true, toalhas: true, banheiro: true, cozinha: true,
      frigobar: true, televisao: true, arCondicionado: true, wifi: true,
      amenities: true, lixoRetirado: true, conferenciaFinal: true,
    };
  }

  function checklistParcial() {
    return {
      roupaCama: true, toalhas: true, banheiro: true, cozinha: false,
      frigobar: false, televisao: false, arCondicionado: false, wifi: false,
      amenities: false, lixoRetirado: true, conferenciaFinal: false,
    };
  }

  // ─── Reservas ─────────────────────────────────────────────────────────────
  const reservas = [
    {
      id: 'res-001',
      nomeHospede:       'Ana Paula Ferreira',
      flat:              'Flat 01',
      canal:             'Booking',
      dataEntrada:       diasAntes(2),
      dataSaida:         diasDepois(2),
      quantidadeHospedes: 2,
      horarioChegada:    '14:00',
      telefone:          '24999110001',
      statusPagamento:   'Pago',
      observacoes:       'Casal em viagem de aniversário. Pediu decoração surpresa.',
      statusMensagem:    'Enviada',
      criadoEm:          diasAntes(5) + 'T10:00:00.000Z',
      criadoPor:         'Gerente',
    },
    {
      id: 'res-002',
      nomeHospede:       'Carlos Eduardo Santos',
      flat:              'Flat 02',
      canal:             'Airbnb',
      dataEntrada:       diasAntes(3),
      dataSaida:         hoje.toISOString().split('T')[0], // checkout hoje
      quantidadeHospedes: 1,
      horarioChegada:    '15:00',
      telefone:          '21988220002',
      statusPagamento:   'Pago',
      observacoes:       'Hóspede a trabalho. Chegou atrasado no dia da entrada.',
      statusMensagem:    'Enviada',
      criadoEm:          diasAntes(7) + 'T09:30:00.000Z',
      criadoPor:         'Recepção',
    },
    {
      id: 'res-003',
      nomeHospede:       'Mariana Costa Andrade',
      flat:              'Flat 03',
      canal:             'Reserva direta',
      dataEntrada:       diasAntes(1),
      dataSaida:         diasDepois(3),
      quantidadeHospedes: 3,
      horarioChegada:    '16:00',
      telefone:          '24997330003',
      statusPagamento:   'Parcialmente pago',
      observacoes:       'Família com criança pequena. Solicitou berço.',
      statusMensagem:    'Enviada',
      criadoEm:          diasAntes(6) + 'T14:00:00.000Z',
      criadoPor:         'Gerente',
    },
    {
      id: 'res-004',
      nomeHospede:       'João Roberto Alves',
      flat:              'Flat 05',
      canal:             'Omnibees',
      dataEntrada:       hoje.toISOString().split('T')[0], // chegada hoje
      dataSaida:         diasDepois(4),
      quantidadeHospedes: 2,
      horarioChegada:    '14:00',
      telefone:          '11977440004',
      statusPagamento:   'Pendente',
      observacoes:       '',
      statusMensagem:    'Não enviada',
      criadoEm:          diasAntes(4) + 'T11:00:00.000Z',
      criadoPor:         'Recepção',
    },
    {
      id: 'res-005',
      nomeHospede:       'Patrícia Lima Sousa',
      flat:              'Flat 06',
      canal:             'Booking',
      dataEntrada:       diasAntes(1),
      dataSaida:         diasDepois(5),
      quantidadeHospedes: 4,
      horarioChegada:    '13:00',
      telefone:          '21966550005',
      statusPagamento:   'Pago',
      observacoes:       'Grupo de amigas. Chegam de carro.',
      statusMensagem:    'Enviada',
      criadoEm:          diasAntes(10) + 'T08:00:00.000Z',
      criadoPor:         'Gerente',
    },
    {
      id: 'res-006',
      nomeHospede:       'Fernando Souza Braga',
      flat:              'Flat 04',
      canal:             'Reserva direta',
      dataEntrada:       hoje.toISOString().split('T')[0], // chegada hoje
      dataSaida:         diasDepois(2),
      quantidadeHospedes: 2,
      horarioChegada:    '',   // sem horário — vai gerar alerta
      telefone:          '24988660006',
      statusPagamento:   'Pago',
      observacoes:       'Hóspede antigo. Não confirmou horário de chegada.',
      statusMensagem:    'Não enviada',
      criadoEm:          diasAntes(3) + 'T15:30:00.000Z',
      criadoPor:         'Gerente',
    },
  ];

  // ─── Manutenção ───────────────────────────────────────────────────────────
  const manutencao = [
    {
      id: 'man-001',
      flat:          'Flat 07',
      titulo:        'Ar-condicionado não liga',
      descricao:     'Unidade interna do ar-condicionado apresentou falha elétrica. Não responde ao controle remoto.',
      prioridade:    'Urgente',
      data:          diasAntes(1),
      responsavel:   'Técnico Evandro',
      status:        'Em andamento',
      custoEstimado: 450,
      observacoes:   'Técnico visitou ontem e precisa voltar com peça. Flat bloqueado.',
      criadoEm:      diasAntes(1) + 'T08:00:00.000Z',
      criadoPor:     'Gerente',
    },
    {
      id: 'man-002',
      flat:          'Flat 03',
      titulo:        'Chuveiro com pressão baixa',
      descricao:     'Hóspede reclamou da pressão do chuveiro. Registro do banheiro pode estar fechado.',
      prioridade:    'Média',
      data:          hoje.toISOString().split('T')[0],
      responsavel:   'Faxineira Joana',
      status:        'Em análise',
      custoEstimado: 0,
      observacoes:   'Verificar registro antes de chamar encanador.',
      criadoEm:      hoje.toISOString().split('T')[0] + 'T09:15:00.000Z',
      criadoPor:     'Recepção',
    },
    {
      id: 'man-003',
      flat:          'Flat 01',
      titulo:        'Troca de torneira da pia',
      descricao:     'Torneira da pia da cozinha com vazamento leve. Rosca gasta.',
      prioridade:    'Baixa',
      data:          diasAntes(5),
      responsavel:   'Técnico Evandro',
      status:        'Resolvido',
      custoEstimado: 120,
      observacoes:   'Torneira trocada. Custo real: R$ 110,00.',
      criadoEm:      diasAntes(5) + 'T14:00:00.000Z',
      criadoPor:     'Gerente',
    },
    {
      id: 'man-004',
      flat:          'Flat 05',
      titulo:        'Lâmpada do banheiro queimada',
      descricao:     'Lâmpada LED do banheiro principal precisando de troca.',
      prioridade:    'Baixa',
      data:          hoje.toISOString().split('T')[0],
      responsavel:   '',
      status:        'Aberto',
      custoEstimado: 25,
      observacoes:   '',
      criadoEm:      hoje.toISOString().split('T')[0] + 'T07:30:00.000Z',
      criadoPor:     'Limpeza',
    },
  ];

  // ─── Tarefas ──────────────────────────────────────────────────────────────
  const tarefas = [
    {
      id: 'tar-001',
      titulo:      'Comprar amenities para reposição',
      descricao:   'Estoque de shampoo, condicionador e sabonete para os flats. Mínimo 20 unidades de cada.',
      prazo:       diasDepois(1),
      prioridade:  'Alta',
      responsavel: 'Gerente',
      categoria:   'Compras',
      status:      'Pendente',
      criadoEm:    diasAntes(1) + 'T09:00:00.000Z',
      criadoPor:   'Gerente',
    },
    {
      id: 'tar-002',
      titulo:      'Verificar café da manhã',
      descricao:   'Conferir itens do café da manhã: pão, frios, frutas, sucos e café. Repor o que estiver faltando.',
      prazo:       hoje.toISOString().split('T')[0],
      prioridade:  'Alta',
      responsavel: 'Recepção',
      categoria:   'Atendimento ao hóspede',
      status:      'Concluída',
      criadoEm:    hoje.toISOString().split('T')[0] + 'T06:00:00.000Z',
      criadoPor:   'Gerente',
      concluidaEm: hoje.toISOString().split('T')[0] + 'T08:30:00.000Z',
    },
    {
      id: 'tar-003',
      titulo:      'Enviar mensagem de check-in para João Alves',
      descricao:   'Enviar instruções de acesso, localização e senha do Wi-Fi para o hóspede do Flat 05.',
      prazo:       hoje.toISOString().split('T')[0],
      prioridade:  'Alta',
      responsavel: 'Recepção',
      categoria:   'Recepção',
      status:      'Pendente',
      criadoEm:    hoje.toISOString().split('T')[0] + 'T07:00:00.000Z',
      criadoPor:   'Sistema',
    },
    {
      id: 'tar-004',
      titulo:      'Renovar contrato com fornecedor de gás',
      descricao:   'Contrato de fornecimento de gás venceu. Ligar para a distribuidora e renovar.',
      prazo:       diasAntes(2), // VENCIDA
      prioridade:  'Média',
      responsavel: 'Gerente',
      categoria:   'Administrativo',
      status:      'Pendente',
      criadoEm:    diasAntes(7) + 'T10:00:00.000Z',
      criadoPor:   'Gerente',
    },
    {
      id: 'tar-005',
      titulo:      'Reunião semanal com equipe de limpeza',
      descricao:   'Alinhamento de rotina, feedbacks e escala da próxima semana.',
      prazo:       diasDepois(3),
      prioridade:  'Média',
      responsavel: 'Gerente',
      categoria:   'Administrativo',
      status:      'Pendente',
      criadoEm:    diasAntes(1) + 'T16:00:00.000Z',
      criadoPor:   'Gerente',
    },
    {
      id: 'tar-006',
      titulo:      'Limpeza do deck da piscina',
      descricao:   'Limpeza geral do deck: varrer, lavar e aplicar produto antiderrapante.',
      prazo:       diasDepois(2),
      prioridade:  'Baixa',
      responsavel: 'Limpeza',
      categoria:   'Limpeza',
      status:      'Pendente',
      criadoEm:    diasAntes(1) + 'T11:00:00.000Z',
      criadoPor:   'Gerente',
    },
  ];

  // ─── Solicitações de hóspedes ─────────────────────────────────────────────
  const solicitacoes = [
    {
      id: 'sol-001',
      nomeHospede: 'Ana Paula Ferreira',
      flat:        'Flat 01',
      horario:     '09:15',
      tipo:        'Toalhas extras',
      descricao:   'Hóspede solicitou 2 toalhas de banho extras.',
      responsavel: 'Limpeza',
      status:      'Resolvida',
      solucao:     'Toalhas entregues às 09h45.',
      criadoEm:    hoje.toISOString().split('T')[0] + 'T09:15:00.000Z',
      criadoPor:   'Recepção',
    },
    {
      id: 'sol-002',
      nomeHospede: 'Mariana Costa Andrade',
      flat:        'Flat 03',
      horario:     '10:30',
      tipo:        'Manutenção',
      descricao:   'Chuveiro com pressão fraca, conforme relatado pelo hóspede.',
      responsavel: 'Gerente',
      status:      'Em andamento',
      solucao:     '',
      criadoEm:    hoje.toISOString().split('T')[0] + 'T10:30:00.000Z',
      criadoPor:   'Recepção',
    },
    {
      id: 'sol-003',
      nomeHospede: 'Patrícia Lima Sousa',
      flat:        'Flat 06',
      horario:     '11:00',
      tipo:        'Informação turística',
      descricao:   'Grupo perguntou sobre passeios de escuna e restaurantes em Paraty.',
      responsavel: 'Recepção',
      status:      'Resolvida',
      solucao:     'Enviadas indicações por WhatsApp e entregue folder de passeios.',
      criadoEm:    hoje.toISOString().split('T')[0] + 'T11:00:00.000Z',
      criadoPor:   'Recepção',
    },
    {
      id: 'sol-004',
      nomeHospede: 'Patrícia Lima Sousa',
      flat:        'Flat 06',
      horario:     '14:20',
      tipo:        'Pedido especial',
      descricao:   'Grupo pediu uma cama extra para a quinta pessoa do grupo (chegou surpresa).',
      responsavel: '',
      status:      'Pendente',
      solucao:     '',
      criadoEm:    hoje.toISOString().split('T')[0] + 'T14:20:00.000Z',
      criadoPor:   'Recepção',
    },
    {
      id: 'sol-005',
      nomeHospede: 'Ana Paula Ferreira',
      flat:        'Flat 01',
      horario:     '16:45',
      tipo:        'Elogio',
      descricao:   'Hóspede elogiou a decoração e o atendimento da recepção. Disse que vai indicar para os amigos.',
      responsavel: '',
      status:      'Registrada',
      solucao:     '',
      criadoEm:    hoje.toISOString().split('T')[0] + 'T16:45:00.000Z',
      criadoPor:   'Recepção',
    },
  ];

  // ─── Histórico inicial ────────────────────────────────────────────────────
  const historico = [
    {
      id: 'hist-001',
      timestamp: hoje.toISOString().split('T')[0] + 'T08:30:00.000Z',
      usuario:   'Limpeza',
      modulo:    'flats',
      item:      'Flat 01',
      campo:     'status',
      anterior:  'Aguardando limpeza',
      novo:      'Pronto',
    },
    {
      id: 'hist-002',
      timestamp: hoje.toISOString().split('T')[0] + 'T09:45:00.000Z',
      usuario:   'Limpeza',
      modulo:    'solicitacoes',
      item:      'Toalhas extras — Flat 01',
      campo:     'status',
      anterior:  'Pendente',
      novo:      'Resolvida',
    },
    {
      id: 'hist-003',
      timestamp: hoje.toISOString().split('T')[0] + 'T10:00:00.000Z',
      usuario:   'Recepção',
      modulo:    'reservas',
      item:      'Carlos Eduardo Santos',
      campo:     'statusMensagem',
      anterior:  'Não enviada',
      novo:      'Enviada',
    },
  ];

  // ─── Transações Financeiras (Mock) ─────────────────────────────────────────
  const transacoes = [
    { id: 'trans-001', tipo: 'Despesa', data: diasAntes(4), categoria: 'Manutenção', valor: 110, descricao: 'Pagamento da torneira trocada no Flat 01' },
    { id: 'trans-002', tipo: 'Receita', data: diasAntes(2), categoria: 'Reserva direta', valor: 600, descricao: 'Sinal da reserva direta de Ana Paula Ferreira' },
    { id: 'trans-003', tipo: 'Despesa', data: diasAntes(1), categoria: 'Compras', valor: 85, descricao: 'Sabonete e amenities para reposição' },
    { id: 'trans-004', tipo: 'Receita', data: hoje.toISOString().split('T')[0], categoria: 'Reserva direta', valor: 450, descricao: 'Saldo da reserva de Mariana Costa Andrade' },
    { id: 'trans-005', tipo: 'Despesa', data: diasAntes(10), categoria: 'Administrativo', valor: 1200, descricao: 'Conta de luz da hospedagem' },
    { id: 'trans-006', tipo: 'Receita', data: diasAntes(5), categoria: 'Reservas', valor: 1800, descricao: 'Repasse Booking.com quinzenal' }
  ];

  // ─── Metas Financeiras e Ocupação (Mock) ──────────────────────────────────
  const metas = [
    { id: 'meta-001', mes: hoje.toISOString().substring(0, 7), metaFaturamento: 15000, metaOcupacao: 70 }
  ];

  // ─── Cronograma de Marketing Digital (Mock) ───────────────────────────────
  const marketing = [
    { id: 'mkt-001', data: hoje.toISOString().split('T')[0], canal: 'Instagram', tipo: 'Story', titulo: 'Bom dia Paraty! Centro Histórico', descricao: 'Foto bonita das ruas de pedra de Paraty sob o sol da manhã', status: 'Postado', horario: '09:00' },
    { id: 'mkt-002', data: diasDepois(1), canal: 'Instagram', tipo: 'Reels', titulo: 'Tour Completo Flat 04', descricao: 'Mostrar a decoração, enxoval macio e banheiro impecável para novos hóspedes', status: 'Agendado', horario: '18:00' },
    { id: 'mkt-003', data: diasDepois(3), canal: 'Facebook', tipo: 'Feed', titulo: 'Promoção Meio de Semana', descricao: 'Post divulgando 15% de desconto nas diárias de terça a quinta para agosto', status: 'Ideia', horario: '11:30' },
    { id: 'mkt-004', data: diasDepois(5), canal: 'WhatsApp Status', tipo: 'Story', titulo: 'Vaga de última hora para final de semana', descricao: 'Avisar clientes VIP do whatsapp que o Flat 02 liberou após cancelamento', status: 'Ideia', horario: '14:00' }
  ];

  // ─── Tarifas e Revenue Management (Mock) ──────────────────────────────────
  const tarifas = {
    base: [
      { categoria: 'Térreo (Flats 1, 3, 4)', flats: ['Flat 01', 'Flat 03', 'Flat 04'], valor: 250 },
      { categoria: 'Família (Flat 2)',       flats: ['Flat 02'], valor: 350 },
      { categoria: 'Superior (Flats 6, 7)',  flats: ['Flat 06', 'Flat 07'], valor: 280 },
      { categoria: 'Com Varanda (Flat 8)',   flats: ['Flat 08'], valor: 320 },
      { categoria: 'Vista para o Mar (Flat 5)', flats: ['Flat 05'], valor: 400 },
    ],
    regras: [
      { maxOcupacao: 30, aumentoPercentual: 0 },
      { maxOcupacao: 60, aumentoPercentual: 10 },
      { maxOcupacao: 99, aumentoPercentual: 20 },
      { maxOcupacao: 100, aumentoPercentual: 0 }, // 100% indisponível, aumento irrelevante
    ]
  };

  // ─── Estoque (Mock) ──────────────────────────────────────────────────────
  const estoque = [
    // Amenities
    { id: 'est-001', nome: 'Shampô individual', categoria: 'Amenities', unidade: 'un', quantidade: 8,  minimo: 20, custo: 2.50,  fornecedor: 'Dist. Beleza Sul',   criadoEm: new Date().toISOString(), criadoPor: 'Sistema' },
    { id: 'est-002', nome: 'Condicionador individual', categoria: 'Amenities', unidade: 'un', quantidade: 6, minimo: 20, custo: 2.50, fornecedor: 'Dist. Beleza Sul', criadoEm: new Date().toISOString(), criadoPor: 'Sistema' },
    { id: 'est-003', nome: 'Sabonete barra', categoria: 'Amenities', unidade: 'un', quantidade: 32, minimo: 20, custo: 1.80, fornecedor: 'Dist. Beleza Sul',   criadoEm: new Date().toISOString(), criadoPor: 'Sistema' },
    { id: 'est-004', nome: 'Papel higiênico (rolo)', categoria: 'Amenities', unidade: 'rolo', quantidade: 48, minimo: 30, custo: 1.20, fornecedor: 'Atacadão',    criadoEm: new Date().toISOString(), criadoPor: 'Sistema' },
    { id: 'est-005', nome: 'Capçinha de chuveiro', categoria: 'Amenities', unidade: 'un', quantidade: 3, minimo: 10, custo: 0.50, fornecedor: 'Dist. Beleza Sul',   criadoEm: new Date().toISOString(), criadoPor: 'Sistema' },
    // Cama e banho
    { id: 'est-006', nome: 'Toalha de banho', categoria: 'Cama e banho', unidade: 'un', quantidade: 24, minimo: 16, custo: 35.00, fornecedor: 'Têxtil Paraty', criadoEm: new Date().toISOString(), criadoPor: 'Sistema' },
    { id: 'est-007', nome: 'Toalha de rosto', categoria: 'Cama e banho', unidade: 'un', quantidade: 22, minimo: 16, custo: 18.00, fornecedor: 'Têxtil Paraty', criadoEm: new Date().toISOString(), criadoPor: 'Sistema' },
    { id: 'est-008', nome: 'Fronha casal', categoria: 'Cama e banho', unidade: 'par', quantidade: 12, minimo: 8, custo: 22.00, fornecedor: 'Têxtil Paraty',  criadoEm: new Date().toISOString(), criadoPor: 'Sistema' },
    { id: 'est-009', nome: 'Lçol de cama casal', categoria: 'Cama e banho', unidade: 'jogo', quantidade: 9, minimo: 8, custo: 75.00, fornecedor: 'Têxtil Paraty', criadoEm: new Date().toISOString(), criadoPor: 'Sistema' },
    // Copa/cozinha
    { id: 'est-010', nome: 'Café em pó (500g)', categoria: 'Copa', unidade: 'pct', quantidade: 4, minimo: 3, custo: 14.00, fornecedor: 'Atacadão',         criadoEm: new Date().toISOString(), criadoPor: 'Sistema' },
    { id: 'est-011', nome: 'Açúcar (500g)', categoria: 'Copa', unidade: 'pct', quantidade: 5, minimo: 4, custo: 4.50, fornecedor: 'Atacadão',              criadoEm: new Date().toISOString(), criadoPor: 'Sistema' },
    { id: 'est-012', nome: 'Cápsula de café (cx 10)', categoria: 'Copa', unidade: 'cx', quantidade: 2, minimo: 5, custo: 22.00, fornecedor: 'Café do Porto', criadoEm: new Date().toISOString(), criadoPor: 'Sistema' },
    // Limpeza
    { id: 'est-013', nome: 'Detergente neutro', categoria: 'Limpeza', unidade: 'un', quantidade: 7, minimo: 5, custo: 3.50, fornecedor: 'Atacadão',            criadoEm: new Date().toISOString(), criadoPor: 'Sistema' },
    { id: 'est-014', nome: 'Desinfetante (1L)', categoria: 'Limpeza', unidade: 'un', quantidade: 3, minimo: 4, custo: 6.80, fornecedor: 'Atacadão',             criadoEm: new Date().toISOString(), criadoPor: 'Sistema' },
    { id: 'est-015', nome: 'Saco de lixo 60L (pct)', categoria: 'Limpeza', unidade: 'pct', quantidade: 6, minimo: 4, custo: 8.90, fornecedor: 'Atacadão',      criadoEm: new Date().toISOString(), criadoPor: 'Sistema' },
    { id: 'est-016', nome: 'Lâmpada LED 9W', categoria: 'Manutenção', unidade: 'un', quantidade: 2, minimo: 6, custo: 12.00, fornecedor: 'Eletro Paraty',   criadoEm: new Date().toISOString(), criadoPor: 'Sistema' },
  ];

  // ─── Carregamento ─────────────────────────────────────────────────────────
  return {
    /**
     * Inicializa o Store com dados de demonstração.
     * Só executa se o storage estiver vazio.
     */
    inicializar() {
      if (!Store.estaVazio()) return; // dados já existem, não sobrescreve

      Store.definir('flats',        flats.map(f => ({ ...f, criadoEm: new Date().toISOString(), criadoPor: 'Sistema' })));
      Store.definir('reservas',     reservas);
      Store.definir('manutencao',   manutencao);
      Store.definir('tarefas',      tarefas);
      Store.definir('solicitacoes', solicitacoes);
      Store.definir('historico',    historico);
      Store.definir('transacoes',   transacoes);
      Store.definir('metas',        metas);
      Store.definir('marketing',    marketing);
      Store.definir('tarifas',      tarifas);
      Store.definir('estoque',      estoque);

      console.log('[Demo] Dados fictícios carregados com sucesso.');
    },

    /** Limpa TUDO e recarrega os dados de demonstração (botão de reset) */
    resetar() {
      ['flats','reservas','manutencao','tarefas','solicitacoes','historico','transacoes','metas','marketing','tarifas','estoque'].forEach(k => {
        localStorage.removeItem('calamar_' + k);
      });
      Store.definir('flats',        flats.map(f => ({ ...f, criadoEm: new Date().toISOString(), criadoPor: 'Sistema' })));
      Store.definir('reservas',     reservas);
      Store.definir('manutencao',   manutencao);
      Store.definir('tarefas',      tarefas);
      Store.definir('solicitacoes', solicitacoes);
      Store.definir('historico',    historico);
      Store.definir('transacoes',   transacoes);
      Store.definir('metas',        metas);
      Store.definir('marketing',    marketing);
      Store.definir('tarifas',      tarifas);
      Store.definir('estoque',      estoque);
    },

    /** Retorna lista de flats (para uso em formulários) */
    listaFlats() {
      return ['Flat 01','Flat 02','Flat 03','Flat 04','Flat 05','Flat 06','Flat 07','Flat 08'];
    },
  };
})();
