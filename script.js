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

        this.pages.feed = document.getElementById('feed-page');
        this.pages.profile = document.getElementById('profile-page');
        this.pages.login = document.getElementById('login-page');
        this.pages.signup = document.getElementById('signup-page');

        // Form geçiş linkleri
        const showLoginLink = document.getElementById('show-login');
        const showSignupLink = document.getElementById('show-signup');
        const logoutBtn = document.getElementById('logout-btn');

        // Formları al
        this.forms = {};
        this.forms.login = document.getElementById('login-form');
        this.forms.signup = document.getElementById('signup-form');

        // Olay dinleyicileri
        this.nav.feedBtn.addEventListener('click', () => this.navigateTo('feed', true));
        this.nav.profileBtn.addEventListener('click', () => this.navigateTo('profile', true));
        showLoginLink.addEventListener('click', (e) => { e.preventDefault(); this.navigateTo('login'); });
        showSignupLink.addEventListener('click', (e) => { e.preventDefault(); this.navigateTo('signup'); });
        logoutBtn.addEventListener('click', () => this.auth.logout());

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

        // Uygulama yüklendiğinde oturum durumunu kontrol et
        this.checkAuthStatusAndNavigate();

        console.log("Uygulama başarıyla yüklendi ve hazır.");
    },

    async checkAuthStatusAndNavigate() {
        try {
            await Amplify.Auth.currentAuthenticatedUser();
            // Kullanıcı oturum açmışsa feed sayfasına git
            this.navigateTo('feed', true);
        } catch (error) {
            // Kullanıcı oturum açmamışsa giriş sayfasına git
            this.navigateTo('login');
        }
    },

    async navigateTo(pageName, isProtected = false) {
        // Eğer sayfa korumalıysa ve kullanıcı giriş yapmamışsa, giriş sayfasına yönlendir.
        if (isProtected) {
            try {
                await Amplify.Auth.currentAuthenticatedUser();
            } catch (error) {
                this.navigateTo('login');
                return;
            }
        }

        // Ana uygulama arayüzünü (navigasyon menüsü) sadece korumalı sayfalarda göster
        document.getElementById('bottom-nav').style.display = (pageName === 'feed' || pageName === 'profile') ? 'flex' : 'none';


        // Tüm sayfaları gizle
        for (let pageId in this.pages) {
            this.pages[pageId].classList.remove('active');
        }
        // İstenen sayfayı göster
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
                alert("Kayıt başarılı! Lütfen şimdi giriş yapın ve e-postanıza gelen doğrulama kodunu girerek hesabınızı onaylayın.");
                // TODO: Doğrulama kodu ekranına yönlendir
                app.navigateTo('login'); // Şimdilik giriş ekranına yönlendir
            } catch (error) {
                console.error("Kayıt hatası:", error);
                alert(error.message);
            }
        },

        async logout() {
            try {
                await Amplify.Auth.signOut();
                console.log("Çıkış başarılı.");
                app.navigateTo('login');
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
