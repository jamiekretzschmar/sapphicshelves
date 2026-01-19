#
# 📚 Sapphic Shelves: Archival Protocol

**Sapphic Shelves** is an elite, open-source archival engine designed for the high-fidelity curation of queer and sapphic literature. Using **Gemini 2.0 Flash** vision and search grounding, it transforms physical collections into structured digital monographs.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/your-repo/sapphic-shelves/blob/main/LICENSE)
[![GitHub PRs](https://img.shields.io/badge/PRs-welcome-rose.svg)](https://github.com/your-repo/sapphic-shelves/compare)

## 🏛 Project Mission
To provide queer readers with a bespoke, secure, and intelligent space to catalog their histories. We prioritize data sovereignty, literary aesthetics, and AI-assisted discovery.

## 🛠 Technical Stack
- **Frontend:** React 19 + TypeScript + Tailwind CSS
- **Android:** Native Kotlin Wrapper (Gradle 8.5)
- **Intelligence:** Google Gemini 2.0 (Flash & Pro variants)
- **Persistence:** Versioned localStorage with JSON archival export
- **Performance:** Worker-based image compression & Async sync queuing

## 🚀 Key Features
- **Shelf Sync:** Vision-based acquisition of multiple spines from a single photo.
- **Lexicon & Curator:** Binary signifier mapping (Inscribe/Redact) with AI-guided volume discovery.
- **Author Pulses:** Deep-research engine for author backgrounds and upcoming releases.
- **Resource Engine:** Aggregated tracker for ARCs, contests, and free queer editions.
- **Command Palette:** `⌘K` global navigation for power users.

## 📱 Android Application
The project now includes a native Android wrapper located in the `/android` directory.

### Build Requirements
- Android Studio Iguana or newer
- JDK 17
- Android SDK 34 (Upside Down Cake)

### Building the APK
1. Open the `android` folder as a project in Android Studio.
2. Ensure you have a `.env` file in the root with your `VITE_GEMINI_API_KEY`.
3. Sync Project with Gradle Files.
4. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

## 📥 Web Installation
1. `git clone https://github.com/jtkre/sapphicshelves.git`
2. `npm install`
3. Create a `.env` file and add:
   ```env
   VITE_GEMINI_API_KEY=your_actual_key_here
   ```
4. `npm run dev`

## 📱 Mobile Web (via Termux)
1. **Install Termux** from F-Droid.
2. `pkg update && pkg upgrade && pkg install git nodejs`
3. `git clone https://github.com/jtkre/sapphicshelves.git`
4. `cd sapphicshelves && npm install`
5. `npm run dev:android`

## 🤝 Contributing
Contributions are welcome. Please ensure your code respects the archival aesthetic and maintains high-fidelity data types.

## 📜 License
This project is licensed under the MIT License.

---
*Developed with archival precision.*
