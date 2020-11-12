/* eslint-disable */
import axios from 'axios';
import { showErrorAlert } from './alerts';

const stripe =
  typeof Stripe === 'function'
    ? Stripe(
        'pk_test_51HleaYFH5t3NAX027SUhUHrw2sNLSOedAdAwu6J7dHrsYiUJstbTctWv1zSF9cGbwgLcizknxoEsFcSN7PYmAGi200RLWYi2v6'
      )
    : null;
export const bookTour = async (tourId) => {
  // Get checkout session from API
  try {
    const response = await axios({
      url: `/api/v1/bookings/checkout-session/${tourId}`,
    });
    await stripe.redirectToCheckout({ sessionId: response.data.session.id });
  } catch (err) {
    showErrorAlert(err.message);
  }

  // Create checkout form + charge credit card
};
