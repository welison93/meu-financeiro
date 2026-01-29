// --- ESTADO GLOBAL ---
let transacoes = JSON.parse(localStorage.getItem('financas')) || [];
let cartoes = JSON.parse(localStorage.getItem('cartoes')) || [];
let cofrinhos = JSON.parse(localStorage.getItem('cofrinhos')) || [];
let configUser = JSON.parse(localStorage.getItem('configUser')) || null;
let saldoInicial = parseFloat(localStorage.getItem('saldoInicial')) || 0;
let categoriasSet = ["🍔 Alimentação", "🏠 Moradia", "🚗 Transporte", "🍿 Lazer", "💸 Receita", "🛒 Mercado"];
let meuGrafico;

// --- INICIALIZAÇÃO E LOGIN ---
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('data')) document.getElementById('data').valueAsDate = new Date();
    inicializarLogin();
    
    // Reset de emergência (5 cliques no logo)
    const logo = document.getElementById('logo-main');
    let logoClicks = 0;
    if(logo) {
        logo.onclick = () => {
            logoClicks++;
            if(logoClicks === 5) {
                if(confirm("Deseja resetar a senha? Seus dados serão mantidos.")) {
                    localStorage.removeItem('configUser');
                    location.reload();
                }
                logoClicks = 0;
            }
        };
    }
});

function inicializarLogin() {
    const boasVindas = document.getElementById('boas-vindas-user');
    const btn = document.getElementById('btn-login-acao');
    const campo = document.getElementById('inputSenha');

    if (!configUser) {
        boasVindas.innerHTML = "Crie uma senha de acesso:";
        btn.innerText = "CRIAR CONTA";
        btn.onclick = () => {
            if(campo.value.length < 2) return alert("Senha muito curta!");
            configUser = { senha: campo.value };
            localStorage.setItem('configUser', JSON.stringify(configUser));
            document.getElementById('tela-bloqueio').style.display = 'none';
            atualizarApp();
        };
    } else {
        boasVindas.innerHTML = "Digite sua senha:";
        btn.onclick = () => {
            if(campo.value === configUser.senha) {
                document.getElementById('tela-bloqueio').style.display = 'none';
                atualizarApp();
            } else { alert("Senha incorreta!"); }
        };
    }
}

// --- FUNÇÕES DE NAVEGAÇÃO ---
function abrirAba(id, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
    if(id === 'relatorios') setTimeout(renderGrafico, 100);
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
}

// --- LÓGICA DE DATA ---
function definirData(tipo, btn) {
    const input = document.getElementById('data');
    const d = new Date();
    document.querySelectorAll('.btn-date').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if(tipo === 'ontem') d.setDate(d.getDate() - 1);
    input.valueAsDate = d;
}
function abrirCalendario() { document.getElementById('data').showPicker(); }

// --- GESTÃO DE TRANSAÇÕES ---
function adicionarTransacao() {
    const v = parseFloat(document.getElementById('valor').value);
    const d = document.getElementById('data').value;
    const desc = document.getElementById('descricao').value;
    const tipo = document.getElementById('tipo').value;
    const cat = document.getElementById('categoria').value;

    if(!v || !d) return alert("Preencha valor e data!");

    transacoes.unshift({
        id: Date.now(),
        descricao: desc || "Sem nome",
        valor: v, data: d, tipo: tipo, categoria: cat
    });
    
    salvarDados();
    document.getElementById('valor').value = "";
    document.getElementById('descricao').value = "";
    atualizarApp();
}

function excluirTransacao(id) {
    if(confirm("Excluir este lançamento?")) {
        transacoes = transacoes.filter(t => t.id !== id);
        salvarDados();
        atualizarApp();
    }
}

// --- GESTÃO DE CARTÕES ---
function adicionarNovoCartao() {
    const nome = document.getElementById('nome-cartao').value;
    const limite = parseFloat(document.getElementById('limite-cartao').value);
    const venc = document.getElementById('vencimento-cartao').value;

    if(!nome || !limite) return alert("Preencha os dados do cartão!");

    cartoes.push({
        id: Date.now(),
        nome: nome,
        limite: limite,
        vencimento: venc
    });

    salvarDados();
    document.getElementById('nome-cartao').value = "";
    document.getElementById('limite-cartao').value = "";
    atualizarApp();
}

function lancarCompraParcelada() {
    const cartaoId = document.getElementById('select-cartao-compra').value;
    const desc = document.getElementById('desc-parcela').value;
    const valorTotal = parseFloat(document.getElementById('valor-total-parcela').value);
    const qtd = parseInt(document.getElementById('qtd-parcelas').value);

    if(!cartaoId || !valorTotal || !qtd) return alert("Preencha os dados da compra!");

    const valorParcela = valorTotal / qtd;
    let dataBase = new Date();

    for(let i = 0; i < qtd; i++) {
        let dataParcela = new Date(dataBase);
        dataParcela.setMonth(dataBase.getMonth() + i);
        
        transacoes.unshift({
            id: Date.now() + i,
            descricao: `${desc} (${i+1}/${qtd})`,
            valor: valorParcela,
            data: dataParcela.toISOString().split('T')[0],
            tipo: 'gasto',
            categoria: "💳 Cartão",
            cartaoId: cartaoId
        });
    }

    salvarDados();
    alert("Parcelas lançadas com sucesso!");
    atualizarApp();
}

