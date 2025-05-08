<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Error</title>
    <link rel="stylesheet" href="/css/bodyshop-login.css">
</head>
<body>
<div class="error-container">
    <img src="/img/logo.png" alt="MC Quote Logo" class="error-logo">
    <h2>Login Error</h2>
    <% if (error) { %><p class="error-msg"><%= error %></p><% } %>
    <button onclick="window.location.href='/bodyshop/login'">Back to Login</button>
</div>
</body>
</html>