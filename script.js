let transacoes = JSON.parse(localStorage.getItem('financas')) || [];
let metas = JSON.parse(localStorage.getItem('metas')) || {};
let cartoes = JSON.parse(localStorage.getItem('cartoes')) || [];
let saldoInicial = parseFloat(localStorage.getItem('saldoInicial')) || 0;
let configUser = JSON.parse(localStorage.getItem('configUser')) || null;
let categoriasSet = JSON.parse(localStorage.getItem('categoriasPersonalizadas')) || [];
let coresCategorias = JSON.parse(localStorage.getItem('coresCategorias')) || {};
let meuGrafico, idEdicao = null;

// --- LOGIN ---
if (configUser) document.getElementById('boas-vindas-user').innerHTML = `<p style="color:var(--text-dim)">Olá, <b style="color:#fff">${configUser.nome}</b></p>`;
function mostrarCadastro() { document.getElementById('modal-cadastro').style.display = 'flex'; }
function salvarCadastro() {
    const n = document.getElementById('novoUser').value, s = document.getElementById('novaSenha').value;
    if(!n || !s) return mostrarToast("Preencha tudo!");
    localStorage.setItem('configUser', JSON.stringify({nome: n, senha: s}));
    location.reload();
}
function verificarSenha() {
    const i = document.getElementById('inputSenha').value;
    if((!configUser && i==="1234") || (configUser && i===configUser.senha)) {
        document.getElementById('tela-bloqueio').style.display = 'none';
        atualizarApp();
    } else mostrarToast("Senha Incorreta!");
}

// --- CORE ---
function adicionarTransacao() {
    const v = parseFloat(document.getElementById('valor').value), d = document.getElementById('data').value;
    if(isNaN(v) || !d) return mostrarToast("Preencha valor e data!");

    const obj = {
        id: idEdicao || Date.now(),
        categoria: document.getElementById('categoria').value,
        descricao: document.getElementById('descricao').value || "Sem nome",
        valor: v, tipo: document.getElementById('tipo').value, data: d,
        cartaoId: idEdicao ? transacoes.find(t=>t.id===idEdicao).cartaoId : null
    };

    if(idEdicao) {
        transacoes[transacoes.findIndex(t=>t.id===idEdicao)] = obj;
        idEdicao = null;
        document.getElementById('btn-salvar').innerText = "Salvar";
        document.getElementById('titulo-form').innerText = "✍️ Lançamento";
    } else {
        transacoes.unshift(obj);
    }
    
    localStorage.setItem('financas', JSON.stringify(transacoes));
    document.getElementById('valor').value = ''; document.getElementById('descricao').value = '';
    atualizarApp();
    mostrarToast("✓ Sucesso!");
}

function atualizarApp() {
    let saldo = saldoInicial;
    let gastosPorCat = {};
    const mesAt = new Date().getMonth();

    transacoes.forEach(t => {
        if(t.tipo === 'ganho') saldo += t.valor;
        else {
            if(!t.cartaoId) saldo -= t.valor;
            gastosPorCat[t.categoria] = (gastosPorCat[t.categoria] || 0) + t.valor;
        }
    });

    document.getElementById('valor-flutuante').innerText = saldo.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
    document.getElementById('saldo-total').innerText = saldo.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
    
    renderizarSelects();
    renderizarHistorico();
    renderizarCartoes();
    renderizarAnalise(gastosPorCat);
}

function renderizarHistorico() {
    document.getElementById('lista-historico').innerHTML = transacoes.slice(0,10).map(t => `
        <div class="hist-item ${t.cartaoId ? 'item-cartao' : ''}">
            <div>
                <b>${t.descricao}</b>
                <small style="color:${coresCategorias[t.categoria]}">${t.cartaoId ? '💳 Cartão' : t.categoria}</small>
            </div>
            <div style="text-align:right">
                <span style="font-weight:800; color:${t.tipo==='ganho'?'var(--primary)':'var(--text-main)'}">R$ ${t.valor.toFixed(2)}</span>
                <div style="margin-top:5px; font-size:0.7rem">
                    <i class="fas fa-edit" style="color:var(--warning); margin-right:12px; cursor:pointer" onclick="editarItem(${t.id})"></i>
                    <i class="fas fa-trash" style="color:var(--danger); cursor:pointer" onclick="excluirItem(${t.id})"></i>
                </div>
            </div>
        </div>`).join('');
}

