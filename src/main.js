import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nova versão disponível. Atualizar agora?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App pronto para funcionar offline.');
  },
});

// Mock Views for Initial Setup
import renderPrintView from './views/print.js';
import renderMonitorView from './views/monitor.js';
import renderAuditView from './views/audit.js';
import renderDashboardView from './views/dashboard.js';
import renderCadastroView from './views/cadastro.js';

const appContent = document.getElementById('app-content');
const navItems = document.querySelectorAll('.nav-item');

const routes = {
  print: renderPrintView,
  monitor: renderMonitorView,
  audit: renderAuditView,
  dashboard: renderDashboardView,
  cadastro: renderCadastroView
};

function navigateTo(route) {
  // Update active state in nav
  navItems.forEach(item => {
    if (item.dataset.target === route) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Render content
  appContent.innerHTML = '';
  const viewContainer = document.createElement('div');
  viewContainer.className = 'view-enter';
  
  if (routes[route]) {
    routes[route](viewContainer);
  } else {
    viewContainer.innerHTML = '<h2>Página não encontrada</h2>';
  }
  
  appContent.appendChild(viewContainer);
}

// Event Listeners for Navigation
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const target = item.dataset.target;
    navigateTo(target);
  });
});

// Initialize with default route
navigateTo('print');
