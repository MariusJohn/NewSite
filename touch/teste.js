// === POST Registration Handler with Email Verification ===
router.post('/register', async (req, res) => {
    const { name, email, password, confirmPassword, area } = req.body;

    if (password !== confirmPassword) {
        return res.render('bodyshop-register', { error: 'Passwords do not match.' });
    }

    try {
        const existing = await Bodyshop.findOne({ where: { email } });
        if (existing) {
            return res.render('bodyshop-register', { error: 'This email is already registered.' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const verificationToken = require('crypto').randomBytes(32).toString('hex');

        await Bodyshop.create({ name, email, password: hashed, area, verificationToken });

        // Send verification email
        const verificationUrl = `http://${req.headers.host}/bodyshop/verify/${verificationToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Bodyshop Account',
            html: `
            <div>
                <h2>Welcome to MC Quote</h2>
                <p>Thank you for registering your bodyshop. Please verify your email by clicking the link below:</p>
                <a href="${verificationUrl}" style="background-color:#25D366;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Verify Email</a>
                <p>If you did not register, please ignore this email.</p>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Verification email sent to ${email}`);

        res.render('bodyshop-register', { error: 'Registration successful! Please check your email to verify your account.' });
    } catch (err) {
        console.error(err);
        res.render('bodyshop-register', { error: 'Registration failed. Try again later.' });
    }
});