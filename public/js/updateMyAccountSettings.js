import axios from 'axios';
import { showErrorAlert, showSuccessAlert } from './alerts';

export const updateMyAccountSettings = async (data, token) => {
  try {
    const response = await axios({
      method: 'PATCH',
      url: '/api/v1/users/me',
      headers: {
        'CSRF-Token': token, // <-- is the csrf token as a header
      },
      data,
    });
    await showSuccessAlert('Account data updated successfully!');
    return response.data;
    // location.reload();
  } catch (err) {
    showErrorAlert(err.response.data.message);
    return err.response.data;
  }
};

export const updateMyPassword = async (
  { currentPassword, password, passwordConfirm },
  token
) => {
  try {
    const response = await axios({
      method: 'PATCH',
      url: '/api/v1/users/update-my-password',
      headers: {
        'CSRF-Token': token, // <-- is the csrf token as a header
      },
      data: { currentPassword, password, passwordConfirm },
    });
    showSuccessAlert('Account password updated successfully!');
  } catch (err) {
    showErrorAlert(err.response.data.message);
  }
};
