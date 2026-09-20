import { supabase } from '../supabase.js';
import QRCode from 'qrcode';
import 'niimbot-web-bluetooth';

// Configuração Padrão para impressora NIIMBOT B1 (203 dpi)
// Papel assumido: 50x30mm
const NIIMBOT_MODEL = { name_prefixes: ["B1", "B2", "D11", "M2"], task: "b1", density: 3, label_type: 1, speed: 1 };
const NIIMBOT_SIZE = { w_px: 384, h_px: 240, offset_y_px: 4 };

export default async function renderPrintView(container) {
  container.innerHTML = `
    <h1>Nova Etiqueta</h1>
    
    <div class="card" style="margin-top: 1rem;">
      <form id="print-form">
        <div class="form-group">
          <label class="form-label" for="produto-select">Produto</label>
          <select id="produto-select" class="form-control" required>
            <option value="" disabled selected>Selecione um produto...</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="local-select">Local de Armazenamento</label>
          <select id="local-select" class="form-control" required>
            <option value="" disabled selected>Selecione o local...</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="pote-input">Número do Pote/Embalagem</label>
          <input type="number" id="pote-input" class="form-control" placeholder="Ex: 1, 2, 3..." required min="1">
        </div>

        <!-- Hidden canvas for QRCode generation -->
        <canvas id="qr-canvas" style="display: none;"></canvas>
        <!-- Hidden canvas for Label drawing -->
        <canvas id="label-canvas" width="384" height="240" style="display: none;"></canvas>

        <button type="submit" class="btn btn-primary" id="print-btn">
          🖨️ Conectar e Imprimir (Bluetooth)
        </button>
      </form>
    </div>

    <div id="bt-status" style="margin-top: 1rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
      Status: Aguardando conexão...
    </div>
  `;

  const produtoSelect = container.querySelector('#produto-select');
  const localSelect = container.querySelector('#local-select');
  const printForm = container.querySelector('#print-form');
  const printBtn = container.querySelector('#print-btn');
  const btStatus = container.querySelector('#bt-status');
  const qrCanvas = container.querySelector('#qr-canvas');
  const labelCanvas = container.querySelector('#label-canvas');

  let produtosMap = {};

  try {
    const { data: produtos, error: pError } = await supabase.from('produtos').select('*').order('nome');
    if (pError) throw pError;
    
    produtos.forEach(p => {
      produtosMap[p.id] = p;
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nome;
      produtoSelect.appendChild(opt);
    });

    const { data: locais, error: lError } = await supabase.from('locais').select('*').order('nome');
    if (lError) throw lError;

    locais.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.id;
      opt.textContent = l.nome;
      localSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    alert('Erro ao carregar produtos/locais.');
  }

  // Função para desenhar a etiqueta no Canvas 384x240 (Preto e Branco)
  async function drawLabelCanvas(produtoNome, numPote, fabricacaoStr, validadeStr, loteId) {
    const ctx = labelCanvas.getContext('2d');
    
    // Fundo branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 384, 240);

    // Texto Preto
    ctx.fillStyle = '#000000';
    
    // Nome do Produto (Negrito)
    ctx.font = 'bold 36px Arial';
    ctx.fillText(produtoNome.substring(0, 20), 10, 45); // substring para evitar overflow longo

    // Número do Pote
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`Pote: ${numPote}`, 10, 90);

    // Linha divisória
    ctx.fillRect(10, 110, 364, 3);

    // Datas
    ctx.font = '24px Arial';
    ctx.fillText(`Fab: ${fabricacaoStr}`, 10, 150);
    ctx.fillText(`Val: ${validadeStr}`, 10, 190);

    // Gerar QR Code e colocar no Canvas
    await QRCode.toCanvas(qrCanvas, JSON.stringify({ id: loteId, p: numPote }), {
      width: 100,
      margin: 1
    });

    // Desenhar o QR Code no canto direito da etiqueta
    ctx.drawImage(qrCanvas, 260, 120, 100, 100);

    return labelCanvas.toDataURL('image/png');
  }

  printForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Verificação de suporte Bluetooth
    if (!window.Niimbot || !window.Niimbot.isSupported()) {
      alert("Seu navegador não suporta Web Bluetooth. Use o Chrome no Android ou PC (não funciona no iOS/Safari).");
      return;
    }

    printBtn.disabled = true;
    printBtn.textContent = 'Gerando...';
    btStatus.textContent = 'Status: Registrando no banco...';
    btStatus.style.color = 'var(--status-yellow)';

    const produtoId = produtoSelect.value;
    const localId = localSelect.value;
    const numeroPote = container.querySelector('#pote-input').value;
    const produtoInfo = produtosMap[produtoId];
    
    const dataFabricacao = new Date();
    const dataValidade = new Date(dataFabricacao.getTime() + (produtoInfo.tempo_validade_horas * 60 * 60 * 1000));

    try {
      // 1. Inserir no Supabase
      const { data: loteInserido, error } = await supabase.from('lotes').insert([
        {
          produto_id: produtoId,
          local_id: localId,
          numero_pote: numeroPote,
          data_fabricacao: dataFabricacao.toISOString(),
          data_validade: dataValidade.toISOString(),
          status: 'ativo'
        }
      ]).select().single();

      if (error) throw error;

      // 2. Formatar Datas
      const formatData = (date) => date.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
      const fabStr = formatData(dataFabricacao);
      const valStr = formatData(dataValidade);

      // 3. Desenhar Canvas
      btStatus.textContent = 'Status: Conectando Bluetooth... (Selecione a impressora)';
      printBtn.textContent = 'Conectando...';
      const imgDataUrl = await drawLabelCanvas(produtoInfo.nome, numeroPote, fabStr, valStr, loteInserido.id);

      // 4. Imprimir via Bluetooth
      // identify e printImage cuidam do requestDevice e envio
      await window.Niimbot.identify(NIIMBOT_MODEL);
      
      const pModel = window.Niimbot.printer;
      btStatus.textContent = `Status: Conectado a ${pModel.label}. Imprimindo...`;
      printBtn.textContent = 'Enviando...';

      // Envia a imagem gerada pelo canvas
      await window.Niimbot.printImage(imgDataUrl, { 
        model: NIIMBOT_MODEL, 
        size: NIIMBOT_SIZE,
        copies: 1 
      });

      btStatus.textContent = 'Status: Impressão finalizada com sucesso! ✅';
      btStatus.style.color = 'var(--status-green)';
      
      // Limpar form
      container.querySelector('#pote-input').value = '';

    } catch (error) {
      console.error('Erro no fluxo de impressão:', error);
      btStatus.textContent = 'Status: Falha na impressão/conexão ❌';
      btStatus.style.color = 'var(--status-red)';
      alert('Falha: ' + (error.message || 'Erro desconhecido'));
    } finally {
      printBtn.disabled = false;
      printBtn.textContent = '🖨️ Conectar e Imprimir (Bluetooth)';
    }
  });
}
