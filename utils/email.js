const path = require('path');

const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.from = process.env.EMAIL_FROM;
    this.to = user.email;
    this.firstName = user.name.split(/\s+/)[0];
    this.url = url;
  }

  createTransport() {
    if (process.env.NODE_ENV === 'development') {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }

    // Sendgrid

    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.EMAIL_SENDGRID_USERNAME,
        pass: process.env.EMAIL_SENDGRID_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // Render html based on template

    const html = pug.renderFile(
      path.join(__dirname, '..', 'views', 'email', `${template}.pug`),
      { firstName: this.firstName, url: this.url, subject }
    );

    const text = htmlToText.fromString(html);

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text,
    };

    await this.createTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (Valid for only 10 minutes)'
    );
  }
};

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Gary Stern <gstern@example.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3) actually send the email
  await transport.sendMail(mailOptions);
};

// module.exports = sendEmail;
