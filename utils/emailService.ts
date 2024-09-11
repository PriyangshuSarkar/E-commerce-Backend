import nodemailer from "nodemailer";

// Create a transporter object using the default SMTP transport
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // or any other email service
  port: +process.env.EMAIL_PORT!,
  auth: {
    user: process.env.EMAIL_USER, // your email address
    pass: process.env.EMAIL_PASS, // your email password
  },
});

export const sendEmail = async (to: string, subject: string, text: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send verification email");
  }
};

export const sendOtpEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER!, // Sender email address
    to: email, // Recipient email address
    subject: "Your OTP Code", // Email subject
    text: `Your OTP code is ${otp}. It expires in 10 minutes.`, // Email body
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
};