function editarItem(id) {
    const t = transacoes.find(x => x.id === id);
    idEdicao = id;
    document.getElementById('categoria').value = t.categoria;
    document.getElementById('descricao').value = t.descricao;
    document.getElementById('valor').value = t.valor;
    document.getElementById('tipo').value = t.tipo;
    document.getElementById('data').value = t.data;
    document.getElementById('btn-salvar').innerText = "Atualizar Agora";
    document.getElementById('titulo-form').innerText = "✏️ Editando Item";
    abrirAba('lancamentos', document.querySelector('.tab-btn'));
}

function excluirItem(id) {
    pedirConfirmacao("Apagar?", "Remover este registro permanentemente?", () => {
        transacoes = transacoes.filter(t => t.id !== id);
        localStorage.setItem('financas', JSON.stringify(transacoes));
        atualizarApp();
    });
}

// --- CARTÕES ---
function adicionarNovoCartao() {
    const n = document.getElementById('nome-cartao').value, l = parseFloat(document.getElementById('limite-cartao').value);
    if(!n || isNaN(l)) return mostrarToast("Dados inválidos!");
    cartoes.push({ id: Date.now(), nome: n, limite: l });
    localStorage.setItem('cartoes', JSON.stringify(cartoes));
    atualizarApp();
}

function lancarCompraParcelada() {
    const cId = document.getElementById('select-cartao-compra').value, vt = parseFloat(document.getElementById('valor-total-parcela').value);
    const qtd = parseInt(document.getElementById('qtd-parcelas').value), dRef = new Date(document.getElementById('data-primeira-parcela').value + 'T00:00:00');
    if(!cId || isNaN(vt)) return mostrarToast("Erro!");
    const vp = vt / qtd;
    for(let i=0; i<qtd; i++) {
        let dt = new Date(dRef); dt.setMonth(dRef.getMonth() + i);
        transacoes.push({ id: Date.now()+i, categoria: 'Cartão de Crédito', cartaoId: cId, descricao: `${document.getElementById('desc-parcela').value} (${i+1}/${qtd})`, valor: vp, tipo: 'gasto', data: dt.toISOString().split('T')[0] });
    }
    localStorage.setItem('financas', JSON.stringify(transacoes));
    atualizarApp(); mostrarToast("Parcelas Geradas!");
}

function renderizarCartoes() {
    const mes = new Date().getMonth();
    document.getElementById('lista-cartoes-container').innerHTML = cartoes.map(c => {
        const total = transacoes.filter(t=>t.cartaoId==c.id && new Date(t.data).getMonth()===mes).reduce((s,t)=>s+t.valor, 0);
        const p = Math.min((total/c.limite)*100, 100);
        return `<div class="card-fatura"><b>${c.nome}</b> <span style="float:right">R$ ${total.toFixed(2)}</span><div class="barra-fundo"><div class="barra-progresso" style="width:${p}%; background:var(--secondary)"></div></div></div>`;
    }).join('');
}

// --- ASSISTENTE IA ---
function abrirDicasAssistente() {
    const hoje = new Date(), gastosMes = transacoes.filter(t => t.tipo === 'gasto' && new Date(t.data).getMonth() === hoje.getMonth());
    const total = gastosMes.reduce((s, t) => s + t.valor, 0);
    let msg = total === 0 ? "Olá! Nada lançado ainda. Comece hoje!" : `Você já gastou <b>R$ ${total.toFixed(2)}</b> este mês. `;
    
    if(total > 0) {
        const cats = {}; gastosMes.forEach(g => cats[g.categoria] = (cats[g.categoria] || 0) + g.valor);
        const top = Object.keys(cats).reduce((a, b) => cats[a] > cats[b] ? a : b);
        msg += `<br><br>Seu maior gasto é em <b>${top}</b>. `;
        if(metas[top] && cats[top] > metas[top]) msg += "⚠️ Você estourou a meta dessa categoria!";
    }

    document.getElementById('msg-assistente').innerHTML = msg;
    document.getElementById('modal-assistente').style.display = 'flex';
}
function fecharAssistente() { document.getElementById('modal-assistente').style.display = 'none'; }

