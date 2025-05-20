<style>
    .login-wrapper {
        /* Your existing login wrapper styles */
    }

    .login-form {
        /* Your existing login form styles */
    }

    .error-message {
        display: block;
        color: red;
        font-size: 0.8em;
        margin-top: 5px;
    }

    .login-btn {
        /* Your existing login button styles */
    }

    .forgot-password {
        /* Your existing forgot password link styles */
    }

    .password-container {
        position: relative;
        display: flex;
        align-items: center;
    }

    .password-container input[type="password"],
    .password-container input[type="text"] {
        width: 100%;
        padding-right: 30px; /* Make space for the toggle icon */
    }

    .password-toggle {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;
        user-select: none;
    }
</style>