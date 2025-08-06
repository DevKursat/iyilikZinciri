import 'buffer';
import 'process';
import { Amplify } from 'aws-amplify';
import { signIn, signUp, signOut, getCurrentUser, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import amplifyconfig from './src/amplifyconfiguration.json';

Amplify.configure(amplifyconfig);

// Function to get the correct base path for redirects
function getBasePath() {
    const host = window.location.hostname;
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
        return '/';
    }
    return '/Good-Loop_iyilik-zinciri_/';
}

// --- Page Routing and Auth Check ---
(async () => {
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.endsWith('/') || currentPath.endsWith('index.html') || currentPath.includes('verify.html') || currentPath.includes('forgot-password.html');
    const isSetupPage = currentPath.includes('profile-setup.html');

    try {
        const { attributes } = await getCurrentUser();
        // User is authenticated
        if (attributes['custom:profil_kurulumu_tamamlandi'] !== 'evet' && !isSetupPage) {
            window.location.href = `${getBasePath()}profile-setup.html`;
        } else if (isAuthPage || (attributes['custom:profil_kurulumu_tamamlandi'] === 'evet' && isSetupPage)) {
            window.location.href = `${getBasePath()}home.html`;
        }
    } catch (error) {
        // User is not authenticated
        if (!isAuthPage && !isSetupPage) {
            window.location.href = `${getBasePath()}index.html`;
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
                
                // Check for profile setup immediately after sign-in
                const { attributes } = await getCurrentUser();
                if (attributes['custom:profil_kurulumu_tamamlandi'] === 'evet') {
                    window.location.href = `${getBasePath()}home.html`;
                } else {
                    window.location.href = `${getBasePath()}profile-setup.html`;
                }

            } catch (error) {
                console.error('Giriş hatası:', error);
                if (error.name === 'UserNotConfirmedException') {
                    window.location.href = `${getBasePath()}verify.html?email=${encodeURIComponent(loginEmailInput.value)}`;
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
                window.location.href = `${getBasePath()}index.html`;
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

            // Hem doğrulanmamış kullanıcılar hem de doğrulanmış e-postası olmayanlar için ortak çözüm
            if (error.name === 'UserNotConfirmedException' || error.name === 'InvalidParameterException') {
                const { resendSignUpCode } = await import('aws-amplify/auth');
                try {
                    await resendSignUpCode({ username: emailInput.value });
                    alert('Şifrenizi sıfırlamak için önce e-postanızı doğrulamanız gerekiyor. Size yeni bir doğrulama kodu gönderdik, lütfen e-postanızı kontrol edin.');
                    window.location.href = `${getBasePath()}verify.html?email=${encodeURIComponent(emailInput.value)}`;
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
            window.location.href = `${getBasePath()}index.html`;
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

// --- Logic for profile-setup.html ---
if (window.location.pathname.includes('profile-setup.html')) {
    const { updateUserAttributes } = await import('aws-amplify/auth');

    const steps = document.querySelectorAll('.setup-step');
    const progressBarInner = document.querySelector('.progress-bar-inner');
    let currentStep = 0;

    const updateProgressBar = () => {
        const progress = (currentStep / (steps.length - 1)) * 100;
        progressBarInner.style.width = `${progress}%`;
    };

    const showStep = (stepIndex) => {
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === stepIndex);
        });
        updateProgressBar();
    };

    // Adım 1 Formu - BUTON HATASI DÜZELTİLDİ
    document.getElementById('step-1-btn').addEventListener('click', () => {
        const nameInput = document.getElementById('name');
        const birthdateInput = document.getElementById('birthdate');

        if (nameInput.value.trim() !== '' && birthdateInput.value.trim() !== '') {
            currentStep = 1;
            showStep(currentStep);
        } else {
            alert('Lütfen devam etmeden önce isim ve doğum tarihi alanlarını doldurun.');
        }
    });

    // Adım 2 Tercihler
    const preferences = [];
    document.querySelectorAll('.preference-card').forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('selected');
            const preference = card.dataset.preference;
            if (preferences.includes(preference)) {
                preferences.splice(preferences.indexOf(preference), 1);
            } else {
                preferences.push(preference);
            }
        });
    });

    document.getElementById('step-2-btn').addEventListener('click', () => {
        currentStep = 2;
        showStep(currentStep);
    });

    // Adım 3 Formu ve Veri Gönderme
    document.getElementById('step-3-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const name = document.getElementById('name').value;
            const birthdate = document.getElementById('birthdate').value;
            const instagram = document.getElementById('instagram').value;
            const tiktok = document.getElementById('tiktok').value;
            const x = document.getElementById('x').value;
            const facebook = document.getElementById('facebook').value;
            const reddit = document.getElementById('reddit').value;
            const linkedin = document.getElementById('linkedin').value;
            const bereal = document.getElementById('bereal').value;

            await updateUserAttributes({
                userAttributes: {
                    name,
                    birthdate,
                    'custom:social_instagram': instagram,
                    'custom:social_tiktok': tiktok,
                    'custom:social_x': x,
                    'custom:social_facebook': facebook,
                    'custom:social_reddit': reddit,
                    'custom:social_linkedin': linkedin,
                    'custom:social_bereal': bereal,
                    'custom:iyilik_tercihleri': preferences.join(','),
                    'custom:profil_kurulumu_tamamlandi': 'evet'
                }
            });

            window.location.href = `${getBasePath()}home.html`;

        } catch (error) {
            console.error('Profil güncelleme hatası:', error);
            alert('Profiliniz güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
    });

    showStep(currentStep);
}
