import { supabase } from '../supabase.js';

export default async function renderDashboardView(container) {
  container.innerHTML = `
    <h1>Gestão</h1>
    <div id="dashboard-content">
      <div style="text-align: center; color: var(--text-muted); padding: 2rem;">Carregando métricas...</div>
    </div>
  `;

  const dashboardContent = container.querySelector('#dashboard-content');

  try {
    // Buscar todos os lotes para estatísticas
    const { data: lotes, error } = await supabase.from('lotes').select('status, criado_em, produtos(nome)');
    if (error) throw error;

    let totalConsumido = 0;
    let totalDescartado = 0;
    let totalAtivo = 0;

    // Produção por dia da semana (simplificado para os últimos 7 dias ou geral)
    const productionByDay = [0, 0, 0, 0, 0, 0, 0]; // Dom a Sab
    const daysLabel = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

    const perdasPorProduto = {};

    lotes.forEach(lote => {
      if (lote.status === 'consumido') totalConsumido++;
      if (lote.status === 'descartado') {
        totalDescartado++;
        const pName = lote.produtos.nome;
        perdasPorProduto[pName] = (perdasPorProduto[pName] || 0) + 1;
      }
      if (lote.status === 'ativo') totalAtivo++;

      // Produção da semana atual
      const d = new Date(lote.criado_em);
      // Para ser realista, deveríamos filtrar apenas da última semana, mas para MVP vamos agrupar por dia da semana histórico
      productionByDay[d.getDay()]++;
    });

    const totalFinalizados = totalConsumido + totalDescartado;
    const taxaDesperdicio = totalFinalizados > 0 
      ? Math.round((totalDescartado / totalFinalizados) * 100) 
      : 0;

    // Top perdas
    const topPerdas = Object.entries(perdasPorProduto)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Encontrar o dia com maior produção para calcular as alturas das barras
    const maxProd = Math.max(...productionByDay, 1);

    const barsHtml = productionByDay.map(val => {
      const height = (val / maxProd) * 100;
      return `<div style="width: 12%; background: var(--primary); height: ${height}%; border-radius: 4px 4px 0 0; position: relative;" title="${val} etiquetas"></div>`;
    }).join('');

    const daysHtml = daysLabel.map(d => `<span>${d}</span>`).join('');

    const topPerdasHtml = topPerdas.length > 0
      ? topPerdas.map((p, i) => `
          <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
            <span>${i + 1}. ${p[0]}</span>
            <span style="color: var(--status-red); font-weight: 600;">${p[1]} perdas</span>
          </div>
        `).join('')
      : '<p style="color: var(--text-muted); font-size: 0.8rem;">Nenhuma perda registrada ainda.</p>';


    dashboardContent.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
        <div class="card" style="text-align: center; margin-bottom: 0;">
          <h2 style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.25rem;">Taxa de Desperdício</h2>
          <div style="font-size: 2.5rem; font-weight: 700; color: ${taxaDesperdicio > 20 ? 'var(--status-red)' : 'var(--status-yellow)'};">${taxaDesperdicio}%</div>
          <p style="font-size: 0.7rem; color: var(--text-muted);">dos finalizados</p>
        </div>
        <div class="card" style="text-align: center; margin-bottom: 0;">
          <h2 style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.25rem;">Potes Ativos</h2>
          <div style="font-size: 2.5rem; font-weight: 700; color: var(--status-green);">${totalAtivo}</div>
          <p style="font-size: 0.7rem; color: var(--text-muted);">em uso/estoque</p>
        </div>
      </div>
      
      <div class="card">
        <h2 style="font-size: 1.1rem; margin-bottom: 1rem;">Volume de Produção</h2>
        <div style="height: 150px; display: flex; align-items: flex-end; gap: 0.5rem; justify-content: space-between; padding-top: 1rem; border-bottom: 1px solid var(--border-color);">
          ${barsHtml}
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.7rem; color: var(--text-muted);">
          ${daysHtml}
        </div>
      </div>

      <div class="card">
        <h2 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--status-red);">Top Perdas</h2>
        ${topPerdasHtml}
      </div>
    `;

  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    dashboardContent.innerHTML = '<div style="text-align: center; color: var(--status-red); padding: 2rem;">Erro ao carregar os dados.</div>';
  }
}
