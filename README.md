# Local ChatGPT - Sohbet Botu

herhangi bir endpoint ile uyumlu yapay zeka destekli bir chatbot uygulaması. OpenAI API kullanarak güvenilir ve hızlı bir şekilde sorulara cevaplar sunar.

## 🌟 Özellikler

- 💬 Açık kaynaklı anlık soru-cevap
- 🔊 Text-to-Speech desteği
- 📝 Markdown formatında yanıtlar
- 💾 LocalStorage ile sohbet geçmişi
- 🔄 Yeniden yanıt üretme
- 📱 Responsive tasarım
- 🌙 Karanlık/Aydınlık tema

## 🛠️ Teknoloji Stack

- **Frontend Framework:** SvelteKit
- **UI Framework:** Shadcn-Svelte
- **Styling:** Tailwind CSS
- **API:** OpenAI GPT-4
- **State Management:** Svelte Stores
- **Storage:** LocalStorage
- **Deployment:** Cloudflare Pages

## 📁 Proje Yapısı

```
local-chatai/
├── src/
│   ├── lib/
│   │   ├── components/     # UI bileşenleri
│   │   ├── stores/         # Svelte store'ları
│   │   ├── types/          # TypeScript tipleri
│   │   └── utils/          # Yardımcı fonksiyonlar
│   ├── routes/             # Sayfa rotaları
│   └── app.html           
├── static/                 # Statik dosyalar
├── tests/                  # Test dosyaları
└── vite.config.js         # Vite yapılandırması
```

## ⚙️ Temel Fonksiyonlar

1. **Sohbet Yönetimi**
   - Yeni sohbet başlatma
   - Sohbet geçmişi kaydetme
   - Mesaj gönderme/alma

2. **AI Entegrasyonu**
   - OpenAI API bağlantısı
   - Prompt yönetimi
   - Yanıt formatlama

3. **Ses Özellikleri**
   - Text-to-Speech
   - Ses kontrolü
   - Durdurma/Oynatma

## 🚀 Kurulum

```bash
# Repoyu klonla
git clone https://github.com/kvurgun/local-chatai.git

# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Üretime hazır build
npm run build
```

## 🔧 Yapılandırma

1. `.env` dosyası oluşturun:
```env
VITE_API_KEY=your_api_key
VITE_API_URL=your_api_url
VITE_PLAYHTTP_URL=your_playhttp_url
VITE_PLAYHTTTP_API_KEY=your_playhttp_api_key
VITE_PLAYHTTTP_USER_ID=your_playhttp_user_id
VITE_PLAYHTTTP_VOICE_ID=your_playhttp_voice_id
```

## 🤖 Local LLM Model API

![Local LLM Model Setup](guide_image/keenetic_modem_ayar.jpg)

## 📝 Lisans

MIT License - Detaylar için LICENSE dosyasına bakın.

## 🔗 Bağlantılar