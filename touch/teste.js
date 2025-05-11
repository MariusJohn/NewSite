(async () => {
    console.log("Running immediate test...");
    try {
        const info = await transporter.sendMail({
            from: `"MC Quote" <${process.env.EMAIL_USER}>`,
            to: "your-test-email@your-domain.com",
            subject: "Test Email",
            text: "This is a test email from MC Quote."
        });
        console.log("Test email sent:", info.messageId);
    } catch (error) {
        console.error("Error sending test email:", error);
    }
})();