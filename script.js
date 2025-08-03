// İyilik Zinciri Uygulaması Ana JavaScript Dosyası

// AWS Amplify kütüphanesini dahil et (index.html'de CDN'den yüklenecek)
// import { Amplify, Auth } from 'aws-amplify'; // Bu satır CDN kullanımı için gerekli değil

const app = {
    pages: {},
    nav: {},
    config: {
        cognito: {
            UserPoolId: 'eu-north-1_brdMkzj67', // Buraya senin UserPoolId'n gelecek
            ClientId: '11ri73f3j2ma53auguuaaas09l' // Buraya senin UserPoolClientId'n gelecek
        }
    },

    init() {
        console.log("İyilik Zinciri başlatılıyor...");

        // Amplify'ı yapılandır
        Amplify.configure({
            Auth: {
                mandatorySignIn: true,
                region: this.config.cognito.UserPoolId.split('_')[0], // Bölgeyi UserPoolId'den al
                userPoolId: this.config.cognito.UserPoolId,
                userPoolWebClientId: this.config.cognito.ClientId
            }
        });

        this.pages.intro = document.getElementById('intro-page');
        this.pages.authContainer = document.getElementById('auth-container');
        this.pages.feed = document.getElementById('feed-page');
        this.pages.profile = document.getElementById('profile-page');
        this.pages.login = document.getElementById('login-page');
        this.pages.signup = document.getElementById('signup-page');
        this.pages.confirmSignup = document.getElementById('confirm-signup-page');

        // Form geçiş linkleri
        const showLoginLink = document.getElementById('show-login');
        const showSignupLink = document.getElementById('show-signup');
        const logoutBtn = document.getElementById('logout-btn');
        const resendCodeLink = document.getElementById('resend-code');
        const startButton = document.getElementById('start-button');

        // Formları al
        this.forms = {};
        this.forms.login = document.getElementById('login-form');
        this.forms.signup = document.getElementById('signup-form');
        this.forms.confirmSignup = document.getElementById('confirm-signup-form');

        // Olay dinleyicileri
        this.nav.feedBtn.addEventListener('click', () => this.navigateTo('feed', true));
        this.nav.profileBtn.addEventListener('click', () => this.navigateTo('profile', true));
        showLoginLink.addEventListener('click', (e) => { e.preventDefault(); this.navigateToAuthSubPage('login'); });
        showSignupLink.addEventListener('click', (e) => { e.preventDefault(); this.navigateToAuthSubPage('signup'); });
        logoutBtn.addEventListener('click', () => this.auth.logout());
        resendCodeLink.addEventListener('click', async (e) => { 
            e.preventDefault();
            const email = document.getElementById('confirm-email').value;
            if (email) {
                await this.auth.resendConfirmationCode(email);
            } else {
                alert("Lütfen e-posta adresinizi girin.");
            }
        });
        startButton.addEventListener('click', () => this.navigateTo('authContainer'));

        this.forms.login.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            await this.auth.login(email, password);
        });

        this.forms.signup.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            await this.auth.signup(email, password);
        });

        this.forms.confirmSignup.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('confirm-email').value;
            const code = document.getElementById('confirmation-code').value;
            await this.auth.confirmSignUp(email, code);
        });

        // Uygulama yüklendiğinde oturum durumunu kontrol et
        this.checkAuthStatusAndNavigate();

        // Carousel'leri başlat
        this.startCarousel('intro-carousel');
        this.startCarousel('auth-intro-carousel');

        console.log("Uygulama başarıyla yüklendi ve hazır.");
    },

    async checkAuthStatusAndNavigate() {
        try {
            await Amplify.Auth.currentAuthenticatedUser();
            // Kullanıcı oturum açmışsa feed sayfasına git
            this.navigateTo('feed', true);
        } catch (error) {
            // Kullanıcı oturum açmamışsa tanıtım ekranına git
            this.navigateTo('intro');
        }
    },

    async navigateTo(pageName, isProtected = false) {
        // Eğer sayfa korumalıysa ve kullanıcı giriş yapmamışsa, giriş sayfasına yönlendir.
        if (isProtected) {
            try {
                await Amplify.Auth.currentAuthenticatedUser();
            } catch (error) {
                this.navigateTo('authContainer'); // Korumalı sayfaya erişim yoksa authContainer'a yönlendir
                return;
            }
        }

        // Ana uygulama arayüzünü (navigasyon menüsü) sadece korumalı sayfalarda göster
        document.getElementById('bottom-nav').style.display = (pageName === 'feed' || pageName === 'profile') ? 'flex' : 'none';

        // Tüm ana sayfaları gizle
        for (let pageId in this.pages) {
            if (this.pages[pageId].classList && this.pages[pageId].classList.contains('page')) {
                this.pages[pageId].classList.remove('active');
            }
        }
        // İstenen ana sayfayı göster
        this.pages[pageName].classList.add('active');

        // Eğer korumalı bir sayfaya gidiyorsak, navigasyon butonlarını güncelle
        if(isProtected) {
            // Tüm navigasyon butonlarının aktifliğini kaldır
            for (let navId in this.nav) {
                if(this.nav[navId].classList) this.nav[navId].classList.remove('active');
            }
            // İlgili navigasyon butonunu aktif et
            if(this.nav[pageName + 'Btn']) {
                this.nav[pageName + 'Btn'].classList.add('active');
            }
        }
    },

    navigateToAuthSubPage(subPageName) {
        const authSubPages = document.querySelectorAll('#auth-container .auth-sub-page');
        authSubPages.forEach(page => page.classList.remove('active'));
        document.getElementById(subPageName).classList.add('active');
    },

    startCarousel(carouselId) {
        const carousel = document.querySelector(`#${carouselId}`);
        if (!carousel) return;

        const items = carousel.querySelectorAll('.carousel-item');
        let currentIndex = 0;

        const showItem = (index) => {
            items.forEach((item, i) => {
                item.classList.remove('active');
                if (i === index) {
                    item.classList.add('active');
                }
            });
        };

        showItem(currentIndex);

        setInterval(() => {
            currentIndex = (currentIndex + 1) % items.length;
            showItem(currentIndex);
        }, 5000); // Her 5 saniyede bir geçiş
    },

    auth: {
        async login(email, password) {
            try {
                await Amplify.Auth.signIn(email, password);
                console.log("Giriş başarılı.");
                app.navigateTo('feed', true);
            } catch (error) {
                console.error("Giriş hatası:", error);
                alert(error.message);
            }
        },

        async signup(email, password) {
            try {
                await Amplify.Auth.signUp({ username: email, password, attributes: { email } });
                console.log("Kayıt başarılı.");
                alert("Kayıt başarılı! E-postanıza gelen doğrulama kodunu girerek hesabınızı onaylayın.");
                app.navigateToAuthSubPage('confirm-signup-page'); // Doğrulama kodu ekranına yönlendir
                document.getElementById('confirm-email').value = email; // E-postayı otomatik doldur
            } catch (error) {
                console.error("Kayıt hatası:", error);
                alert(error.message);
            }
        },

        async confirmSignUp(email, code) {
            try {
                await Amplify.Auth.confirmSignUp(email, code);
                console.log("Hesap doğrulandı.");
                alert("Hesabınız başarıyla doğrulandı! Şimdi giriş yapabilirsiniz.");
                app.navigateToAuthSubPage('login');
            } catch (error) {
                console.error("Doğrulama hatası:", error);
                alert(error.message);
            }
        },

        async resendConfirmationCode(email) {
            try {
                await Amplify.Auth.resendSignUpCode(email);
                console.log("Doğrulama kodu yeniden gönderildi.");
                alert("Doğrulama kodu e-postanıza yeniden gönderildi.");
            } catch (error) {
                console.error("Kodu yeniden gönderme hatası:", error);
                alert(error.message);
            }
        },

        async logout() {
            try {
                await Amplify.Auth.signOut();
                console.log("Çıkış başarılı.");
                app.navigateTo('authContainer');
            } catch (error) {
                console.error("Çıkış hatası:", error);
                alert(error.message);
            }
        }
    },

    loadFeed() {
        console.log("İlham Akışı yükleniyor...");
        // TODO: Burası AWS'den gelen gerçek verilerle doldurulacak.
        // Şimdilik statik HTML içeriği kullanılıyor.
    },

    loadProfile() {
        console.log("Profil sayfası yükleniyor...");
        // TODO: Burası AWS'den gelen kullanıcı verileri ve görevlerle doldurulacak.
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());