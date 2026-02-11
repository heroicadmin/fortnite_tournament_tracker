# 🏆 Fortnite Tournament Leaderboard

A tournament tracker for Fortnite competitions. Upload your match results and get instant leaderboards with scoring, highlights, and trophy tracking.

<img width="1280" height="952" alt="tt" src="https://github.com/user-attachments/assets/58fbee6c-94cf-4a88-96da-777a54e77ee2" />

---

## ✨ Features

- **CSV Upload** — Drop in match result files. Handles UTF-8 and UTF-16 encoded files.
- **Auto Mode Detection** — Automatically detects Solo, Duo, Trio, or Quad based on shared placements.
- **FNCS-Based Scoring** — Default point system based on Fortnite Champion Series. Fully customizable.
- **Multi-Game Support** — Upload multiple CSVs and view combined standings or individual games.
- **🏆 Highlights Tab** — Podium view showing 1st/2nd/3rd for each game.
- **Trophy Badges** — 🥇🥈🥉 medals on player names with multipliers (×2, ×3) for repeat podiums.
- **🧪 Test Data** — Built-in test data generator to preview the leaderboard instantly.
- **Admin Toggle** — Hide controls for a clean presentation view.

---

## 🚀 Installation (Step-by-Step for Beginners)

Don't worry if you've never done this before — just follow each step exactly and you'll be up and running in a few minutes.

### Step 1: Install Node.js

Node.js is the engine that runs this project. You only need to install it once.

1. Go to **https://nodejs.org**
2. Click the big green button that says **"LTS"** (this is the stable version)
3. Run the installer you just downloaded
4. Click **Next → Next → Next → Install → Finish** (just accept all the defaults)

**How to check it worked:** Open your terminal and type:
```bash
node --version
```
You should see something like `v20.11.0` or higher. If you see an error, try restarting your computer and trying again.

> **What's a terminal?**
> - **Windows:** Press `Win + R`, type `cmd`, press Enter. Or search for "Command Prompt" in the Start menu.
> - **Mac:** Press `Cmd + Space`, type `Terminal`, press Enter.
> - **Linux:** Press `Ctrl + Alt + T`.

### Step 2: Download this project

You have two options:

**Option A — Download as ZIP (easiest):**
1. On this GitHub page, click the green **"Code"** button near the top
2. Click **"Download ZIP"**
3. Find the ZIP file in your Downloads folder and extract/unzip it
4. You should now have a folder called `fortnite-leaderboard`

**Option B — Using Git (if you have it installed):**
```bash
git clone https://github.com/YOUR_USERNAME/fortnite-leaderboard.git
```

### Step 3: Open the project in your terminal

You need to navigate your terminal into the project folder.

**Windows:**
```bash
cd C:\Users\YourName\Downloads\fortnite-leaderboard
```

**Mac/Linux:**
```bash
cd ~/Downloads/fortnite-leaderboard
```

> **Tip:** If you're not sure of the path, you can type `cd ` (with a space after it) and then drag-and-drop the folder into the terminal window. It will auto-fill the path for you.

### Step 4: Install the project dependencies

This downloads all the extra code the project needs. Run this command:

```bash
npm install
```

You'll see a bunch of text scrolling by — that's normal. Wait for it to finish (usually takes 15–30 seconds). You'll know it's done when you see your cursor blinking on a new line again.

> **Getting errors?** Make sure you're inside the `fortnite-leaderboard` folder. Type `ls` (Mac/Linux) or `dir` (Windows) and you should see files like `package.json` and `src/`. If not, you're in the wrong folder.

### Step 5: Start the leaderboard

```bash
npm run dev
```

You should see something like this appear:

```
  VITE v6.x.x  ready in 300ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### Step 6: Open it in your browser

Open your web browser (Chrome, Firefox, Edge, etc.) and go to:

```
http://localhost:5173
```

**That's it — you should see the leaderboard! 🎉**

### Step 7: Try it out

Click the **🧪 Load Test Data** button to see it working with fake data right away. Or upload your own CSV files.

### Stopping the server

When you're done, go back to the terminal and press `Ctrl + C` to stop it.

### Starting it again later

Whenever you want to use it again, just:
1. Open your terminal
2. `cd` into the project folder
3. Run `npm run dev`
4. Open `http://localhost:5173` in your browser

You do NOT need to run `npm install` again — that's a one-time setup.

---

## 📄 CSV Format — How to set up your match files

Each CSV file should have **no header row**. Each line is one player:

```
PlayerName,Placement,Kills
```

**How duos work:** When two players have the **same placement number**, the system automatically pairs them as a team.

**Example — Duo tournament results:**
```
ShadowStrike,1,5
NeonViper,1,3
FrostByte,2,4
BlazeMaster,2,1
AquaPhoenix,3,2
ThunderWolf,3,6
IronClad,4,0
SteelNerve,4,1
```

In this example, ShadowStrike & NeonViper are a team (both placement 1), FrostByte & BlazeMaster are a team (both placement 2), etc.

**How to create a CSV file:**
1. Open **Notepad** (Windows), **TextEdit** (Mac), or any text editor
2. Type your data in the format above, one player per line
3. Save the file as `game1.csv` (make sure it ends in `.csv`, not `.txt`)

You can also export from Excel/Google Sheets — just use **File → Download as → CSV**.

---

## 🌐 Deploying to the Web (Optional)

Want to share the leaderboard online so others can see it? Here's how to put it on the internet for free.

### Build the project first

```bash
npm run build
```

This creates a `dist/` folder with your finished website inside.

### Option A: Deploy on Vercel (recommended, easiest)

1. Go to **https://vercel.com** and sign up with your GitHub account
2. Click **"New Project"**
3. Import your GitHub repository
4. Click **Deploy**
5. Done — you'll get a live URL like `your-project.vercel.app`

### Option B: Deploy on GitHub Pages (free)

1. First, open `vite.config.js` and change it to:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/fortnite-leaderboard/',
  plugins: [react()],
})
```

2. Install the deploy tool:
```bash
npm install --save-dev gh-pages
```

3. Add this to the `"scripts"` section in your `package.json`:
```json
"deploy": "gh-pages -d dist"
```

4. Build and deploy:
```bash
npm run build
npm run deploy
```

5. Your site will be live at: `https://YOUR_USERNAME.github.io/fortnite-leaderboard/`

---

## 🔧 Tech Stack

- React 18
- Vite 6
- Zero external UI dependencies — pure inline styling

## 📝 License

MIT — free to use, modify, and share.
