import { supabase } from '../supabase.js';
import { Toast, ConfirmDialog } from '../utils/alerts.js';

export default async function renderMonitorView(container) {
  container.innerHTML = `
    <h1>Monitor de Status</h1>
    <div id="monitor-list">
      <div style="text-align: center; color: var(--text-muted); padding: 2rem;">Carregando...</div>
    </div>
  `;

  const monitorList = container.querySelector('#monitor-list');

  try {
    // Buscar lotes ativos com as informações do produto e do local
    const { data: lotes, error } = await supabase
      .from('lotes')
      .select(`
        id,
        numero_pote,
        data_validade,
        produtos ( nome ),
        locais ( nome )
      `)
      .eq('status', 'ativo')
      .order('data_validade', { ascending: true });

    if (error) throw error;

    if (lotes.length === 0) {
      monitorList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhum item ativo no momento.</div>';
      return;
    }

    monitorList.innerHTML = '';
    const agora = new Date();

    lotes.forEach(lote => {
      const validade = new Date(lote.data_validade);
      const diffHoras = (validade - agora) / (1000 * 60 * 60);

      let statusColor = 'var(--status-green)';
      let statusText = 'Validade em dia';

      if (diffHoras < 0) {
        statusColor = 'var(--status-red)';
        statusText = 'Vencido (Ação Imediata)';
      } else if (diffHoras <= 48) {
        statusColor = 'var(--status-yellow)';
        const horasRestantes = Math.floor(diffHoras);
        statusText = `Vence em ${horasRestantes} ${horasRestantes === 1 ? 'hora' : 'horas'}`;
      }

      const card = document.createElement('div');
      card.className = 'card';
      card.style.borderLeft = `4px solid ${statusColor}`;
      
      const formatData = (date) => date.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            <h3 style="color: ${statusColor}; margin-bottom: 0.25rem;">${lote.produtos.nome}</h3>
            <p style="font-size: 0.85rem; margin-bottom: 0.25rem;">Pote ${lote.numero_pote} • ${lote.locais ? lote.locais.nome : 'Sem local'}</p>
            <p class="form-label" style="margin-bottom: 0; font-weight: 600;">${statusText}</p>
            <p class="form-label" style="font-size: 0.75rem; margin-top: 0.25rem;">Vence: ${formatData(validade)}</p>
          </div>
          <div style="display: flex; gap: 0.75rem; margin-left: 1rem; align-items: center;">
             <button class="btn btn-baixa" data-id="${lote.id}" data-action="consumido" style="padding: 0.8rem; background-color: var(--status-green); border: none; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center;" title="Marcar como Usado">
               <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><polyline points="20 6 9 17 4 12"></polyline></svg>
             </button>
             <button class="btn btn-baixa" data-id="${lote.id}" data-action="descartado" style="padding: 0.8rem; background-color: transparent; border: 2px solid var(--status-red); color: var(--status-red); border-radius: 0.75rem; display: flex; align-items: center; justify-content: center;" title="Descartar">
               <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
             </button>
          </div>
        </div>
      `;
      monitorList.appendChild(card);
    });

    // Adicionar eventos para dar baixa
    container.querySelectorAll('.btn-baixa').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const btnElement = e.currentTarget;
        const id = btnElement.getAttribute('data-id');
        const action = btnElement.getAttribute('data-action');
        
        ConfirmDialog.fire({
          title: 'Atenção',
          text: `Confirmar que o pote foi ${action}?`,
          icon: 'question'
        }).then(async (result) => {
          if(result.isConfirmed) {
            btnElement.disabled = true;
            try {
              const { error: updErr } = await supabase.from('lotes').update({ status: action }).eq('id', id);
              if (updErr) throw updErr;
              
              Toast.fire({ icon: 'success', title: 'Status atualizado com sucesso!' });
              // Recarregar a tela para refletir a mudança
              renderMonitorView(container);
            } catch (err) {
              console.error(err);
              Toast.fire({ icon: 'error', title: 'Erro ao dar baixa.' });
              btnElement.disabled = false;
            }
          }
        });
      });
    });

  } catch (error) {
    console.error('Erro ao carregar monitor:', error);
    monitorList.innerHTML = '<div style="text-align: center; color: var(--status-red); padding: 2rem;">Erro ao carregar os dados.</div>';
  }
}
