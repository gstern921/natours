/* eslint-disable */
import axios from 'axios';
import { showSuccessAlert, showErrorAlert } from './alerts';

const login = async (email, password) => {
  const data = { email, password };
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
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
