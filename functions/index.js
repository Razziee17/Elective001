const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "francistonzo5@gmail.com",
    pass: "thxqwwafrhgrswap",
  },
});

exports.sendOtpEmail = functions
    .region("us-central1")
    .https.onCall(async (data, context) => {
      const {email, otp} = data;

      if (!email || !otp) {
        functions.logger.error("Missing email or OTP", {email, otp});
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Email and OTP are required",
        );
      }

      const mailOptions = {
        from: "VET-PLUS CLINIC <francistonzo5@gmail.com>",
        to: email,
        subject: "Your OTP Code for Password Reset",
        text: `Your OTP code is: ${otp}`,
        html:
        `<p>Your OTP code for password reset is: <strong>${otp}</strong></p>` +
        `<p>This code is valid for 10 minutes.</p>`,
      };

      try {
        await transporter.sendMail(mailOptions);
        functions.logger.info(`OTP ${otp} sent to ${email}`, {email, otp});
        return {success: true, message: "OTP sent successfully"};
      } catch (error) {
        functions.logger.error(
            "Error sending email:",
            error.message,
            {email, error},
        );
        throw new functions.https.HttpsError(
            "internal",
            `Failed to send email: ${error.message}`,
        );
      }
    });
