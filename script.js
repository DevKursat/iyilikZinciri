document.addEventListener('DOMContentLoaded', () => {

    const container = document.getElementById('auth-container-animated');
    const showLoginBtn = document.getElementById('show-login');
    const showSignupBtn = document.getElementById('show-signup');
    const showLoginMobileBtn = document.getElementById('show-login-mobile');
    const showSignupMobileBtn = document.getElementById('show-signup-mobile');
    const forgotPasswordMobileBtn = document.getElementById('forgot-password-mobile');
    const colorOverlay = document.getElementById('color-overlay');

    // Sayfanın başlangıçta Kayıt Ol formuyla açılması için
    if (container) {
        container.classList.add('active');
    }

    const triggerColorOverlay = (type) => {
        if (colorOverlay) {
            colorOverlay.classList.remove('login-color', 'signup-color');
            colorOverlay.classList.add(type === 'login' ? 'login-color' : 'signup-color');
            colorOverlay.classList.add('active');
            setTimeout(() => {
                colorOverlay.classList.remove('active');
            }, 700); // Match CSS transition duration
        }
    };

    if (container && showLoginBtn && showSignupBtn) {
        showSignupBtn.addEventListener('click', () => {
            triggerColorOverlay('signup');
            setTimeout(() => {
                container.classList.add('active');
            }, 300); // Delay to allow overlay to start spreading
        });

        showLoginBtn.addEventListener('click', () => {
            triggerColorOverlay('login');
            setTimeout(() => {
                container.classList.remove('active');
            }, 300); // Delay to allow overlay to start spreading
        });
    }

    // Mobil butonlar için olay dinleyicileri
    if (showLoginMobileBtn) {
        showLoginMobileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            triggerColorOverlay('login');
            setTimeout(() => {
                container.classList.remove('active');
            }, 300); // Delay to allow overlay to start spreading
        });
    }

    if (showSignupMobileBtn) {
        showSignupMobileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            triggerColorOverlay('signup');
            setTimeout(() => {
                container.classList.add('active');
            }, 300); // Delay to allow overlay to start spreading
        });
    }

    if (forgotPasswordMobileBtn) {
        forgotPasswordMobileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Şifre sıfırlama özelliği henüz aktif değil. Lütfen yöneticinizle iletişime geçin.');
        });
    }

    // Form gönderme işlemleri (Firebase ile)
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            try {
                await window.firebaseSignInWithEmailAndPassword(window.firebaseAuth, email, password);
                alert('Giriş başarılı!');
                // Başarılı giriş sonrası yönlendirme veya işlem
                // window.location.href = '/dashboard'; 
            } catch (error) {
                console.error('Giriş hatası:', error);
                alert(error.message);
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            try {
                await window.firebaseCreateUserWithEmailAndPassword(window.firebaseAuth, email, password);
                alert('Kayıt başarılı! Lütfen e-postanıza gönderilen doğrulama linkine tıklayın.');
                // Otomatik olarak giriş yapma ekranına geçiş
                container.classList.remove('active');
            } catch (error) {
                console.error('Kayıt hatası:', error);
                alert(error.message);
            }
        });
    }

});