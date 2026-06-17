# BigQuery Release Pulse 🚀

**BigQuery Release Pulse** is a modern, high-fidelity web application built with Python Flask and plain vanilla HTML, CSS, and JavaScript. It monitors, cleans, and structures Google Cloud BigQuery release notes in real time, giving data engineers and cloud developers the ability to filter updates and instantly share highlights to X (formerly Twitter) using character-limit-safe templates.

---

## 🌟 Key Features

* **Real-Time Atom parsing**: Automatically fetches the official Google Cloud BigQuery release notes XML feed and translates it into clean data.
* **Granular Splicing**: Splices clumped daily release notes into individual cards by category (*Features*, *Announcements*, *Issues*, *Changes*, *Deprecated*).
* **Search & Filters**: 
  * Full-text search matching descriptions, dates, or types.
  * Sidebar filters dynamically displaying release count badges for each category.
  * Date range selector dynamically aggregated from the notes.
  * Sorting options (Newest First vs. Oldest First).
* **Interactive Refreshing**: A manual refresh button updates the feed and server cache, accompanied by a modern CSS spinner.
* **Select-to-Tweet Composer**:
  * Clicking an update card reveals a floating utility bar at the bottom.
  * Simulated dark-mode X post composer modal.
  * **Three Auto-Draft Templates**: Automatically truncates text using word boundaries to fit exactly under X's **280-character limit**.
  * **SVG Character Tracker**: Live circular progress ring updating colors (blue ➔ orange ➔ red) as you type.
  * Direct Twitter/X Web Intent integration.
* **Premium Glassmorphism Design**: Designed with a high-fidelity dark mode, Outfit typography, glowing border highlights, and skeleton shimmers.

---

## 🛠️ Technology Stack

* **Backend**:
  * Python 3.14+
  * Flask (Web Server & REST API)
  * Requests (HTTP Client)
  * Feedparser (XML/Atom Feed Parser)
  * BeautifulSoup4 (HTML Slicing & Link Sanitizing)
* **Frontend**:
  * HTML5 (Semantic Structure)
  * Vanilla CSS3 (Custom Properties, CSS Grid, Flexbox, Animations)
  * Vanilla JavaScript (ES6+ State Manager, Event Delegation, DOMParser)
  * FontAwesome Icons & Google Fonts (Outfit, JetBrains Mono)

---

## 📂 Project Structure

```text
bq-releases-notes/
├── app.py                  # Flask Application Server (API & Caching)
├── check_feed.py           # Feed diagnostic script
├── requirements.txt        # Python dependency list
├── .gitignore              # Git ignore configuration
├── README.md               # Project documentation (this file)
├── templates/
│   └── index.html          # Main HTML structure, layout, and modal components
└── static/
    ├── css/
    │   └── styles.css      # Dark theme, layouts, badge stylings, and animations
    └── js/
        └── app.js          # Main client script, filters, and composer logic
```

---

## 🚦 Installation and Setup

### Prerequisites
* Python 3.8 or higher installed on your local machine.
* Git installed for repository synchronization.

### 1. Clone & Navigate
Clone this repository to your local machine and navigate to the project root:
```bash
git clone https://github.com/Facegeo/Ernest-event-talks-app.git
cd Ernest-event-talks-app
```

### 2. Setup Virtual Environment
It is highly recommended to isolate dependencies inside a virtual environment:
* **Windows (PowerShell)**:
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
* **Windows (Command Prompt)**:
  ```cmd
  python -m venv venv
  .\venv\Scripts\activate.bat
  ```
* **macOS / Linux**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### 3. Install Dependencies
Install all required packages from `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 4. Run the Application
Start the Flask development server:
```bash
python app.py
```

Open your browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 💡 How It Works (Technical Details)

### 🌾 Feed Fetching and Splicing
The official Google Cloud feed at `https://docs.cloud.google.com/feeds/bigquery-release-notes.xml` provides entries grouped by date. Within each day, multiple updates are compiled.
1. `app.py` pulls the XML and uses `feedparser` to read the daily objects.
2. `BeautifulSoup4` traverses the content. Sibling elements located between `<h3>` tags are grouped together.
3. Anchor tags (`<a>`) are cleaned; relative links (e.g. `/bigquery/docs/...`) are rewritten to absolute GCP URLs (`https://cloud.google.com/bigquery/docs/...`) and forced to open in a new tab (`target="_blank"`).
4. Spliced updates are assigned a stable unique ID based on a hash of their title, date, and text snippet.

### 🔄 Cache and On-Demand Refresh
To prevent excessive network requests, `app.py` caches the parsed list in memory.
* Visiting the application fetches data from the cache.
* Clicking the **Refresh** button calls `/api/releases?refresh=true`, bypassing the cache, requesting a new feed, writing it to the cache, and updating the client state.

### 🐦 Character-Limit Safe Post Composer
When you select an update and click **Compose Post**, `app.js` builds three layouts using the selected note:
1. **🚀 Standard**: Combines a release headline and tags (`#BigQuery #DataAnalytics #GCP`) with a truncated middle body.
2. **💡 Summary**: Focuses on value description details with a date footer.
3. **📢 Quick Announcement**: Formats a raw headline suitable for alerts.

```javascript
// Truncation math:
const allowedBodyLen = 280 - (prefix.length + suffix.length);
const truncatedBody = truncateText(bodyText, allowedBodyLen);
const finalDraft = `${prefix}${truncatedBody}${suffix}`;
```
The script determines the exact size of the static headers and hashtags, clips the remaining text length at word boundaries, appends an ellipsis (`...`), and populates the editor text area. Clicking **Post on X** uses the web intent:
`https://twitter.com/intent/tweet?text=URL_ENCODED_STRING` to launch the official composer in a new tab.

---

## 📸 Screenshots

*Placeholders for user-provided screenshots:*
1. **Dashboard Home View** - Sleek dark mode grid showing loaded release cards.
2. **Filtered States** - Real-time filtering showing count badges in the sidebar.
3. **Floating Toolbar & X Modal** - Interactive composer dialog with the character SVG circle.

---

## 🔮 Future Enhancements

* **Database Storage**: Introduce a local SQLite database to query historic release notes over multiple years.
* **Webhook notifications**: Integrate Discord, Slack, and Microsoft Teams incoming webhooks to broadcast new updates instantly.
* **Direct X API Integrations**: Option to authenticate your X developer account to post directly from the dashboard instead of using web intent redirect links.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps to contribute:
1. Fork the project.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
