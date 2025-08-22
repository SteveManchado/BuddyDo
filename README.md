# BuddyDo

**BuddyDo** is a lightweight web application (version 1.1) created as part of my portfolio to demonstrate my programming skills.  
The goal is not commercial use, but to showcase what I can implement technically. It may contain bugs since it is still experimental.

---

## 🚀 Live Demo

Access it directly here:  
👉 [BuddyDo on GitHub Pages](https://stevemanchado.github.io/BuddyDo/)

---

## ✨ Features

- 🔐 **Encrypted storage** using Base64 encoding on `.buddydo` files.  
- 👥 **Contacts management** → create, edit, delete, and add notes to contacts.  
- 📝 **Activity log** → tasks, notes, or daily logs.  
- 💾 **File export/import** → download your encrypted file and reload it later.  
- 🌙 **Light/Dark mode** → preferences saved in `localStorage`.  
- 📱 **Responsive design** → optimized for desktop and mobile.

---

## 🛠️ Technologies Used

- **HTML5** → structure and layout.  
- **CSS3** → styling, theming, and responsive design.  
- **Vanilla JavaScript (ES6+)** → core logic:  
  - File encryption/decryption (Base64)  
  - Custom CSV parser/builder  
  - Authentication (username/password)  
  - CRUD operations for contacts  
  - Notes system  
  - Theme persistence (light/dark)

---

## 📂 Project Structure

```
.
├── index.html    # Main app entry point
├── styles.css    # Styling and themes
└── scripts.js    # Application logic
```

---

## ⚙️ How It Works

1. **Load an encrypted file**  
   - Upload a `.buddydo` file.  
   - It is decrypted, validated, and the login is enabled.  

2. **Authenticate**  
   - Enter username and password (stored inside the encrypted file).  

3. **Use the app**  
   - Manage contacts and notes.  
   - Add, edit, or delete entries.  

4. **Save changes**  
   - Export updates to a new `.buddydo` file.  
   - ⚠️ This file is your only copy of the data — keep it safe.  

5. **Optional** → Create a new file from scratch.  

---

## 📈 Future Improvements

- 🔄 Cloud sync (Google Drive, Dropbox, etc.).  
- 🧑‍🤝‍🧑 Multi-user support with access control.  
- 📊 Analytics dashboard for contacts and notes.  
- 🔑 Stronger encryption (AES or WebCrypto API).  
- 📱 Progressive Web App (PWA) for mobile installation.  
- ☁️ Backend option (Node.js/Express) for centralized persistence.  

---

⚠️ This project is for **portfolio demonstration purposes only**. The live version on GitHub Pages is recommended for testing.
