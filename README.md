# 🍕 Fizza – Real-Time Pizza Ordering Web App

**Fizza** is a full-stack real-time pizza ordering application built using the MERN stack (MongoDB, Express.js, React, Node.js). The platform offers a dynamic user experience, seamless order flow, and admin control.

---

## 🔥 Features

- User registration & login system
- Admin dashboard to manage orders
- Real-time order updates & status tracking
- Add to cart & checkout system
- Clean and responsive UI/UX

---

## 🛠️ Tech Stack

- **Frontend**: React.js, useState, CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT (JSON Web Token)

---

## 🚀 Live Links

- 🌐 Frontend (Vercel): https://fizaa.vercel.app
- ⚙️ Backend API (Render): https://fizza-api-vvpo.onrender.com

> The backend runs on Render's free tier, so the first request after idle time can take about a minute.

---

## 💻 Run Locally

```bash
# backend
cd backend
cp .env.example .env     # set MONGODB_URI and JWT_SECRET
npm install
npm run dev

# frontend (new terminal)
cd frontend
cp .env.example .env     # VITE_API_URL=http://localhost:5000
npm install
npm run dev
```

## ☁️ Deployment

- **Database:** MongoDB Atlas
- **Backend:** Render (`render.yaml`). Set `MONGODB_URI` and `JWT_SECRET` as environment variables in the Render dashboard.
- **Frontend:** Vercel. Set `VITE_API_URL` to the Render backend URL.

Secrets are never stored in the repository. Use the `.env.example` files as templates.

---

## 🙏 Credits

Based on the original open-source project [pizza-app](https://github.com/DobariyaHarsh/pizza-app) by DobariyaHarsh. This fork adds environment-based configuration and a separate deployment setup.