// --- AUXILIARES ---
function renderizarSelects() {
    document.getElementById('categoria').innerHTML = categoriasSet.map(c => `<option value="${c}">${c}</option>`).join('');
    document.getElementById('select-cartao-compra').innerHTML = cartoes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    document.getElementById('lista-categorias-editavel').innerHTML = categoriasSet.map((c, i) => `<div style="display:flex; justify-content:space-between; padding:8px; background:var(--glass); border-radius:10px; margin-bottom:5px"><span>${c}</span><i class="fas fa-trash" onclick="removerCategoria(${i})"></i></div>`).join('');
    document.getElementById('lista-config-metas').innerHTML = categoriasSet.map(c => `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px"><span>${c}</span><input type="number" class="input-meta" data-cat="${c}" value="${metas[c]||0}" style="width:80px"></div>`).join('');
}

function adicionarNovaCategoria() {
    const n = document.getElementById('nova-cat-nome').value.trim();
    if(!n) return; categoriasSet.push(n); coresCategorias[n] = `hsl(${Math.random()*360}, 70%, 60%)`;
    localStorage.setItem('categoriasPersonalizadas', JSON.stringify(categoriasSet));
    localStorage.setItem('coresCategorias', JSON.stringify(coresCategorias));
    document.getElementById('nova-cat-nome').value = ''; atualizarApp();
}

function removerCategoria(i) { categoriasSet.splice(i,1); localStorage.setItem('categoriasPersonalizadas', JSON.stringify(categoriasSet)); atualizarApp(); }
function salvarSaldoInicial() { saldoInicial = parseFloat(document.getElementById('inputSaldoInicial').value)||0; localStorage.setItem('saldoInicial', saldoInicial); atualizarApp(); }
function salvarMetas() { document.querySelectorAll('.input-meta').forEach(i => metas[i.dataset.cat] = parseFloat(i.value)||0); localStorage.setItem('metas', JSON.stringify(metas)); atualizarApp(); }
function mostrarToast(m) { const t = document.getElementById('toast'); t.innerText = m; t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 2000); }
function pedirConfirmacao(t, m, a) { const mod = document.getElementById('modal-confirm'); document.getElementById('confirm-titulo').innerText = t; document.getElementById('confirm-msg').innerText = m; mod.style.display = 'flex'; document.getElementById('btn-confirmar').onclick = () => { a(); mod.style.display = 'none'; }; document.getElementById('btn-cancelar').onclick = () => { mod.style.display = 'none'; }; }
function limparDados() { pedirConfirmacao("Limpar?", "Apagar tudo?", () => { localStorage.clear(); location.reload(); }); }
function exportarCSV() { let c = "Data;Cat;Desc;Valor\n"; transacoes.forEach(t=> c += `${t.data};${t.categoria};${t.descricao};${t.valor}\n`); const blob = new Blob([c], { type: 'text/csv' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "gestor.csv"; link.click(); }

function renderizarAnalise(gastos) {
    const ctx = document.getElementById('meuGrafico').getContext('2d');
    if(meuGrafico) meuGrafico.destroy();
    const labels = Object.keys(gastos).filter(k => categoriasSet.includes(k));
    meuGrafico = new Chart(ctx, { type: 'doughnut', data: { labels, datasets: [{ data: labels.map(l=>gastos[l]), backgroundColor: labels.map(l=>coresCategorias[l]) }] }, options: { plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } } } });
}

function abrirAba(id, btn) { document.querySelectorAll('.tab-content').forEach(a => a.classList.remove('active')); document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); document.getElementById(id).classList.add('active'); btn.classList.add('active'); }

// Init
document.getElementById('data').valueAsDate = new Date();
document.getElementById('data-primeira-parcela').valueAsDate = new Date();
if(!configUser) document.getElementById('tela-bloqueio').style.display = 'flex';
atualizarApp();