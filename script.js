let transacoes = JSON.parse(localStorage.getItem('financas')) || [];
let cartoes = JSON.parse(localStorage.getItem('cartoes')) || [];
let configUser = JSON.parse(localStorage.getItem('configUser')) || null;
let saldoInicial = parseFloat(localStorage.getItem('saldoInicial')) || 0;
let categoriasSet = ["🍔 Alimentação", "🏠 Moradia", "🚗 Transporte", "🍿 Lazer", "💸 Receita", "🛒 Mercado"];
let meuGrafico;

// --- LOGIN ---
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

// RESET DE EMERGÊNCIA (5 cliques no logo)
let logoClicks = 0;
document.getElementById('logo-main').onclick = () => {
    logoClicks++;
    if(logoClicks === 5) {
        if(confirm("Resetar senha? (Dados salvos)")) {
            localStorage.removeItem('configUser');
            location.reload();
        }
        logoClicks = 0;
    }
};

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

// --- TRANSAÇÕES ---
function adicionarTransacao() {
    const v = parseFloat(document.getElementById('valor').value);
    const d = document.getElementById('data').value;
    const desc = document.getElementById('descricao').value;
    if(!v || !d) return alert("Preencha valor e data!");

    transacoes.unshift({
        id: Date.now(),
        descricao: desc || "Sem nome",
        valor: v, data: d,
        tipo: document.getElementById('tipo').value,
        categoria: document.getElementById('categoria').value
    });
    localStorage.setItem('financas', JSON.stringify(transacoes));
    document.getElementById('valor').value = "";
    document.getElementById('descricao').value = "";
    atualizarApp();
}

function atualizarApp() {
    let saldo = saldoInicial;
    let gastosMes = 0;
    let gastosPorCat = {};
    const mes = new Date().getMonth();

    transacoes.forEach(t => {
        const tMes = new Date(t.data + 'T00:00:00').getMonth();
        if(t.tipo === 'ganho') {
            saldo += t.valor;
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
        data: { labels, datasets: [{ data: Object.values(dados), backgroundColor: ['#2dd4bf', '#3b82f6', '#fb7185', '#fbbf24', '#a855f7'] }] },
        options: { plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } }
    });
}

function abrirAba(id, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
}

function salvarSaldoInicial() {
    saldoInicial = parseFloat(document.getElementById('inputSaldoInicial').value) || 0;
    localStorage.setItem('saldoInicial', saldoInicial);
    atualizarApp();
    alert("Saldo Atualizado!");
}

// SERVICE WORKER
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => console.log("PWA Ativo"));
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('data').valueAsDate = new Date();
    inicializarLogin();
});
