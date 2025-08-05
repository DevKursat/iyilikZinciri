// Function to get the correct base path for redirects
function getBasePath() {
    // For local development, path is relative to root.
    // For GitHub Pages, it's /Good-Loop_iyilik-zinciri_/
    return window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
        ? '/'
        : '/Good-Loop_iyilik-zinciri_/';
}

// Function to check if user is authenticated and redirect
async function checkAuthAndRedirect() {
    try {
        await getCurrentUser();
        // User is authenticated, redirect to home.html if not already there
        if (!window.location.pathname.includes('home.html')) {
            window.location.href = `${getBasePath()}home.html`;
        }
    } catch (error) {
        // User is not authenticated.
        const isLoginPage = window.location.pathname === getBasePath() || window.location.pathname === `${getBasePath()}index.html`;
        if (!isLoginPage && !window.location.pathname.includes('verify.html')) {
            window.location.href = `${getBasePath()}index.html`;
        }
    }
}

// Execute checkAuthAndRedirect on page load for all pages except verify.html
if (!window.location.pathname.includes('verify.html')) {
    checkAuthAndRedirect();
}

// Logic for index.html (Login/Signup Page)
if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) {
    const container = document.getElementById('auth-container-animated');
    const registerBtn = document.getElementById('register');
    const loginBtn = document.getElementById('login');
    const showLoginMobileBtn = document.getElementById('show-login-mobile');
    const showSignupMobileBtn = document.getElementById('show-signup-mobile');

    const signupPasswordInput = document.getElementById('signup-password');
    const strengthMeterContainer = document.getElementById('strength-meter-container');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');

    const toggleForm = (isRegister) => {
        if (container) {
            if (isRegister) {
                container.classList.add('active');
            } else {
                container.classList.remove('active');
            }
        }
    };

    if (registerBtn) registerBtn.addEventListener('click', () => toggleForm(true));
    if (loginBtn) loginBtn.addEventListener('click', () => toggleForm(false));
    if (showLoginMobileBtn) showLoginMobileBtn.addEventListener('click', (e) => { e.preventDefault(); toggleForm(false); });
    if (showSignupMobileBtn) showSignupMobileBtn.addEventListener('click', (e) => { e.preventDefault(); toggleForm(true); });

    // Password Strength Logic
    if (signupPasswordInput) {
        // Initial state
        strengthText.textContent = "Kayıt Ol";

        signupPasswordInput.addEventListener('input', () => {
            const password = signupPasswordInput.value;
            const requirements = [
                { regex: /.{8,}/, message: "En az 8 karakter" },
                { regex: /[A-Z]/, message: "Büyük harf (A-Z)" },
                { regex: /[a-z]/, message: "Küçük harf (a-z)" },
                { regex: /[0-9]/, message: "Sayı (0-9)" },
                { regex: /[!@#$%^&*]/, message: "Özel karakter (!@#$%^&*)" }
            ];

            if (password.length === 0) {
                strengthText.textContent = "Kayıt Ol";
                strengthMeterContainer.classList.remove('transformed');
                strengthBar.style.width = `0%`;
                return;
            }

            let strength = 0;
            let firstUnmetRequirement = null;

            requirements.forEach(req => {
                if (req.regex.test(password)) {
                    strength++;
                } else if (!firstUnmetRequirement) {
                    firstUnmetRequirement = req.message;
                }
            });

            const strengthPercentage = (strength / requirements.length) * 100;
            strengthBar.style.width = `${strengthPercentage}%`;

            // Update text and colors
            if (strength === requirements.length) {
                strengthText.textContent = "Kayıt Ol";
                strengthMeterContainer.classList.add('transformed');
            } else {
                strengthText.textContent = `${strength}/${requirements.length}: ${firstUnmetRequirement || ''}`;
                strengthMeterContainer.classList.remove('transformed');
            }

            strengthBar.classList.remove('weak', 'medium', 'strong');
            if (strengthPercentage < 40) strengthBar.classList.add('weak');
            else if (strengthPercentage < 80) strengthBar.classList.add('medium');
            else strengthBar.classList.add('strong');
        });
    }

    // Form submission logic (Amplify)
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            try {
                await signIn({ username: email, password });
                alert('Giriş başarılı!');
                window.location.href = `${getBasePath()}home.html`;
            } catch (error) {
                console.error('Giriş hatası:', error);
                if (error.name === 'UserNotConfirmedException') {
                    alert('Hesabınız doğrulanmamış. Lütfen e-postanızı doğrulayın.');
                    window.location.href = `${getBasePath()}verify.html?email=${encodeURIComponent(email)}`;
                } else {
                    alert(error.message);
                }
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            try {
                await signUp({ username: email, password, attributes: { email } });
                alert('Kayıt başarılı! Lütfen e-postanıza gönderilen doğrulama linkine tıklayın.');
                window.location.href = `${getBasePath()}verify.html?email=${encodeURIComponent(email)}`;
            } catch (error) {
                console.error('Kayıt hatası:', error);
                alert(error.message);
            }
        });
    }
}

