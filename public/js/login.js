/* eslint-disable */
import axios from 'axios';
import { showSuccessAlert, showErrorAlert } from './alerts';

const login = async (email, password, token) => {
  const data = { email, password };

  try {
    const res = await axios({
      method: 'POST',
      url: '/api/login',
      headers: {
        'CSRF-Token': token, // <-- is the csrf token as a header
      },
      data,
    });

    if (res.data.status === 'success') {
      showSuccessAlert('Sign in successful');
      setTimeout(() => location.assign('/'), 1500);
    }
  } catch (err) {
    showErrorAlert(err.response.data.message);
  }
};

export default login;
