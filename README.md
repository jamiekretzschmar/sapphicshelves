
# 📚 Sapphic Shelves: Archival Protocol

**Sapphic Shelves** is an elite, open-source archival engine designed for the high-fidelity curation of queer and sapphic literature. Using **Gemini 3.0** vision and search grounding, it transforms physical collections into structured digital monographs.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/your-repo/sapphic-shelves/blob/main/LICENSE)
[![GitHub PRs](https://img.shields.io/badge/PRs-welcome-rose.svg)](https://github.com/your-repo/sapphic-shelves/compare)

## 🏛 Project Mission
To provide queer readers with a bespoke, secure, and intelligent space to catalog their histories. We prioritize data sovereignty, literary aesthetics, and AI-assisted discovery.

## 🛠 Technical Stack
- **Frontend:** React 19 + TypeScript + Tailwind CSS
- **Intelligence:** Google Gemini 3.0 (Flash & Pro variants)
- **Persistence:** Versioned localStorage with JSON archival export
- **Performance:** Worker-based image compression & Async sync queuing

## 🚀 Key Features
- **Shelf Sync:** Vision-based acquisition of multiple spines from a single photo.
- **Author Pulses:** Deep-research engine for author backgrounds and upcoming releases.
- **Resource Engine:** Aggregated tracker for ARCs, contests, and free queer editions.
- **Command Palette:** `⌘K` global navigation for power users.
- **Themes:** Light, Dark, and a book-centric Sepia mode.

## 📥 Installation (Desktop/Standard)
1. `git clone https://github.com/your-user/sapphic-shelves.git`
2. `npm install`
3. Add your `API_KEY` to the environment.
4. `npm run dev`

## 📱 Android Installation (via Termux)
Run Sapphic Shelves natively on your Android device using the Termux terminal emulator.

1. **Install Termux:** Download the latest version from [F-Droid](https://f-droid.org/en/packages/com.termux/) (Do not use the Google Play Store version as it is deprecated).
2. **Setup Environment:**
   Open Termux and run:
   ```bash
   pkg update && pkg upgrade
   pkg install git nodejs
   ```
3. **Clone & Install:**
   ```bash
   git clone https://github.com/your-repo/sapphic-shelves.git
   cd sapphic-shelves
   npm install
   ```
4. **Configure API Key:**
   Create a local configuration file to store your credentials:
   ```bash
   echo "API_KEY=your_actual_gemini_api_key_here" > .env
   ```
5. **Launch Protocol:**
   Use the dedicated Android script to launch the system browser via `termux-open-url`:
   ```bash
   npm run dev:android
   ```
6. **Access:** The application will automatically open in your default mobile browser (e.g., Chrome, Firefox).

## 🤝 Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Developed with archival precision.*