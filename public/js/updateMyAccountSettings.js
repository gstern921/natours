import axios from 'axios';
import { showErrorAlert, showSuccessAlert } from './alerts';

export const updateMyAccountSettings = async (data) => {
  try {
    const response = await axios({
      method: 'PATCH',
      url: '/api/v1/users/me',
      data,
    });
    await showSuccessAlert('Account data updated successfully!');
    console.log(response.data);
    return response.data;
    // location.reload();
  } catch (err) {
    showErrorAlert(err.response.data.message);
    return err.response.data;
  }
};

export const updateMyPassword = async ({
  currentPassword,
  password,
  passwordConfirm,
}) => {
  try {
    const response = await axios({
      method: 'PATCH',
      url: '/api/v1/users/update-my-password',
      data: { currentPassword, password, passwordConfirm },
    });
    showSuccessAlert('Account password updated successfully!');
  } catch (err) {
    showErrorAlert(err.response.data.message);
  }
};
