import '@babel/polyfill';
import login from './login';
import logout from './logout';
import {
  updateMyAccountSettings,
  updateMyPassword,
} from './updateMyAccountSettings';
import { displayMap } from './mapbox';
import { bookTour } from './stripe';

const mapBox = document.getElementById('map');
const loginForm = document.getElementById('login');
const logoutButton = document.getElementById('logout');
const bookTourButton = document.getElementById('book-tour');
const changeMyAccountSettingsForm = document.getElementById(
  'change-my-account-settings-form'
);
const changeMyPasswordForm = document.getElementById('change-my-password-form');

const locations = mapBox ? JSON.parse(mapBox.dataset.locations) : null;
if (locations) {
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}
if (logoutButton) {
  logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}
if (changeMyAccountSettingsForm) {
  changeMyAccountSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const target = e.target;
    const formData = new FormData();
    formData.append('name', target.querySelector('#name').value);
    formData.append('email', target.querySelector('#email').value);
    formData.append('photo', target.querySelector('#user-photo').files[0]);

    await updateMyAccountSettings(formData);
    location.reload();
  });
}

if (changeMyPasswordForm) {
  changeMyPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const target = e.target;
    const currentPassword = target.querySelector('#password-current').value;
    const password = target.querySelector('#password').value;
    const passwordConfirm = target.querySelector('#password-confirm').value;
    const previousButtonText = target.querySelector(
      '#change-my-password-button'
    ).textContent;
    target.querySelector('#change-my-password-button').textContent =
      'UPDATING PASSWORD...';
    target.querySelector('#change-my-password-button').disabled = true;
    await updateMyPassword({
      currentPassword,
      password,
      passwordConfirm,
    });
    target.querySelector('#password-current').value = '';
    target.querySelector('#password').value = '';
    target.querySelector('#password-confirm').value = '';
    target.querySelector(
      '#change-my-password-button'
    ).textContent = previousButtonText;
    target.querySelector('#change-my-password-button').disabled = false;
  });
}

if (bookTourButton) {
  bookTourButton.addEventListener('click', async (e) => {
    const el = e.target;
    el.textContent = 'Processing...';
    const { tourId } = el.dataset;
    const session = await bookTour(tourId);
    // console.log(session);
  });
}