// --- ASSISTENTE DE IA ---
function abrirDicasAssistente() {
    const frases = [
        "Economizar não é sobre o quanto você ganha, mas sobre o quanto você guarda.",
        "Cuidado com os pequenos gastos; um pequeno vazamento afunda um grande navio.",
        "Não compre o que você não precisa com dinheiro que você não tem."
    ];
    
    const mesAtual = new Date().getMonth();
    const gastosMes = transacoes
        .filter(t => t.tipo === 'gasto' && new Date(t.data + 'T00:00:00').getMonth() === mesAtual)
        .reduce((s, t) => s + t.valor, 0);

    const fraseDia = frases[Math.floor(Math.random() * frases.length)];
    
    document.getElementById('msg-assistente').innerHTML = `
        <b>Dica do Gestor Pro:</b><br>"${fraseDia}"<br><br>
        <b>Seu resumo:</b> Este mês você já gastou <b>R$ ${gastosMes.toFixed(2)}</b>.
    `;
    document.getElementById('modal-assistente').style.display = 'flex';
}

function fecharAssistente() {
    document.getElementById('modal-assistente').style.display = 'none';
}

// --- ATUALIZAÇÃO DA INTERFACE ---
function atualizarApp() {
    let saldo = saldoInicial;
    let gastosMes = 0;
    let ganhosMes = 0;
    let gastosPorCat = {};
    const mesAtual = new Date().getMonth();

    transacoes.forEach(t => {
        const tData = new Date(t.data + 'T00:00:00');
        if(t.tipo === 'ganho') {
            saldo += t.valor;
            if(tData.getMonth() === mesAtual) ganhosMes += t.valor;
        } else {
            if(!t.cartaoId) saldo -= t.valor;
            if(tData.getMonth() === mesAtual) {
                gastosMes += t.valor;
                gastosPorCat[t.categoria] = (gastosPorCat[t.categoria] || 0) + t.valor;
            }
        }
    });

    // Topo
    document.getElementById('saldo-topo').innerText = `R$ ${saldo.toFixed(2)}`;
    document.getElementById('gastos-mes-topo').innerText = `R$ ${gastosMes.toFixed(2)}`;
    
    // Relatórios
    const econ = ganhosMes - gastosMes;
    if(document.getElementById('valor-economia')) {
        document.getElementById('valor-economia').innerText = `R$ ${econ.toFixed(2)}`;
        document.getElementById('valor-economia').style.color = econ >= 0 ? 'var(--primary)' : 'var(--danger)';
    }

    // Histórico
    document.getElementById('lista-historico').innerHTML = transacoes.slice(0, 15).map(t => `
        <div class="hist-item">
            <div><b>${t.descricao}</b><br><small>${t.categoria}</small></div>
            <div style="text-align:right">
                <b style="color:${t.tipo==='ganho'?'var(--primary)':'var(--text)'}">R$ ${t.valor.toFixed(2)}</b><br>
                <i class="fas fa-trash" style="color:var(--danger); font-size:0.8rem; cursor:pointer" onclick="excluirTransacao(${t.id})"></i>
            </div>
        </div>
    `).join('');

    // Selects
    document.getElementById('categoria').innerHTML = categoriasSet.map(c => `<option value="${c}">${c}</option>`).join('');
    
    const selectCartao = document.getElementById('select-cartao-compra');
    if(selectCartao) {
        selectCartao.innerHTML = `<option value="">Selecione o Cartão</option>` + 
            cartoes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    }

    // Lista de Cartões
    const listaCartoes = document.getElementById('lista-cartoes-container');
    if(listaCartoes) {
        listaCartoes.innerHTML = cartoes.map(c => {
            const gastoCartao = transacoes
                .filter(t => t.cartaoId == c.id && new Date(t.data + 'T00:00:00').getMonth() === mesAtual)
                .reduce((s, t) => s + t.valor, 0);
            return `
                <div class="config-card" style="margin-bottom:10px">
                    <b>${c.nome}</b> <small>(Vence dia ${c.vencimento})</small><br>
                    <small>Gasto no mês: R$ ${gastoCartao.toFixed(2)} / Limite: R$ ${c.limite.toFixed(2)}</small>
                    <div style="background:#444; height:5px; border-radius:5px; margin-top:5px">
                        <div style="background:var(--primary); height:100%; width:${Math.min((gastoCartao/c.limite)*100, 100)}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderGrafico(gastosPorCat);
}

function renderGrafico(dados) {
    const canvas = document.getElementById('meuGrafico');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(meuGrafico) meuGrafico.destroy();
    
    const labels = Object.keys(dados || {});
    if(labels.length === 0) return;

    meuGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: Object.values(dados),
                backgroundColor: ['#2dd4bf', '#3b82f6', '#fb7185', '#fbbf24', '#a855f7', '#f97316']
            }]
        },
        options: { plugins: { legend: { display: false } } }
    });
}

function salvarDados() {
    localStorage.setItem('financas', JSON.stringify(transacoes));
    localStorage.setItem('cartoes', JSON.stringify(cartoes));
    localStorage.setItem('cofrinhos', JSON.stringify(cofrinhos));
}

function salvarSaldoInicial() {
    const val = parseFloat(document.getElementById('inputSaldoInicial').value);
    saldoInicial = val || 0;
    localStorage.setItem('saldoInicial', saldoInicial);
    alert("Saldo atualizado!");
    atualizarApp();
}

function limparDados() {
    if(confirm("Deseja apagar TODOS os dados? Esta ação não pode ser desfeita.")) {
        localStorage.clear();
        location.reload();
    }
}
