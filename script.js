document.addEventListener('DOMContentLoaded', () => {
    
    // Amplify'ı yapılandır
    try {
        Amplify.configure({
            Auth: {
                region: 'eu-north-1',
                userPoolId: 'eu-north-1_brdMkzj67',
                userPoolWebClientId: '11ri73f3j2ma53auguuaaas09l',
                oauth: {
                    domain: 'iyilik-zinciri-kursat.auth.eu-north-1.amazoncognito.com',
                    scope: ['phone', 'email', 'openid', 'profile', 'aws.cognito.signin.user.admin'],
                    redirectSignIn: window.location.origin,
                    redirectSignOut: window.location.origin,
                    responseType: 'code'
                }
            }
        });
    } catch (e) {
        console.error("Amplify yapılandırma hatası:", e);
    }

    const container = document.getElementById('auth-container-animated');
    const showLoginBtn = document.getElementById('show-login');
    const showSignupBtn = document.getElementById('show-signup');

    if (container && showLoginBtn && showSignupBtn) {
        showSignupBtn.addEventListener('click', () => {
            container.classList.add('active');
        });

        showLoginBtn.addEventListener('click', () => {
            container.classList.remove('active');
        });
    }

    // Form gönderme işlemleri
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            try {
                await Amplify.Auth.signIn(email, password);
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
                await Amplify.Auth.signUp({ username: email, password, attributes: { email } });
                alert('Kayıt başarılı! Lütfen e-postanıza gönderilen doğrulama linkine tıklayın.');
                // Otomatik olarak giriş yapma ekranına geçiş
                container.classList.remove('active');
            } catch (error) {
                console.error('Kayıt hatası:', error);
                alert(error.message);
            }
        });
    }

    // Sosyal medya giriş fonksiyonu
    const socialLogin = async (provider) => {
        try {
            await Amplify.Auth.federatedSignIn({ provider });
        } catch (error) {
            console.error(`${provider} ile giriş hatası:`, error);
        }
    };

    // Sosyal medya butonları
    document.getElementById('google-login-btn')?.addEventListener('click', (e) => { e.preventDefault(); socialLogin('Google'); });
    document.getElementById('apple-login-btn')?.addEventListener('click', (e) => { e.preventDefault(); socialLogin('Apple'); });
    document.getElementById('google-signup-btn')?.addEventListener('click', (e) => { e.preventDefault(); socialLogin('Google'); });
    document.getElementById('apple-signup-btn')?.addEventListener('click', (e) => { e.preventDefault(); socialLogin('Apple'); });

});
