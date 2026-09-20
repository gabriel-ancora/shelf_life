import Swal from 'sweetalert2';

export const Toast = Swal.mixin({
  toast: true,
  position: 'bottom-center',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#FFFFFF',
  color: '#1F2937',
  iconColor: '#991B1B',
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

export const ConfirmDialog = Swal.mixin({
  background: '#FFFFFF',
  color: '#1F2937',
  confirmButtonColor: '#991B1B',
  cancelButtonColor: '#6B7280',
  confirmButtonText: 'Sim, confirmar',
  cancelButtonText: 'Cancelar',
  showCancelButton: true,
  reverseButtons: true,
  customClass: {
    popup: 'card',
  }
});
