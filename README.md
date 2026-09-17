# Shambhu Ji RXL Billing — Windows Desktop Application

A production-quality standalone Windows desktop billing and estimate generation program built specifically for jewelry businesses, matching the exact visual structure, proportions, typography, and borders of the physical billing format.

---

## 🌟 Key Features

1. **Exact Physical Bill Appearance**:
   - Matches the physical reference bill layout:
     `SL. NO. - [X]` | `<< ROUGH ESTIMATE >>` / `<< FINAL BILL >>` | `SHAMBHU JI RXL` | Time & Date.
   - 8 Business columns: `Amount`, `Item`, `Weight`, `Less`, `Net Wt.`, `Tunch`, `Lab.`, `Fine`.
   - Summary settlements: `New Total`, `Old Balance` (with editable date and text/amount), `Total`, `Jama Total`, `(BAKI) Final (BAKI)`.
   - Footer return policy: `Only Agra Item Will Be Return...` and `Dhada. [  ]` box.
   - Thin, crisp 1px black borders mirroring laser/thermal physical jeweler receipts.

2. **Full Arithmetic Expression Support**:
   - Directly enter complex arithmetic expressions into numeric fields:
     - `10*12.140+6*12.315`
     - `71*1.8`
     - `14*1.8+19*1.8`
     - `25*1.410+1*9.180+15*1.980`
   - Supports `+`, `-`, `*`, `/`, `(`, `)`, `×`, `÷`.
   - The expression itself remains visible in the input field!
   - On screen, live evaluation previews are shown; during printing, all preview badges and UI buttons are cleanly stripped away.

3. **Persistent Local Database (Zero Native ABI Issues)**:
   - Eliminates C++ compiler issues and native Electron ABI mismatches (`better-sqlite3`).
   - Stores bills and settings inside Electron's `userData/shambhu_ji_data` directory with atomic file writes.
   - Survives restarts, system reboots, and power failures.

4. **Windows Native Printing & Print Preview**:
   - Prints directly to connected Windows printers via standard Windows Print Dialog.
   - Dedicated A4 Print Preview showing the exact 1:1 physical sheet before printing.
   - Strips all action buttons, delete icons, and application controls.

5. **Bill History & Archive**:
   - Search by Customer / Party, SL Number, Date, or Bill ID.
   - One-click Load & Edit (updates existing bill without duplicate entries).
   - Delete with confirmation.
   - Direct reprint from history.

6. **Google Drive & Offline Backup Architecture**:
   - Every saved bill is automatically uploaded or updated as a PNG image matching the print view in the Google Drive account authenticated by `GOOGLE_DRIVE_REFRESH_TOKEN`.
   - 100% offline instant JSON export and restore for bulletproof data safety.

---

## 💻 System Requirements

- **Operating System**: Windows 10 or Windows 11 (64-bit / 32-bit)
- **Node.js**: Version 18.x, 20.x, or 22.x LTS (Download from [nodejs.org](https://nodejs.org/))
- **Memory**: Minimum 2 GB RAM

---

## 🚀 Installation & Running

### Step 1: Install Node.js
If not already installed, download and install Node.js LTS from [https://nodejs.org](https://nodejs.org).

### Step 2: Install Dependencies
Open Windows Terminal, Command Prompt, or PowerShell in the project directory:

```bash
npm install
```

### Google Drive automatic bill saving

The Drive account must be authenticated with OAuth credentials belonging to `pashupatisilverhouse2025@gmail.com`. Copy `.env.example` to `.env`, fill in the OAuth values, and then launch the app. `GOOGLE_DRIVE_FOLDER_ID` is optional; when omitted, bills are saved in that account's My Drive root.

The Google Cloud OAuth consent must include the Google Drive scope, and the refresh token must be generated while signed in as `pashupatisilverhouse2025@gmail.com`. `GOOGLE_DRIVE_API_KEY` alone cannot upload files.

### Step 3: Run the Application
To launch the desktop application:

```bash
npm start
```
*(In web development/preview mode, run `npm run dev` to preview on `http://localhost:3000`)*.

---

## 📦 Building the Windows Installer (`.exe`)

To package the standalone Windows executable:

### 1. Build Both NSIS Installer and Portable Executable:
```bash
npm run dist
```

### 2. Build NSIS Installer Only (`Shambhu Ji RXL Billing Setup.exe`):
```bash
npm run dist:nsis
```

### 3. Build Portable Windows Executable (`Shambhu Ji RXL Billing Portable.exe`):
```bash
npm run dist:portable
```

The compiled binaries will be generated in the `./dist-electron` folder:
- `dist-electron/Shambhu Ji RXL Billing Setup.exe` (Standard Windows installer with Start Menu & Desktop shortcuts)
- `dist-electron/Shambhu Ji RXL Billing Portable.exe` (Single standalone executable that runs directly from a USB drive)

---

## 📂 Where Local Data Is Stored

On Windows, the local database and settings are persisted in the user's roaming application directory:

```
C:\Users\<YourUsername>\AppData\Roaming\shambhu-ji-rxl-billing\shambhu_ji_data\
├── bills.json
└── settings.json
```

- **`bills.json`**: Contains all historical bill records, item rows, formulas, and settlements.
- **`settings.json`**: Contains your shop name, default bill type, serial number counter, and printer configurations.

---

## 💾 How to Back Up and Restore Data

### Option A: Direct JSON Export/Import (Recommended)
1. In the top toolbar, click **Backup**.
2. Click **Export Database to JSON**.
3. Save the `.json` file to a USB drive or secure folder.
4. To restore on another computer, click **Restore from JSON File** and select your backup file.

### Option B: Manual Folder Backup
Copy the `shambhu_ji_data` folder from `AppData\Roaming\shambhu-ji-rxl-billing\` to your backup drive.

---

## 🧮 Calculation Verification Examples

| Item Name | Weight | Less Expression | Computed Net Wt | Tunch | Computed Fine |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MICRO FX HAAR** | `565` | `10*12.140+6*12.315` (= 195.29) | `369.71` | `74` | `274` |
| **OPB** | `1040` | `71*1.8` (= 127.8) | `912.2` | `61` | `556` |
| **RP KADA** | `956` | `14*1.8+19*1.8` (= 59.4) | `896.6` | `62` | `556` |
| **BMB PAYAL 45** | `1660` | `25*1.410+1*9.180+15*1.980` (= 74.13) | `1585.87` | `38` | `603` |

You can also click **Load Reference Test Bill** in the application to test these exact calculations instantly.

---

## ⌨️ Keyboard Shortcuts

- `Ctrl + S`: Save current bill
- `Ctrl + P`: Print bill
- `Ctrl + N`: Create new blank bill
- `Ctrl + +`: Zoom in
- `Ctrl + -`: Zoom out

---

## 🔧 Troubleshooting

1. **Window does not open or shows white screen**:
   - Run `npm run build` first to ensure the renderer bundle is compiled, then run `npm start`.
2. **Printer does not respond**:
   - Ensure the printer is powered on and configured in Windows Settings > Printers & Scanners.
   - Use the **Print Preview** modal to verify layout before sending.
3. **Resetting to Blank Bill**:
   - Click the **New Bill** button or **Clear to Blank** button.
