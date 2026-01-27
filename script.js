let transacoes = JSON.parse(localStorage.getItem('financas')) || [];
let metas = JSON.parse(localStorage.getItem('metas')) || {};
let saldoInicial = parseFloat(localStorage.getItem('saldoInicial')) || 0;
let meuGrafico;

const categorias = ["Alimentação", "Cartão de Crédito", "Transporte", "Moradia", "Lazer", "Saúde", "Educação", "Outros"];

document.getElementById('data').valueAsDate = new Date();

function abrirAba(idAba, btn) {
    document.querySelectorAll('.tab-content').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(idAba).classList.add('active');
    btn.classList.add('active');
    
    atualizarApp();
    if(idAba === 'metas') renderizarConfigMetas();
}

function adicionarTransacao() {
    const cat = document.getElementById('categoria').value;
    const desc = document.getElementById('descricao').value || cat;
    const val = parseFloat(document.getElementById('valor').value);
    const tipo = document.getElementById('tipo').value;
    const data = document.getElementById('data').value;

    if (isNaN(val) || !data) return alert("Por favor, preencha valor e data!");

    transacoes.push({ categoria: cat, descricao: desc, valor: val, tipo, data });
    localStorage.setItem('financas', JSON.stringify(transacoes));
    
    document.getElementById('valor').value = '';
    document.getElementById('descricao').value = '';
    atualizarApp();
    alert("✓ Registro salvo com sucesso!");
}

function renderizarConfigMetas() {
    document.getElementById('inputSaldoInicial').value = saldoInicial;
    const lista = document.getElementById('lista-config-metas');
    lista.innerHTML = categorias.map(c => `
        <div style="margin-bottom:10px">
            <label>Meta mensal para ${c}:</label>
            <input type="number" class="input-meta" data-cat="${c}" value="${metas[c] || 0}" step="0.01">
        </div>
    `).join('');
}

function salvarSaldoInicial() {
    const val = parseFloat(document.getElementById('inputSaldoInicial').value);
    saldoInicial = isNaN(val) ? 0 : val;
    localStorage.setItem('saldoInicial', saldoInicial);
    atualizarApp();
    alert("Saldo inicial atualizado!");
}

function salvarMetas() {
    document.querySelectorAll('.input-meta').forEach(i => {
        metas[i.dataset.cat] = parseFloat(i.value) || 0;
    });
    localStorage.setItem('metas', JSON.stringify(metas));
    atualizarApp();
    alert("Metas salvas!");
}

function atualizarApp() {
    let atual = saldoInicial;
    const resumoGastos = {};

    transacoes.forEach(t => {
        if (t.tipo === 'ganho') atual += t.valor;
        else {
            atual -= t.valor;
            resumoGastos[t.categoria] = (resumoGastos[t.categoria] || 0) + t.valor;
        }
    });

    const formatado = atual.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
    
    if(document.getElementById('saldo-total')) document.getElementById('saldo-total').innerText = formatado;
    document.getElementById('valor-flutuante').innerText = formatado;
    
    renderizarBarras(resumoGastos);
    renderizarGrafico(resumoGastos);
}

function renderizarBarras(gastos) {
    const div = document.getElementById('progresso-metas');
    if(!div) return;
    div.innerHTML = "<h3 style='margin-bottom:15px'>🎯 Progresso das Metas</h3>";
    
    Object.keys(metas).forEach(c => {
        if(metas[c] > 0) {
            const g = gastos[c] || 0;
            const p = Math.min((g / metas[c]) * 100, 100);
            let cor = 'cor-ok';
            if(p > 80) cor = 'cor-alerta';
            if(g > metas[c]) cor = 'cor-perigo';

            div.innerHTML += `
                <div class="meta-item">
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem">
                        <span>${c}</span>
                        <span>R$ ${g.toFixed(2)} / ${metas[c].toFixed(2)}</span>
                    </div>
                    <div class="barra-fundo">
                        <div class="barra-progresso ${cor}" style="width:${p}%"></div>
                    </div>
                </div>`;
        }
    });
}

function renderizarGrafico(dados) {
    const canvas = document.getElementById('meuGrafico');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if (meuGrafico) meuGrafico.destroy();
    if (Object.keys(dados).length === 0) return;

    meuGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(dados),
            datasets: [{
                data: Object.values(dados),
                backgroundColor: ['#00d1b2','#3498db','#9b59b6','#f1c40f','#e67e22','#e74c3c','#4bc0c0','#ff6384']
            }]
        },
        options: { plugins: { legend: { labels: { color: '#fff' } } } }
    });
}

function exportarCSV() {
    let csv = "\ufeffData;Categoria;Descricao;Valor;Tipo\n";
    transacoes.forEach(t => csv += `${t.data};${t.categoria};${t.descricao};${t.valor.toFixed(2)};${t.tipo}\n`);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "meu_gestor_financeiro.csv";
    link.click();
}

function zerarMes() {
    if(confirm("Deseja apagar todos os lançamentos? (Saldo inicial e metas serão mantidos)")) {
        transacoes = [];
        localStorage.setItem('financas', JSON.stringify(transacoes));
        atualizarApp();
    }
}

function limparDados() {
    if(confirm("ATENÇÃO: Isso apagará TUDO definitivamente. Continuar?")) {
        localStorage.clear();
        location.reload();
    }
}

// Inicializa o app
atualizarApp();