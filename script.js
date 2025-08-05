import 'buffer';
import 'process';
import { Amplify } from 'aws-amplify';
import { signIn, signUp, signOut, getCurrentUser } from 'aws-amplify/auth';
import amplifyconfig from './src/amplifyconfiguration.json';

Amplify.configure(amplifyconfig);

// Function to get the correct base path for redirects
function getBasePath() {
    return window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
        ? '/'
        : '/Good-Loop_iyilik-zinciri_/';
}

// Function to check if user is authenticated and redirect
async function checkAuthAndRedirect() {
    try {
        await getCurrentUser();
        if (!window.location.pathname.includes('home.html')) {
            window.location.href = `${getBasePath()}home.html`;
        }
    } catch (error) {
        const allowedPaths = ['index.html', 'verify.html', 'forgot-password.html'];
        const currentFile = window.location.pathname.split('/').pop();
        if (!allowedPaths.includes(currentFile) && window.location.pathname !== getBasePath()) {
            window.location.href = `${getBasePath()}index.html`;
        }
    }
}

checkAuthAndRedirect();

// --- Logic for index.html (Login/Signup Page) ---
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
    const signupForm = document.getElementById('signup-form');

    const toggleForm = (isRegister) => {
        container.classList.toggle('active', isRegister);
    };

    if (registerBtn) registerBtn.addEventListener('click', () => toggleForm(true));
    if (loginBtn) loginBtn.addEventListener('click', () => toggleForm(false));
    if (showLoginMobileBtn) showLoginMobileBtn.addEventListener('click', (e) => { e.preventDefault(); toggleForm(false); });
    if (showSignupMobileBtn) showSignupMobileBtn.addEventListener('click', (e) => { e.preventDefault(); toggleForm(true); });

    if (signupPasswordInput) {
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
                strengthBar.style.width = '0%';
                return;
            }

            let strength = 0;
            let firstUnmetRequirement = null;
            requirements.forEach(req => {
                if (req.regex.test(password)) strength++;
                else if (!firstUnmetRequirement) firstUnmetRequirement = req.message;
            });

            const strengthPercentage = (strength / requirements.length) * 100;
            strengthBar.style.width = `${strengthPercentage}%`;

            if (strength === requirements.length) {
                strengthText.textContent = "Kayıt Ol";
                strengthMeterContainer.classList.add('transformed');
            } else {
                strengthText.textContent = `${strength}/${requirements.length}: ${firstUnmetRequirement || ''}`;
                strengthMeterContainer.classList.remove('transformed');
            }

            strengthBar.className = 'strength-bar'; // Reset classes
            if (strengthPercentage === 100) strengthBar.classList.add('strong');
            else if (strengthPercentage >= 60) strengthBar.classList.add('medium');
            else strengthBar.classList.add('weak');
        });

        strengthMeterContainer.addEventListener('click', () => {
            if (strengthMeterContainer.classList.contains('transformed')) {
                signupForm.requestSubmit();
            }
        });
    }

    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            await signIn({ username: email, password });
            window.location.href = `${getBasePath()}home.html`;
        } catch (error) {
            console.error('Giriş hatası:', error);
            if (error.name === 'UserNotConfirmedException') {
                window.location.href = `${getBasePath()}verify.html?email=${encodeURIComponent(email)}`;
            } else {
                alert(error.message);
            }
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        try {
            await signUp({ username: email, password, attributes: { email } });
            window.location.href = `${getBasePath()}verify.html?email=${encodeURIComponent(email)}`;
        } catch (error) {
            console.error('Kayıt hatası:', error);
            alert(error.message);
        }
    });
}

// --- Logic for verify.html ---
if (window.location.pathname.includes('verify.html')) {
    const { confirmSignUp, resendSignUpCode } = await import('aws-amplify/auth');
    
    const emailDisplay = document.getElementById('verify-email-display');
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromUrl = urlParams.get('email');
    if (emailFromUrl) emailDisplay.textContent = emailFromUrl;

    document.getElementById('verify-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('verification-code').value;
        if (!emailFromUrl || !code) return alert('E-posta veya doğrulama kodu eksik.');
        try {
            await confirmSignUp({ username: emailFromUrl, confirmationCode: code });
            alert('E-posta başarıyla doğrulandı! Lütfen giriş yapın.');
            window.location.href = `${getBasePath()}index.html`;
        } catch (error) {
            console.error('Doğrulama hatası:', error);
            alert(error.message);
        }
    });

    document.getElementById('resend-code-button').addEventListener('click', async (e) => {
        e.preventDefault();
        if (!emailFromUrl) return alert('E-posta adresi bulunamadı.');
        try {
            await resendSignUpCode({ username: emailFromUrl });
            alert('Doğrulama kodu tekrar gönderildi.');
        } catch (error) {
            console.error('Kodu tekrar gönderme hatası:', error);
            alert(error.message);
        }
    });
}

// --- Logic for forgot-password.html ---
if (window.location.pathname.includes('forgot-password.html')) {
    const { resetPassword, confirmResetPassword } = await import('aws-amplify/auth');
    
    const sendCodeForm = document.getElementById('send-code-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const emailInput = document.getElementById('reset-email');

    sendCodeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await resetPassword({ username: emailInput.value });
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
        const confirmationCode = document.getElementById('reset-code').value;
        const newPassword = document.getElementById('new-password').value;
        try {
            await confirmResetPassword({ username: emailInput.value, confirmationCode, newPassword });
            alert('Şifren başarıyla değiştirildi. Şimdi giriş yapabilirsin.');
            window.location.href = `${getBasePath()}index.html`;
        } catch (error) {
            console.error('Yeni şifre ayarlama hatası:', error);
            alert(error.message);
        }
    });
}

// --- Logic for home.html ---
if (window.location.pathname.includes('home.html')) {
    document.getElementById('logout-button').addEventListener('click', async () => {
        try {
            await signOut();
            window.location.href = `${getBasePath()}index.html`;
        } catch (error) {
            console.error('Çıkış yapma hatası:', error);
            alert(error.message);
        }
    });
}