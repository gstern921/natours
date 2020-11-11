import axios from 'axios';
import { showSuccessAlert, showErrorAlert } from './alerts';
const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
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
