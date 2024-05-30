require('dotenv').config(); // Load environment variables from .env file
const nodemailer = require('nodemailer');

// Create a transporter object using SendGrid SMTP transport
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey', // This is the fixed value 'apikey' for SendGrid
    pass: process.env.SENDGRID_API_KEY // Your SendGrid API key
  }
});

const sendEmail = async options => {
  // Define email options
  const mailOptions = {
    to: options.email, // List of recipients
    from: 'mohamedmomen81296@gmail.com', // Sender address
    subject: options.subject, // Subject line
    text: options.message // Plain text body
  };

  try {
    // Actually send email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;
