import axios from 'axios';
import { showSuccessAlert, showErrorAlert } from './alerts';
const logout = async (token) => {
  try {
    const res = await axios({
      method: 'POST',
      headers: {
        'CSRF-Token': token, // <-- is the csrf token as a header
      },
      url: '/api/logout',
    });

    if (res.data.status === 'success') {
      showSuccessAlert('Sign out successful');
      setTimeout(() => location.assign('/'), 1500);
    }
  } catch (err) {
    showErrorAlert('Sign out unsuccessful');
  }
};

export default logout;
