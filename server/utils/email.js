import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.astermedsupplies.co.ke',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'seth@astermedsupplies.co.ke',
    pass: process.env.SMTP_PASS || 'seth123qP1',
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const sendWelcomeEmail = async (to, username) => {
  try {
    const info = await transporter.sendMail({
      from: `"MyKitchen" <${process.env.SMTP_FROM || 'seth@astermedsupplies.co.ke'}>`,
      to,
      subject: "Welcome to MyKitchen! 🍳",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2e7d32;">Hello ${username}, Welcome to the Family! 🌿</h1>
          
          <p style="font-size: 16px; line-height: 1.6;">
            We are absolutely thrilled to have you here! This is an open source application inspired by the desire called <strong>variety</strong>.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6;">
             Come, let's make them onions cry in a happy mood! 🧅✨
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            Feel free to explore, share, and add more recipes. Your creativity is exactly what this kitchen needs.
          </p>

          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-weight: bold;">
              ⚠️ A Little Note:
            </p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">
              Since some of our data was scraped from the internet, it might contain a couple of errors. If you spot anything off, feel free to speak out for corrections!
            </p>
          </div>

          <div style="background-color: #f1f8e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #558b2f; font-weight: bold;">
              📸 Community Contribution:
            </p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">
              You might notice some recipes are missing images. If you cook something delicious, you can contribute by uploading a picture! Help us make the cookbook vibrant and visual.
            </p>
          </div>

          <p style="font-size: 16px;">
            Happy Cooking,<br>
            The MyKitchen Team
          </p>
        </div>
      `,
    });
    console.log("Welcome email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
};
