export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) {
    el.parentElement.removeChild(el);
  }
};

const showAlert = async (type, msg, duration = 5) => {
  hideAlert();
  const alertEl = document.createElement('div');
  const message = document.createTextNode(msg);
  alertEl.classList.add('alert', `alert--${type}`);
  alertEl.appendChild(message);
  document.body.insertAdjacentHTML('afterbegin', alertEl.outerHTML);
  window.setTimeout(hideAlert, duration * 1000);
};

export const showSuccessAlert = async (msg, duration = 5) => {
  await showAlert('success', msg, duration);
};

export const showErrorAlert = async (msg, duration = 5) => {
  await showAlert('error', msg, duration);
};
