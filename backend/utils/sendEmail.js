const sgMail = require('@sendgrid/mail');

const createPasswordResetTemplate = (resetUrl, userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello${userName ? ' ' + userName : ''},</p>
          <p>You are receiving this email because you (or someone else) has requested to reset your password for your vendor account.</p>
          <p>Please click the button below to reset your password. This link will be valid for 30 minutes.</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
          <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Vendor App. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const sendEmail = async (options) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  let htmlContent = options.html || options.message.replace(/\n/g, '<br>');
  
  // If it's a password reset email, use the template
  if (options.subject.toLowerCase().includes('password reset')) {
    htmlContent = createPasswordResetTemplate(
      options.resetUrl || options.message.match(/https?:\/\/[^\s]+/)?.[0] || '',
      options.userName
    );
  }

  const msg = {
    to: options.email,
    from: {
      email: process.env.FROM_EMAIL,
      name: process.env.FROM_NAME
    },
    subject: options.subject,
    text: options.message,
    html: htmlContent
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('SendGrid Error:', error);
    if (error.response) {
      console.error('Error Response:', error.response.body);
    }
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail; 