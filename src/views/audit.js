import { supabase } from '../supabase.js';

export default async function renderAuditView(container) {
  container.innerHTML = `
    <h1>Auditoria</h1>
    <div id="audit-list">
      <div style="text-align: center; color: var(--text-muted); padding: 2rem;">Carregando...</div>
    </div>
  `;

  const auditList = container.querySelector('#audit-list');

  try {
    // Buscar todos os locais
    const { data: locais, error: locErr } = await supabase.from('locais').select('*').order('nome');
    if (locErr) throw locErr;

    // Buscar lotes ativos
    const { data: lotes, error: loteErr } = await supabase
      .from('lotes')
      .select(`
        id,
        numero_pote,
        local_id,
        produtos ( nome )
      `)
      .eq('status', 'ativo');
    if (loteErr) throw loteErr;

    auditList.innerHTML = '';

    // Agrupar lotes por local_id
    const lotesPorLocal = {};
    locais.forEach(l => { lotesPorLocal[l.id] = []; });
    const semLocal = [];

    lotes.forEach(lote => {
      if (lote.local_id && lotesPorLocal[lote.local_id]) {
        lotesPorLocal[lote.local_id].push(lote);
      } else {
        semLocal.push(lote);
      }
    });

    const renderLocalCard = (localName, localId, items) => {
      const card = document.createElement('div');
      card.className = 'card';
      
      let itemsHtml = items.map(i => `
        <div style="padding: 0.5rem 1rem; background: var(--bg-dark); border-radius: 0.5rem; border: 1px solid var(--border-color); display: flex; flex-direction: column; min-width: 100px;">
          <span style="font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;" title="${i.produtos.nome}">${i.produtos.nome}</span>
          <span style="font-weight: 600;">Pote ${i.numero_pote}</span>
          <select class="move-select" data-id="${i.id}" style="margin-top: 0.5rem; background: transparent; color: var(--text-muted); border: 1px solid var(--border-color); border-radius: 4px; padding: 2px; font-size: 0.7rem;">
            <option value="" disabled selected>Mover...</option>
            ${locais.map(loc => `<option value="${loc.id}">Mover para ${loc.nome}</option>`).join('')}
          </select>
        </div>
      `).join('');

      if (items.length === 0) {
        itemsHtml = '<p style="color: var(--text-muted); font-size: 0.8rem;">Vazio</p>';
      }

      card.innerHTML = `
        <h2 style="color: var(--primary); display: flex; align-items: center; justify-content: space-between; font-size: 1.1rem;">
          <span style="display: flex; align-items: center; gap: 0.5rem;">${localName}</span>
          <span style="font-size: 0.8rem; background: var(--bg-dark); padding: 0.2rem 0.6rem; border-radius: 1rem; color: var(--text-muted)">${items.length} potes</span>
        </h2>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem;">
          ${itemsHtml}
        </div>
      `;
      auditList.appendChild(card);
    };

    locais.forEach(local => {
      renderLocalCard(local.nome, local.id, lotesPorLocal[local.id]);
    });

    if (semLocal.length > 0) {
      renderLocalCard('Sem Local Definido', null, semLocal);
    }

    // Adicionar eventos para o select de mover pote
    container.querySelectorAll('.move-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = e.target.getAttribute('data-id');
        const novoLocalId = e.target.value;
        
        e.target.disabled = true;
        try {
          const { error: updErr } = await supabase.from('lotes').update({ local_id: novoLocalId }).eq('id', id);
          if (updErr) throw updErr;
          
          // Recarregar a tela para refletir a mudança
          renderAuditView(container);
        } catch (err) {
          console.error(err);
          alert('Erro ao mover pote.');
          e.target.disabled = false;
        }
      });
    });

  } catch (error) {
    console.error('Erro ao carregar auditoria:', error);
    auditList.innerHTML = '<div style="text-align: center; color: var(--status-red); padding: 2rem;">Erro ao carregar os dados.</div>';
  }
}
