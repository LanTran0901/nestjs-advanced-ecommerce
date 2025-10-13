export function generateOtpTemplate(
  name: string,
  otpCode: string,
  appName: string = "Ecommerce",
  validitySeconds: number = 60
): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=session-width, initial-scale=1.0" />
    <title>Your ${appName} OTP</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f3f4f6;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 30px auto;
        background: #ffffff;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        text-align: center;
      }
      h1 {
        font-size: 24px;
        font-weight: bold;
        color: #111827;
        margin-bottom: 16px;
      }
      p {
        font-size: 16px;
        color: #374151;
        line-height: 1.5;
        margin-bottom: 16px;
      }
      .otp-box {
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 8px;
        color: #2563eb;
        background: #f0f9ff;
        display: inline-block;
        padding: 12px 24px;
        border-radius: 8px;
        margin: 20px 0;
      }
      .footer {
        margin-top: 20px;
        font-size: 12px;
        color: #6b7280;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Your OTP Code</h1>
      <p>Hello ${name},</p>
      <p>Use the code below to complete your sign-in to <strong>${appName}</strong>:</p>
      <div class="otp-box">${otpCode}</div>
      <p>This code will expire in <strong>${validitySeconds} seconds</strong>. If you did not request this code, you can safely ignore this email.</p>
      <div class="footer">
        &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
}
