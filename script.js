import 'buffer';
import 'process';
import { Amplify } from 'aws-amplify';
import { signIn, signUp, signOut, getCurrentUser, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import amplifyconfig from './src/amplifyconfiguration.json';

Amplify.configure(amplifyconfig);

// --- Page Routing and Auth Check ---
(async () => {
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.endsWith('/') || currentPath.endsWith('index.html') || currentPath.includes('verify.html') || currentPath.includes('forgot-password.html');

    try {
        await getCurrentUser();
        // User is authenticated
        if (isAuthPage) {
            window.location.href = 'home.html';
        }
    } catch (error) {
        // User is not authenticated
        if (!isAuthPage) {
            window.location.href = 'index.html';
        }
    }
})();


// --- Logic for index.html (Login/Signup Page) ---
if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) {
    const container = document.getElementById('auth-container-animated');
    const signInForm = document.querySelector('.form-container.sign-in');
    const signUpForm = document.querySelector('.form-container.sign-up');

    // --- Device-specific form toggling ---
    if (window.innerWidth <= 768) {
        // --- MOBILE ---
        const toggleContainer = document.querySelector('.toggle-container');
        if (toggleContainer) {
            toggleContainer.remove(); // Remove the element entirely on mobile
        }

        const showLoginMobileBtn = document.getElementById('show-login-mobile');
        const showSignupMobileBtn = document.getElementById('show-signup-mobile');

        signInForm.style.display = 'flex';
        signUpForm.style.display = 'none';

        if (showSignupMobileBtn) {
            showSignupMobileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                signInForm.style.display = 'none';
                signUpForm.style.display = 'flex';
            });
        }
        if (showLoginMobileBtn) {
            showLoginMobileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                signInForm.style.display = 'flex';
                signUpForm.style.display = 'none';
            });
        }
    } else {
        // --- DESKTOP ---
        const registerBtn = document.getElementById('register');
        const loginBtn = document.getElementById('login');
        if (registerBtn) registerBtn.addEventListener('click', () => container.classList.add('active'));
        if (loginBtn) loginBtn.addEventListener('click', () => container.classList.remove('active'));
    }

    // --- Signup Logic ---
    const signupPasswordInput = document.getElementById('signup-password');
    const strengthMeterContainer = document.getElementById('strength-meter-container');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    const signupFormEl = document.getElementById('signup-form');

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
                strengthBar.className = 'strength-bar';
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
            strengthBar.className = 'strength-bar';
            if (strengthPercentage === 100) strengthBar.classList.add('strong');
            else if (strengthPercentage >= 60) strengthBar.classList.add('medium');
            else strengthBar.classList.add('weak');
        });
        strengthMeterContainer.addEventListener('click', () => {
            if (strengthMeterContainer.classList.contains('transformed')) {
                signupFormEl.requestSubmit();
            }
        });
    }

    // --- Login Logic ---
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const loginButtonContainer = document.getElementById('login-button-container');
    const loginFormEl = document.getElementById('login-form');

    function validateLoginInputs() {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        loginButtonContainer.classList.toggle('transformed', email.length > 0 && password.length > 0);
    }
    if (loginEmailInput && loginPasswordInput) {
        loginEmailInput.addEventListener('input', validateLoginInputs);
        loginPasswordInput.addEventListener('input', validateLoginInputs);
    }
    if (loginButtonContainer) {
        loginButtonContainer.addEventListener('click', () => {
            if (loginButtonContainer.classList.contains('transformed')) {
                loginFormEl.requestSubmit();
            }
        });
    }

    // --- Form Submissions ---
    if (loginFormEl) {
        loginFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await signIn({ username: loginEmailInput.value, password: loginPasswordInput.value });
                window.location.href = 'home.html';
            } catch (error) {
                console.error('Giriş hatası:', error);
                if (error.name === 'UserNotConfirmedException') {
                    window.location.href = `verify.html?email=${encodeURIComponent(loginEmailInput.value)}`;
                } else {
                    alert(error.message);
                }
            }
        });
    }
    if (signupFormEl) {
        signupFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = signupPasswordInput.value;
            try {
                await signUp({ username: email, password, attributes: { email } });
                alert('Hesap başarıyla oluşturuldu! Lütfen giriş yapın.');
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Kayıt hatası:', error);
                alert(error.message);
            }
        });
    }
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
            window.location.href = 'index.html';
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
            if (error.name === 'UserNotConfirmedException') {
                const { resendSignUpCode } = await import('aws-amplify/auth');
                try {
                    await resendSignUpCode({ username: emailInput.value });
                    alert('Hesabınız henüz doğrulanmamış. Şifrenizi sıfırlamadan önce e-postanızı doğrulamanız gerekiyor. Size yeni bir doğrulama kodu gönderdik, lütfen e-postanızı kontrol edin.');
                    window.location.href = `verify.html?email=${encodeURIComponent(emailInput.value)}`;
                } catch (resendError) {
                    console.error('Doğrulama kodu gönderme hatası:', resendError);
                    alert('Bir hata oluştu. Lütfen tekrar deneyin.');
                }
            } else {
                alert(error.message);
            }
        }
    });

    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const confirmationCode = document.getElementById('reset-code').value;
        const newPassword = document.getElementById('new-password').value;
        try {
            await confirmResetPassword({ username: emailInput.value, confirmationCode, newPassword });
            alert('Şifren başarıyla değiştirildi. Şimdi giriş yapabilirsin.');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Yeni şifre ayarlama hatası:', error);
            alert(error.message);
        }
    });
}

// --- Logic for home.html ---
if (window.location.pathname.includes('home.html')) {
    const dailyTaskText = document.getElementById('daily-task-text');
    const streakCircles = document.querySelectorAll('.streak-circle');

    const goodDeeds = [
        "Bir sokak hayvanına su ver.",
        "Yaşlı bir komşunun poşetlerini taşımasına yardım et.",
        "Toplu taşımada birine yer ver.",
        "Bugün birine içten bir şekilde iltifat et.",
        "Çevrendeki bir çöpü yere atma, çöp kutusuna at.",
        "Bir arkadaşına nasıl olduğunu sor.",
        "Okuduğun güzel bir kitabı birine hediye et.",
        "Bir fidan dik."
    ];

    // Rastgele bir görev seç ve göster
    function setRandomDeed() {
        const randomIndex = Math.floor(Math.random() * goodDeeds.length);
        dailyTaskText.textContent = goodDeeds[randomIndex];
    }

    // Seri dairelerine tıklama olayı ekle
    streakCircles.forEach(circle => {
        circle.addEventListener('click', () => {
            circle.classList.toggle('completed');
        });
    });

    // Sayfa yüklendiğinde fonksiyonları çalıştır
    setRandomDeed();
}
