const nodemailer = require('nodemailer');

async function createTransporter() {
  if (process.env.NODE_ENV === 'production') {
    // Configure your real SMTP here for production
    return nodemailer.createTransport({ /* real SMTP config */ });
  }
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
}

async function sendEmail(to, subject, text) {
  const transporter = await createTransporter();
  const info = await transporter.sendMail({
    from: '"Futsal Booking" <no-reply@futsal.local>',
    to,
    subject,
    text
  });
  // Dev: preview email in Ethereal (open the returned URL in your browser)
  console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
}

async function sendOtpEmail(to, otp) {
  await sendEmail(to, 'Your verification code', `Your OTP is ${otp}. Expires in 15 minutes.`);
}

module.exports = { sendEmail, sendOtpEmail };