import { supabase } from '../supabase.js';
import { Toast } from '../utils/alerts.js';

export default async function renderCadastroView(container) {
  container.innerHTML = `
    <h1>Cadastros</h1>
    
    <div class="card">
      <h2 style="margin-bottom: 1rem; color: var(--text-main);">Novo Produto</h2>
      <form id="form-produto">
        <div class="form-group">
          <label class="form-label" for="prod-nome">Nome do Produto</label>
          <input type="text" id="prod-nome" class="form-input" placeholder="Ex: Picanha Fatiada" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="prod-validade">Tempo de Validade (Horas)</label>
          <input type="number" id="prod-validade" class="form-input" placeholder="Ex: 48" required min="1">
        </div>
        <button type="submit" class="btn" id="btn-salvar-produto">Salvar Produto</button>
      </form>
    </div>

    <div class="card">
      <h2 style="margin-bottom: 1rem; color: var(--text-main);">Novo Local de Armazenamento</h2>
      <form id="form-local">
        <div class="form-group">
          <label class="form-label" for="local-nome">Nome do Local</label>
          <input type="text" id="local-nome" class="form-input" placeholder="Ex: Geladeira 1 - Gaveta B" required>
        </div>
        <button type="submit" class="btn" id="btn-salvar-local">Salvar Local</button>
      </form>
    </div>
  `;

  const formProduto = container.querySelector('#form-produto');
  const btnSalvarProduto = container.querySelector('#btn-salvar-produto');
  
  formProduto.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnSalvarProduto.disabled = true;
    btnSalvarProduto.textContent = 'Salvando...';
    
    const nome = container.querySelector('#prod-nome').value;
    const validade = container.querySelector('#prod-validade').value;
    
    try {
      const { error } = await supabase.from('produtos').insert([{ 
        nome, 
        tempo_validade_horas: parseInt(validade) 
      }]);
      if (error) throw error;
      
      Toast.fire({ icon: 'success', title: 'Produto cadastrado!' });
      formProduto.reset();
    } catch (err) {
      console.error(err);
      Toast.fire({ icon: 'error', title: 'Erro ao cadastrar produto.' });
    } finally {
      btnSalvarProduto.disabled = false;
      btnSalvarProduto.textContent = 'Salvar Produto';
    }
  });

  const formLocal = container.querySelector('#form-local');
  const btnSalvarLocal = container.querySelector('#btn-salvar-local');
  
  formLocal.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnSalvarLocal.disabled = true;
    btnSalvarLocal.textContent = 'Salvando...';
    
    const nome = container.querySelector('#local-nome').value;
    
    try {
      const { error } = await supabase.from('locais').insert([{ nome }]);
      if (error) throw error;
      
      Toast.fire({ icon: 'success', title: 'Local cadastrado!' });
      formLocal.reset();
    } catch (err) {
      console.error(err);
      Toast.fire({ icon: 'error', title: 'Erro ao cadastrar local.' });
    } finally {
      btnSalvarLocal.disabled = false;
      btnSalvarLocal.textContent = 'Salvar Local';
    }
  });
}
