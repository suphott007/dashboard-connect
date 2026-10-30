# Dashboard Connect 🚀
ระบบกระดานข้อความแบบเรียลไทม์ (Real-time Message Board) ผ่านการสแกน QR Code จากโทรศัพท์มือถือ

---

## ✨ คุณสมบัติเด่น (Features)
- 📲 **สแกน QR Code แล้วเข้าใช้งานได้ทันที**: หน้า Dashboard สร้าง QR Code ให้อัตโนมัติ (ตรวจจับโดเมนหรือ IP วง LAN อัตโนมัติ)
- ⚡ **อัปเดตแบบ Real-time**: ใช้ Socket.IO ทำให้ข้อความที่ส่งจากมือถือเด้งขึ้นหน้าจอ Dashboard ทันทีโดยไม่ต้องรีเฟรช
- 🗑️ **จัดการข้อความได้ทันใจ**: ฝั่ง Dashboard มีปุ่มลบข้อความรายบุคคล และปุ่มล้างข้อความทั้งหมด
- 📱 **Mobile-First User UI**: หน้ากรอกชื่อและส่งข้อความออกแบบมาให้ใช้ง่ายบนสมาร์ตโฟน พร้อมระบบจำชื่ออัตโนมัติ
- ☁️ **พร้อม Deploy ขึ้น Cloud**: รองรับ Render, Railway, Fly.io, Heroku, Docker และ VPS ทันที

---

## 🛠️ โครงสร้างโปรเจกต์
```
dashboard connect/
├── public/
│   ├── index.html       # หน้าจอ Dashboard แสดง QR Code และ Feed ข้อความ
│   ├── login.html       # หน้าจอบนมือถือสำหรับ Login และพิมพ์ส่งข้อความ
│   └── js/
│       ├── dashboard.js # ระบบจัดการ Dashboard, Real-time Socket, QR Code
│       └── client.js    # ระบบส่งข้อความและ Login ฝั่งมือถือ
├── server.js            # Node.js + Express + Socket.IO Server
├── Dockerfile           # Docker image สำหรับ Deploy
├── package.json         # การตั้งค่า Dependencies และ Scripts
└── README.md
```

---

## 🚀 วิธีเปิดใช้งานในเครื่อง (Local Development)

1. ติดตั้ง Dependencies (ทำครั้งแรก):
```bash
npm install
```

2. เริ่มต้นรันเซิร์ฟเวอร์:
```bash
npm start
```
หรือรันแบบ Hot-reload เมื่อมีการแก้ไขโค้ด:
```bash
npm run dev
```

3. เข้าใช้งาน:
- **หน้า Dashboard**: เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)
- **หน้าส่งข้อความ (มือถือ)**: 
  - หากเปิดในคอมฯ: [http://localhost:3000/login](http://localhost:3000/login)
  - หากใช้มือถือสแกน: ใช้มือถือที่ต่อ Wi-Fi วงเดียวกับคอมพิวเตอร์ สแกน QR Code ที่หน้า Dashboard

---

## ☁️ วิธีการ Deploy ขึ้น Cloud (ออนไลน์ให้คนนอกสแกนได้)

### ตัวเลือกที่ 1: Deploy บน Render.com (ฟรี & สะดวกมาก)
1. Push โปรเจกต์ขึ้น GitHub
2. ไปที่ [Render.com](https://render.com) แล้วเลือก **New Web Service**
3. เชื่อมต่อ Git Repository
4. ตั้งค่า:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. กด **Deploy** จะได้ URL เช่น `https://dashboard-connect.onrender.com` 
6. เมื่อเปิดหน้า Dashboard บน Render ระบบจะสร้าง QR Code เป็นลิงก์ออนไลน์ให้ทุกคนสแกนได้จากทุกที่ทันที!

### ตัวเลือกที่ 2: Deploy ด้วย Docker
```bash
docker build -t dashboard-connect .
docker run -p 3000:3000 dashboard-connect
```
