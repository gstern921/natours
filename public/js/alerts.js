export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) {
    el.parentElement.removeChild(el);
  }
};

const showAlert = async (type, msg) => {
  hideAlert();
  const alertEl = document.createElement('div');
  const message = document.createTextNode(msg);
  alertEl.classList.add('alert', `alert--${type}`);
  alertEl.appendChild(message);
  document.body.insertAdjacentHTML('afterbegin', alertEl.outerHTML);
  window.setTimeout(hideAlert, 5000);
};

export const showSuccessAlert = async (msg) => {
  await showAlert('success', msg);
};

export const showErrorAlert = async (msg) => {
  await showAlert('error', msg);
};
