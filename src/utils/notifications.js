import { supabase } from '../supabase.js';

let notificationInterval = null;

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("Este navegador não suporta notificações.");
    return false;
  }
  
  if (Notification.permission === "granted") {
    return true;
  }
  
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  
  return false;
}

export async function checkExpirations() {
  try {
    const { data: lotes, error } = await supabase
      .from('lotes')
      .select('id, numero_pote, data_validade, produtos(nome)')
      .eq('status', 'ativo');
      
    if (error) throw error;
    
    if (!lotes || lotes.length === 0) return;
    
    let expiringCount = 0;
    let expiredCount = 0;
    const now = new Date();
    
    lotes.forEach(lote => {
      const validade = new Date(lote.data_validade);
      const diffHoras = (validade - now) / (1000 * 60 * 60);
      
      if (diffHoras < 0) {
        expiredCount++;
      } else if (diffHoras <= 72) { // 3 dias
        expiringCount++;
      }
    });
    
    // Mostra as notificações baseadas na contagem
    if (expiredCount > 0) {
      new Notification("Shelf Life: PERIGO 🔴", {
        body: `${expiredCount} pote(s) já passaram da validade e precisam ser avaliados/descartados!`,
        icon: '/logo.jpg'
      });
    } else if (expiringCount > 0) {
      new Notification("Shelf Life: Aviso 🟡", {
        body: `${expiringCount} pote(s) vencem em menos de 3 dias. Organize a produção.`,
        icon: '/logo.jpg'
      });
    }
    
  } catch (err) {
    console.error("Erro ao verificar validades para notificação:", err);
  }
}

export async function initNotifications() {
  const granted = await requestNotificationPermission();
  if (granted) {
    // Checa assim que o app abre
    checkExpirations();
    // Se o dispositivo ficar ligado e com a aba rodando, checa a cada 2 horas
    if (notificationInterval) clearInterval(notificationInterval);
    notificationInterval = setInterval(checkExpirations, 2 * 60 * 60 * 1000);
  }
}
