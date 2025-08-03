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

        // Navigasyon butonlarını al
        this.nav.feedBtn = document.getElementById('nav-feed');
        this.nav.profileBtn = document.getElementById('nav-profile');
        this.nav.desktopNav = document.getElementById('desktop-nav'); // Masaüstü navigasyon

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
        if (this.nav.feedBtn) this.nav.feedBtn.addEventListener('click', () => this.navigateTo('feed', true));
        if (this.nav.profileBtn) this.nav.profileBtn.addEventListener('click', () => this.navigateTo('profile', true));
        if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); this.navigateToAuthSubPage('login'); });
        if (showSignupLink) showSignupLink.addEventListener('click', (e) => { e.preventDefault(); this.navigateToAuthSubPage('signup'); });
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.auth.logout());
        if (resendCodeLink) resendCodeLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('confirm-email').value;
            if (email) {
                await this.auth.resendConfirmationCode(email);
            } else {
                alert("Lütfen e-posta adresinizi girin.");
            }
        });
        if (startButton) startButton.addEventListener('click', () => this.navigateTo('authContainer'));

        if (this.forms.login) this.forms.login.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            await this.auth.login(email, password);
        });

        if (this.forms.signup) this.forms.signup.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            await this.auth.signup(email, password);
        });

        if (this.forms.confirmSignup) this.forms.confirmSignup.addEventListener('submit', async (e) => {
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

        // Rive animasyonunu yükle (örnek olarak auth-intro-section içinde bir yere eklenebilir)
        // this.loadRiveAnimation('rive-animation-container', './assets/your_rive_animation.riv');

        // Pencere boyutu değiştiğinde navigasyonu güncelle
        window.addEventListener('resize', () => this.updateNavigationVisibility());
        this.updateNavigationVisibility(); // Başlangıçta navigasyon görünürlüğünü ayarla

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

        // Tüm sayfaları gizle
        for (let pageId in this.pages) {
            if (this.pages[pageId]) {
                this.pages[pageId].classList.remove('active');
            }
        }
        // İstenen sayfayı göster
        if (this.pages[pageName]) {
            this.pages[pageName].classList.add('active');
        }

        // Navigasyon butonlarını güncelle
        this.updateNavigationButtons(pageName);
        this.updateNavigationVisibility();
    },

    navigateToAuthSubPage(subPageName) {
        const authFormSlider = document.querySelector('.auth-form-slider');
        if (!authFormSlider) return;

        let translateXValue = 0;
        switch (subPageName) {
            case 'login':
                translateXValue = 0;
                break;
            case 'signup':
                translateXValue = -100;
                break;
            case 'confirmSignup':
                translateXValue = -200;
                break;
            default:
                translateXValue = 0;
        }
        authFormSlider.style.transform = `translateX(${translateXValue}%)`;

        // Remove active class from all sub-pages and add to the target one for potential styling (not positioning)
        const authSubPages = document.querySelectorAll('#auth-container .auth-sub-page');
        authSubPages.forEach(page => page.classList.remove('active'));
        document.getElementById(subPageName).classList.add('active');
    },

    updateNavigationVisibility() {
        const bottomNav = document.getElementById('bottom-nav');
        const desktopNav = document.getElementById('desktop-nav');
        const isMobile = window.innerWidth < 768;

        if (bottomNav) {
            bottomNav.style.display = isMobile ? 'flex' : 'none';
        }
        if (desktopNav) {
            desktopNav.style.display = isMobile ? 'none' : 'flex';
        }

        // Eğer masaüstü navigasyon varsa, app-container'ın flex-direction'ını ayarla
        const appContainer = document.getElementById('app-container');
        if (appContainer) {
            appContainer.style.flexDirection = isMobile ? 'column' : 'row';
        }
    },

    updateNavigationButtons(activePageName) {
        // Tüm navigasyon butonlarının aktifliğini kaldır
        const allNavBtns = document.querySelectorAll('#bottom-nav .nav-btn, #desktop-nav .nav-btn');
        allNavBtns.forEach(btn => btn.classList.remove('active'));

        // İlgili navigasyon butonunu aktif et
        if (activePageName === 'feed' && (this.nav.feedBtn || (this.nav.desktopNav && this.nav.desktopNav.querySelector('#nav-feed')))) {
            if (this.nav.feedBtn) this.nav.feedBtn.classList.add('active');
            if (this.nav.desktopNav) this.nav.desktopNav.querySelector('#nav-feed').classList.add('active');
        } else if (activePageName === 'profile' && (this.nav.profileBtn || (this.nav.desktopNav && this.nav.desktopNav.querySelector('#nav-profile')))) {
            if (this.nav.profileBtn) this.nav.profileBtn.classList.add('active');
            if (this.nav.desktopNav) this.nav.desktopNav.querySelector('#nav-profile').classList.add('active');
        }
    },

    startCarousel(carouselId) {
        const carousel = document.querySelector(`#${carouselId}`);
        if (!carousel) return;

        const items = carousel.querySelectorAll('.carousel-item');
        let currentIndex = 0;
        let lottieInstances = [];

        // Lottie animasyonlarını yükle ve başlat
        items.forEach((item, index) => {
            const lottieContainer = item.querySelector('.lottie-animation-container');
            if (lottieContainer) {
                const animationUrl = lottieContainer.dataset.animationUrl;
                const anim = lottie.loadAnimation({
                    container: lottieContainer,
                    renderer: 'svg',
                    loop: true,
                    autoplay: false, // Başlangıçta oynatma
                    path: animationUrl
                });
                lottieInstances.push(anim);
            }
        });

        const showItem = (index) => {
            items.forEach((item, i) => {
                item.classList.remove('active');
                if (lottieInstances[i]) {
                    lottieInstances[i].stop(); // Önceki animasyonu durdur
                }
            });
            items[index].classList.add('active');
            if (lottieInstances[index]) {
                lottieInstances[index].play(); // Yeni animasyonu oynat
            }
        };

        showItem(currentIndex);

        setInterval(() => {
            currentIndex = (currentIndex + 1) % items.length;
            showItem(currentIndex);
        }, 5000); // Her 5 saniyede bir geçiş
    },

    // Rive animasyonunu yüklemek için fonksiyon
    loadRiveAnimation(containerId, url) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Rive container with ID ${containerId} not found.`);
            return;
        }

        const r = new rive.Rive({
            src: url,
            canvas: document.createElement('canvas'), // Yeni bir canvas oluştur
            autoplay: true,
            onLoad: () => {
                // Canvas'ı konteynere ekle
                container.appendChild(r.canvas);
                r.resizeDrawingSurfaceToCanvas();
            },
            onLoop: (event) => {
                // Animasyon döngüsü tamamlandığında tetiklenir
                console.log('Rive animation looped:', event.data);
            },
            onPlay: (event) => {
                console.log('Rive animation started playing:', event.data);
            },
            onPause: (event) => {
                console.log('Rive animation paused:', event.data);
            },
            onStop: (event) => {
                console.log('Rive animation stopped:', event.data);
            },
            onStateChange: (event) => {
                console.log('Rive state changed:', event.data);
            }
        });

        // Rive animasyonunun boyutunu responsive hale getir
        window.addEventListener('resize', () => {
            if (r.canvas) {
                r.resizeDrawingSurfaceToCanvas();
            }
        });
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
                app.navigateToAuthSubPage('confirmSignup'); // Doğrulama kodu ekranına yönlendir
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

// Amplify kütüphanesinin yüklenmesini bekleyen fonksiyon
function checkAmplifyReady() {
    if (typeof Amplify !== 'undefined') {
        app.init();
    } else {
        setTimeout(checkAmplifyReady, 100); // 100ms sonra tekrar kontrol et
    }
}

// Sayfa yüklendiğinde Amplify hazır olana kadar bekle
window.addEventListener('load', checkAmplifyReady);