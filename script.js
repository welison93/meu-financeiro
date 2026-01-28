let transacoes = JSON.parse(localStorage.getItem('financas')) || [];
let cartoes = JSON.parse(localStorage.getItem('cartoes')) || [];
let cofrinhos = JSON.parse(localStorage.getItem('cofrinhos')) || [];
let categoriasSet = JSON.parse(localStorage.getItem('categoriasPersonalizadas')) || ["🍔 Alimentação", "🏠 Moradia", "🚗 Transporte", "🍿 Lazer", "💸 Receita"];
let saldoInicial = parseFloat(localStorage.getItem('saldoInicial')) || 0;
let configUser = JSON.parse(localStorage.getItem('configUser')) || null;
let meuGrafico;

// --- LOGIN ---
function inicializarLogin() {
    const boasVindas = document.getElementById('boas-vindas-user');
    const btn = document.getElementById('btn-login-acao');
    if (!configUser) {
        boasVindas.innerHTML = "Crie sua senha de acesso:";
        btn.onclick = () => {
            const s = document.getElementById('inputSenha').value;
            if(s.length < 2) return;
            configUser = { senha: s };
            localStorage.setItem('configUser', JSON.stringify(configUser));
            document.getElementById('tela-bloqueio').style.display = 'none';
            atualizarApp();
        };
    } else {
        boasVindas.innerHTML = "Digite sua senha:";
        btn.onclick = () => {
            if(document.getElementById('inputSenha').value === configUser.senha) {
                document.getElementById('tela-bloqueio').style.display = 'none';
                atualizarApp();
            } else { alert("Senha Errada!"); }
        };
    }
}

// --- DATA ---
function definirData(tipo, btn) {
    const input = document.getElementById('data');
    const d = new Date();
    document.querySelectorAll('.btn-date').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if(tipo === 'ontem') d.setDate(d.getDate() - 1);
    input.valueAsDate = d;
}
function abrirCalendario() { document.getElementById('data').showPicker(); }

// --- ASSISTENTE ---
const frases = [
    "Economizar não é sobre o quanto você ganha, mas sobre o quanto você guarda.",
    "O melhor momento para começar a poupar foi ontem. O segundo melhor é agora.",
    "Cuidado com os pequenos gastos; um pequeno vazamento afunda um grande navio.",
    "Não compre o que você não precisa com dinheiro que você não tem para impressionar pessoas que você não gosta."
];

function abrirDicasAssistente() {
    const gastosMes = transacoes.filter(t => t.tipo === 'gasto' && new Date(t.data + 'T00:00:00').getMonth() === new Date().getMonth()).reduce((s, t) => s + t.valor, 0);
    const fraseDia = frases[Math.floor(Math.random() * frases.length)];
    document.getElementById('msg-assistente').innerHTML = `<b>Dica do Dia:</b><br>"${fraseDia}"<br><br><b>Resumo:</b> Você já gastou R$ ${gastosMes.toFixed(2)} este mês.`;
    document.getElementById('modal-assistente').style.display = 'flex';
}
function fecharAssistente() { document.getElementById('modal-assistente').style.display = 'none'; }

// --- CORE ---
function adicionarTransacao() {
    const desc = document.getElementById('descricao').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const data = document.getElementById('data').value;
    if(!valor || !data) return;
    
    transacoes.unshift({
        id: Date.now(),
        descricao: desc || "Sem nome",
        valor, data,
        tipo: document.getElementById('tipo').value,
        categoria: document.getElementById('categoria').value
    });
    save();
}

function save() {
    localStorage.setItem('financas', JSON.stringify(transacoes));
    atualizarApp();
}

function atualizarApp() {
    let saldo = saldoInicial;
    let gastosMes = 0;
    let ganhosMes = 0;
    let gastosPorCat = {};
    const mes = new Date().getMonth();

    transacoes.forEach(t => {
        const tMes = new Date(t.data + 'T00:00:00').getMonth();
        if(t.tipo === 'ganho') {
            saldo += t.valor;
            if(tMes === mes) ganhosMes += t.valor;
        } else {
            if(!t.cartaoId) saldo -= t.valor;
            if(tMes === mes) {
                gastosMes += t.valor;
                gastosPorCat[t.categoria] = (gastosPorCat[t.categoria] || 0) + t.valor;
            }
        }
    });

    document.getElementById('saldo-topo').innerText = `R$ ${saldo.toFixed(2)}`;
    document.getElementById('gastos-mes-topo').innerText = `R$ ${gastosMes.toFixed(2)}`;
    document.getElementById('valor-economia').innerText = `R$ ${(ganhosMes - gastosMes).toFixed(2)}`;
    
    document.getElementById('categoria').innerHTML = categoriasSet.map(c => `<option value="${c}">${c}</option>`).join('');
    document.getElementById('lista-historico').innerHTML = transacoes.slice(0, 10).map(t => `
        <div class="hist-item">
            <div><b>${t.descricao}</b><br><small>${t.categoria}</small></div>
            <b style="color:${t.tipo==='ganho'?'var(--primary)':'var(--text)'}">R$ ${t.valor.toFixed(2)}</b>
        </div>
    `).join('');
    
    renderGrafico(gastosPorCat);
}

function renderGrafico(dados) {
    const ctx = document.getElementById('meuGrafico').getContext('2d');
    if(meuGrafico) meuGrafico.destroy();
    const labels = Object.keys(dados);
    if(labels.length === 0) return;
    meuGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: Object.values(dados), backgroundColor: ['#2dd4bf', '#3b82f6', '#fb7185', '#fbbf24'] }] },
        options: { plugins: { legend: { display: false } } }
    });
}

function abrirAba(id, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('data').valueAsDate = new Date();
    inicializarLogin();
});