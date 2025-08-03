// İyilik Zinciri Uygulaması Ana JavaScript Dosyası

const app = {
    pages: {},
    nav: {},

    init() {
        console.log("İyilik Zinciri başlatılıyor...");

        this.pages.feed = document.getElementById('feed-page');
        this.pages.profile = document.getElementById('profile-page');
        this.pages.login = document.getElementById('login-page');
        this.pages.signup = document.getElementById('signup-page');

        this.nav.feedBtn = document.getElementById('nav-feed');
        this.nav.profileBtn = document.getElementById('nav-profile');

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

        this.forms.login.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            this.auth.login(email, password);
        });

        this.forms.signup.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            this.auth.signup(email, password);
        });

        // Başlangıçta giriş sayfasını göster
        this.navigateTo('login');

        console.log("Uygulama başarıyla yüklendi ve hazır.");
    },

    navigateTo(pageName, isProtected = false) {
        // Eğer sayfa korumalıysa ve kullanıcı giriş yapmamışsa, giriş sayfasına yönlendir.
        // TODO: Gerçek kullanıcı durumu kontrolü eklenecek.
        if (isProtected && !this.isLoggedIn()) {
            this.navigateTo('login');
            return;
        }

        // Ana uygulama arayüzünü (navigasyon menüsü) sadece korumalı sayfalarda göster
        document.getElementById('bottom-nav').style.display = isProtected ? 'flex' : 'none';

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

    isLoggedIn() {
        // TODO: Burası AWS Cognito ile entegre edilecek gerçek bir kontrol olacak.
        return sessionStorage.getItem('isLoggedIn') === 'true'; 
    },

    auth: {
        login(email, password) {
            console.log(`Giriş denemesi: ${email}`);
            // TODO: AWS Cognito ile gerçek giriş işlemi yapılacak.
            if (email && password) { // Basit kontrol
                console.log("Giriş başarılı (simülasyon).");
                sessionStorage.setItem('isLoggedIn', 'true');
                app.navigateTo('feed', true);
            } else {
                alert("Lütfen e-posta ve şifreyi girin.");
            }
        },

        signup(email, password) {
            console.log(`Kayıt denemesi: ${email}`);
            // TODO: AWS Cognito ile gerçek kayıt işlemi yapılacak.
            if (email && password) { // Basit kontrol
                console.log("Kayıt başarılı (simülasyon).");
                alert("Kayıt başarılı! Lütfen şimdi giriş yapın.");
                app.navigateTo('login');
            } else {
                alert("Lütfen e-posta ve şifreyi girin.");
            }
        },

        logout() {
            console.log("Çıkış yapılıyor...");
            sessionStorage.removeItem('isLoggedIn');
            app.navigateTo('login');
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