// Logic for verify.html (Email Verification Page)
if (window.location.pathname.includes('verify.html')) {
    const verifyForm = document.getElementById('verify-form');
    const verifyEmailInput = document.getElementById('verify-email');
    const verificationCodeInput = document.getElementById('verification-code');
    const resendCodeButton = document.getElementById('resend-code-button');

    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    if (emailFromUrl) {
        verifyEmailInput.value = emailFromUrl;
    }

    if (verifyForm) {
        verifyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = verifyEmailInput.value;
            const code = verificationCodeInput.value;
            try {
                await confirmSignUp({ username: email, confirmationCode: code });
                alert('E-posta başarıyla doğrulandı! Şimdi giriş yapılıyor...');
                window.location.href = `${getBasePath()}home.html`;
            } catch (error) {
                console.error('Doğrulama hatası:', error);
                alert(error.message);
            }
        });
    }

    if (resendCodeButton) {
        resendCodeButton.addEventListener('click', async () => {
            const email = verifyEmailInput.value;
            if (!email) {
                alert('Lütfen e-posta adresinizi girin.');
                return;
            }
            try {
                await resendSignUpCode({ username: email });
                alert('Doğrulama kodu tekrar gönderildi.');
            } catch (error) {
                console.error('Kodu tekrar gönderme hatası:', error);
                alert(error.message);
            }
        });
    }
}

// Logic for home.html (Home Page)
if (window.location.pathname.includes('home.html')) {
    const logoutButton = document.getElementById('logout-button');

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut();
                alert('Başarıyla çıkış yapıldı.');
                window.location.href = `${getBasePath()}index.html`;
            } catch (error) {
                console.error('Çıkış yapma hatası:', error);
                alert(error.message);
            }
        });
    }
}

// Logic for forgot-password.html
if (window.location.pathname.includes('forgot-password.html')) {
    const { resetPassword, confirmResetPassword } = await import('aws-amplify/auth');
    
    const sendCodeForm = document.getElementById('send-code-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const emailInput = document.getElementById('reset-email');

    sendCodeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        try {
            await resetPassword({ username: email });
            alert('Sıfırlama kodu e-postana gönderildi.');
            sendCodeForm.classList.add('hidden');
            resetPasswordForm.classList.remove('hidden');
        } catch (error) {
            console.error('Şifre sıfırlama hatası:', error);
            alert(error.message);
        }
    });

    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const confirmationCode = document.getElementById('reset-code').value;
        const newPassword = document.getElementById('new-password').value;
        try {
            await confirmResetPassword({ username: email, confirmationCode, newPassword });
            alert('Şifren başarıyla değiştirildi. Şimdi giriş yapabilirsin.');
            window.location.href = './index.html';
        } catch (error) {
            console.error('Yeni şifre ayarlama hatası:', error);
            alert(error.message);
        }
    });
}
