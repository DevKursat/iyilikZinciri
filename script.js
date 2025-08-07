import 'buffer';
import 'process';
import { Amplify } from 'aws-amplify';
import { signIn, signUp, signOut, getCurrentUser, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import amplifyconfig from './src/amplifyconfiguration.json';

Amplify.configure(amplifyconfig);

// Function to get the correct base path for redirects
function getBasePath() {
    let path = window.location.pathname;
    // If the path includes a file name (e.g., index.html), remove it.
    const lastSlashIndex = path.lastIndexOf('/');
    // Return the path up to the last slash, ensuring it ends with a slash.
    return path.substring(0, lastSlashIndex + 1);
}

// --- Page Routing and Auth Check ---
// --- Page Routing and Auth Check ---
(async () => {
    const currentPath = window.location.pathname;
    const basePath = getBasePath();
    const normalizedPath = currentPath.endsWith('/') ? currentPath : `${currentPath}/`;

    const isAuthPage = normalizedPath === `${basePath}` || normalizedPath === `${basePath}index.html/`;
    const isVerifyPage = currentPath.includes('verify.html');
    const isForgotPasswordPage = currentPath.includes('forgot-password.html');

    // If on the login page, check if user is already signed in and redirect them.
    if (isAuthPage) {
        try {
            const { attributes } = await getCurrentUser();
            // User is already signed in, redirect them to the correct page.
            if (attributes && attributes['custom:profil_kurulumu_tamamlandi'] === 'evet') {
                window.location.href = `${basePath}home.html`;
            } else {
                window.location.href = `${basePath}profile-setup.html`;
            }
            return; // Stop further script execution for this page
        } catch (error) {
            // No user is signed in, which is the expected state on the login page.
            // Do nothing and let the user sign in.
        }
    }

    // For all other protected pages, ensure the user is authenticated.
    const isPublicPage = isAuthPage || isVerifyPage || isForgotPasswordPage;
    if (!isPublicPage) {
        try {
            await getCurrentUser();
            // User is authenticated, they can stay on the page.
        } catch (error) {
            // User is NOT authenticated, redirect to login.
            window.location.href = `${basePath}index.html`;
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
                const { attributes } = await getCurrentUser();
                if (attributes && attributes['custom:profil_kurulumu_tamamlandi'] === 'evet') {
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
                alert('Hesap başarıyla oluşturuldu! Doğrulama kodu e-postana gönderildi. Spam (gereksiz) klasörünü kontrol etmeyi unutma.');
                window.location.href = `${getBasePath()}verify.html?email=${encodeURIComponent(email)}`;
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

    const resendContainer = document.getElementById('resend-code-container');
    const securityMessages = [
        "Bu sayfa tamamen güvenlidir.",
        "E-posta ulaşmadıysa spam (gereksiz) klasörünüzü kontrol edin."
    ];
    let messageIndex = 0;

    function setupResendButton() {
        resendContainer.innerHTML = `
            <div id="resend-code-progress"></div>
            <div id="resend-code-text"></div>
        `;
        const progressEl = document.getElementById('resend-code-progress');
        const textEl = document.getElementById('resend-code-text');
        
        let countdown = 30; // Countdown changed to 30 seconds
        resendContainer.classList.remove('ready');
        progressEl.style.transition = 'none'; // Disable transition for immediate reset
        progressEl.style.width = '0%';
        
        const interval = setInterval(() => {
            countdown--;
            const progressPercentage = ((30 - countdown) / 30) * 100;
            progressEl.style.transition = 'width 1s linear'; // Re-enable for smooth progress
            progressEl.style.width = `${progressPercentage}%`;
            textEl.textContent = `TEKRAR GÖNDER (${countdown}s)`;

            if (countdown <= 0) {
                clearInterval(interval);
                resendContainer.classList.add('ready');
                textEl.textContent = 'KODU TEKRAR GÖNDER';
            }
        }, 1000);
    }

    resendContainer.addEventListener('click', async () => {
        if (resendContainer.classList.contains('ready')) {
            if (!emailFromUrl) return alert('E-posta adresi bulunamadı.');
            try {
                await resendSignUpCode({ username: emailFromUrl });
                alert('Doğrulama kodu tekrar gönderildi. Spam (gereksiz) klasörünü kontrol etmeyi unutma.');
                setupResendButton(); // Restart timer
            } catch (error) {
                console.error('Kodu tekrar gönderme hatası:', error);
                alert(error.message);
            }
        } else {
            alert(securityMessages[messageIndex]); // Changed to alert
            messageIndex = (messageIndex + 1) % securityMessages.length;
        }
    });

    setupResendButton(); // Initial setup
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
            alert('Sıfırlama kodu e-postana gönderildi. Spam (gereksiz) klasörünü kontrol etmeyi unutma.');
            
            // Switch forms by toggling the 'hidden' class, which is the correct way
            sendCodeForm.classList.add('hidden');
            resetPasswordForm.classList.remove('hidden');

        } catch (error) {
            console.error('Şifre sıfırlama hatası:', error);

            if (error.name === 'UserNotConfirmedException' || error.name === 'InvalidParameterException') {
                const { resendSignUpCode } = await import('aws-amplify/auth');
                try {
                    await resendSignUpCode({ username: emailInput.value });
                    alert('Şifrenizi sıfırlamak için önce e-postanızı doğrulamanız gerekiyor. Size yeni bir doğrulama kodu gönderdik, lütfen spam (gereksiz) klasörünüzü kontrol edin.');
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
    (async () => {
        try {
            const { attributes } = await getCurrentUser();
            if (attributes && attributes['custom:profil_kurulumu_tamamlandi'] === 'evet') {
                window.location.href = `${getBasePath()}home.html`;
                return; // Stop further execution
            }
        } catch (error) {
            // Not logged in, proceed with setup page logic
        }
    })();

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

    // --- Adım 1: Cinsiyet Seçimi ---
    const genderOptions = document.querySelectorAll('.gender-option');
    const genderInput = document.getElementById('gender');
    genderOptions.forEach(option => {
        option.addEventListener('click', () => {
            genderOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            genderInput.value = option.dataset.gender;
        });
    });

    document.getElementById('step-1-btn').addEventListener('click', () => {
        const nameInput = document.getElementById('name');
        const birthdateInput = document.getElementById('birthdate');

        if (nameInput.value.trim() !== '' && birthdateInput.value.trim() !== '' && genderInput.value.trim() !== '') {
            currentStep = 1;
            showStep(currentStep);
        } else {
            alert('Lütfen devam etmeden önce tüm alanları doldurun.');
        }
    });

    // --- Adım 2: İlgi Alanları ---
    const preferences = [];
    const preferenceCards = document.querySelectorAll('.preference-card');
    const step2Btn = document.getElementById('step-2-btn');
    const completeProfileBtn = document.getElementById('complete-profile-btn');
    const interestCounter = document.getElementById('interest-counter');

    preferenceCards.forEach(card => {
        card.addEventListener('click', () => {
            if (preferences.includes(card.dataset.preference)) {
                // Deselect
                preferences.splice(preferences.indexOf(card.dataset.preference), 1);
                card.classList.remove('selected');
            } else {
                // Select
                if (preferences.length < 6) {
                    preferences.push(card.dataset.preference);
                    card.classList.add('selected');
                } else {
                    alert('En fazla 6 ilgi alanı seçebilirsiniz.');
                }
            }
            // Update counter
            interestCounter.textContent = `(${preferences.length}/6)`;
            // Validate button state
            step2Btn.disabled = preferences.length < 1;
            completeProfileBtn.disabled = preferences.length < 1;
        });
    });

    step2Btn.addEventListener('click', () => {
        if (preferences.length >= 1) {
            currentStep = 2;
            showStep(currentStep);
        } else {
            alert('Lütfen en az 1 ilgi alanı seçin.');
        }
    });

    const submitProfile = async (goToHome = true) => {
        try {
            const name = document.getElementById('name').value;
            const birthdate = document.getElementById('birthdate').value;
            const gender = document.getElementById('gender').value;
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
                    gender,
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

            if (goToHome) {
                window.location.href = `${getBasePath()}home.html`;
            }

        } catch (error) {
            console.error('Profil güncelleme hatası:', error);
            alert('Profiliniz güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
    };

    completeProfileBtn.addEventListener('click', () => {
        if (preferences.length >= 1) {
            submitProfile();
        } else {
            alert('Lütfen en az 1 ilgi alanı seçin.');
        }
    });

    document.getElementById('step-3-form').addEventListener('submit', (e) => {
        e.preventDefault();
        submitProfile();
    });

    // Initial State
    step2Btn.disabled = true;
    completeProfileBtn.disabled = true;
    showStep(currentStep);
}
