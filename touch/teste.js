// === POST: Send Password Reset Email ===
router.post('/password-reset', async (req, res) => {
    const { email } = req.body;

    try {
        const bodyshop = await Bodyshop.findOne({ where: { email } });
        if (!bodyshop) {
            return res.render('bodyshop-password-reset', { error: 'No account found with this email.' });
        }

        // Generate reset token
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        bodyshop.resetToken = resetToken;
        bodyshop.resetTokenExpiry = resetTokenExpiry;
        await bodyshop.save();

        // Send reset email
        const transporter = nodemailer.createTransport({
            host: 'smtp.ionos.co.uk',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const resetUrl = `http://${req.headers.host}/bodyshop/reset-password/${resetToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
            <div>
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your password. Click the link below to reset it:</p>
                <a href="${resetUrl}" style="background-color:#25D366;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password</a>
                <p>This link will expire in 1 hour. If you did not request a password reset, you can ignore this email.</p>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Password reset email sent to ${email}`);

        res.render('bodyshop-password-reset', { error: 'Password reset link sent to your email.' });
    } catch (err) {
        console.error(err);
        res.render('bodyshop-password-reset', { error: 'Failed to send reset email. Try again later.' });
    }
});

