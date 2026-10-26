# รายงานการส่งงาน Lab 9.6 และ Lab 9.7
**วิชา Web Application Development / Cloud Native Architecture**
**รหัสนักศึกษา:** 67310072  
**ชื่อ-นามสกุล:** นายชัยศักดิ์ ภูเกิด (Chaisak Phukoet)

---

## 🌐 1. ลิงก์ระบบบน Production (Lab 9.7)

* **Production Frontend URL (Vercel):**  
  👉 [https://bookstore-webapp-nine.vercel.app/](https://bookstore-webapp-nine.vercel.app/)

* **Production Backend REST API URL (Render):**  
  👉 [https://bookstore-api-em9o.onrender.com](https://bookstore-api-em9o.onrender.com)  
  * Endpoint ตรวจสอบสถานะ: [https://bookstore-api-em9o.onrender.com/api/health](https://bookstore-api-em9o.onrender.com/api/health)
  * Endpoint ดึงหนังสือ: [https://bookstore-api-em9o.onrender.com/api/books](https://bookstore-api-em9o.onrender.com/api/books)

* **GitHub Repository:**  
  👉 [https://github.com/Chai503/Bookstore-Webapp](https://github.com/Chai503/Bookstore-Webapp)

* **Cloud MySQL Database (Aiven):**  
  * **Service:** `mysql-23696656` (Aiven MySQL Free Tier)
  * **Host:** `mysql-23696656-chaisak-503dc1.k.aivencloud.com`
  * **Port:** `27939`
  * **Database Name:** `bookstore_db`
  * **SSL/TLS Mode:** `REQUIRED`

---

## 🔑 2. บัญชีผู้ใช้งานสำหรับทดสอบระบบ (RBAC Test Accounts)

| Email | Password | Role | สิทธิ์การใช้งานตาม RBAC (Lab 9.5) |
| :--- | :---: | :---: | :--- |
| `usera@test.com` | `123456` | **Viewer** | ดูข้อมูลหนังสือได้เท่านั้น (GET), สั่ง DELETE ได้ HTTP 403 Forbidden |
| `userb@test.com` | `123456` | **Editor** | ดู, เพิ่ม และแก้ไขข้อมูลได้ (GET, POST, PUT), ไม่มีสิทธิ์ลบ |
| `userc@test.com` | `123456` | **Admin** | สิทธิ์สูงสุด ดู, เพิ่ม, แก้ไข และลบหนังสือได้ (GET, POST, PUT, DELETE) |
| `67310072@go.buu.ac.th` | `123456` | **Admin** | บัญชีนักศึกษา สิทธิ์ Admin |

---

## 🧪 3. การทดสอบตามข้อกำหนด (Verification Suite)

บนหน้าเว็บ [https://bookstore-webapp-nine.vercel.app/](https://bookstore-webapp-nine.vercel.app/) มีปุ่มทดสอบอัตโนมัติ **Section 6**:
1. **Case A (ไม่ส่ง Token):** เรียก `GET /api/books` โดยไม่มี Authorization Header -> **Expected: HTTP 401 Unauthorized** ✅
2. **Case B (Viewer สั่ง DELETE):** ล็อกอินด้วย `usera@test.com` แล้วสั่ง `DELETE /api/books/1` -> **Expected: HTTP 403 Forbidden** ✅
3. **Case C (Admin สั่ง DELETE):** ล็อกอินด้วย `userc@test.com` สั่ง `DELETE /api/books/:id` -> **Expected: HTTP 200/204 Success** ✅

---

## 📝 4. คำตอบคำถามท้ายบท

### 4.1 คำถามท้ายบท Lab 9.6
* **ข้อ 1: Environment Variable คืออะไร และมีประโยชน์อย่างไร?**  
  * **ตอบ:** คือค่ากำหนดที่อยู่นอก Source Code ประโยชน์คือช่วยแยก Configuration ออกจากโค้ด ทำให้ Source Code ชุดเดิมสลับใช้ระหว่าง Dev และ Production ได้โดยไม่ต้องแก้โค้ด
* **ข้อ 2: ทำไมไม่ควรเขียน Secret และ Password ลงใน Source Code?**  
  * **ตอบ:** เพื่อความปลอดภัย ป้องกันไม่ให้รหัสผ่านรั่วไหลเมื่อ Push ขึ้น Git และช่วยให้เปลี่ยน Credential ได้ทันทีโดยไม่ต้องแก้โค้ด
* **ข้อ 3: `.env` กับ `.env.example` ต่างกันอย่างไร ไฟล์ใดควร Commit?**  
  * **ตอบ:** `.env` มีข้อมูลความลับจริง ห้าม Commit ส่วน `.env.example` มีแค่ชื่อตัวแปรว่าง ๆ ไม่มีรหัสผ่านจริง ควร Commit เพื่อเป็นแม่แบบ
* **ข้อ 4: ทำไม `VITE_API_URL` อยู่ใน Frontend ได้ แต่ห้ามเก็บ `DB_PASSWORD` หรือ `JWT_SECRET`?**  
  * **ตอบ:** เพราะ Frontend ทำงานบน Browser ของผู้ใช้ ทำให้คนทั่วไป Inspect ดูข้อมูลได้ API URL จึงเปิดเผยได้ แต่รหัสผ่านและ Secret จะรั่วไหลทันที
* **ข้อ 5: ทำงานได้บน localhost ทำไมยังสรุปไม่ได้ว่าพร้อมสำหรับ Production?**  
  * **ตอบ:** เพราะ Production อยู่คนละ Server และเชื่อมผ่าน Internet ต้องรับมือกับ CORS, HTTPS, พอร์ตแบบไดนามิก และไม่สามารถใช้ค่า localhost ได้อีกต่อไป

---

### 4.2 คำถามท้ายบท Lab 9.7
* **ข้อ 1: ทำไมจึงต้อง Deploy Database ก่อน Backend และ Deploy Backend ก่อน Frontend?**  
  * **ตอบ:** เพราะ Backend ต้องใช้ Connection Info (Host, Port, User) ของ Database ในการเริ่มทำงาน และ Frontend ต้องรู้ Public URL ของ Backend เพื่อใช้เป็น `VITE_API_URL` ก่อนที่จะ Build และ Deploy
* **ข้อ 2: อธิบายความแตกต่างระหว่าง `DB_HOST=localhost` กับ DB_HOST บน Production?**  
  * **ตอบ:** `localhost` ชี้ไปที่เครื่องของ Developer เท่านั้น ส่วนบน Production เป็น Host ของ Cloud Database (เช่น Aiven) Environment Variables ช่วยให้สลับค่า Host นี้ได้ตามสภาพแวดล้อมโดยไม่ต้องแก้ Source Code
* **ข้อ 3: ทำไม Frontend บน Vercel จึงไม่ควรเรียก `http://localhost:3000`?**  
  * **ตอบ:** เพราะเมื่อ Deploy แล้ว Frontend จะทำงานบน Browser ของผู้ใช้ทั่วไป หากเรียก `localhost` จะหมายถึงเครื่องของผู้ใช้เอง ซึ่งไม่มี Backend ทำงานอยู่ ทำให้เชื่อมต่อ API ไม่ได้
* **ข้อ 4: CORS เกี่ยวข้องกับการที่ Frontend อยู่บน Vercel และ Backend อยู่บน Render อย่างไร?**  
  * **ตอบ:** เพราะทั้งสองอยู่คนละ Domain/Origin กัน Web Browser จะบล็อก Request ตาม Security Policy ดังนั้น Backend บน Render จึงต้องเปิด CORS เพื่ออนุญาตให้ Request จาก Origin ของ Vercel เข้ามาได้
* **ข้อ 5: หาก Production Frontend เปิดได้ปกติ แต่ Login ไม่สำเร็จ ควรตรวจสอบตามลำดับอย่างไร?**  
  * **ตอบ:** ตรวจสอบจากหลังไปหน้า: (1) ตรวจว่า Backend ต่อ Aiven MySQL สำเร็จและมีตาราง `users` หรือไม่ (2) ทดสอบเรียก POST `/api/login` ของ Backend ด้วย Postman โดยตรงเพื่อดู Error (3) ตรวจสอบค่า `VITE_API_URL` บน Vercel ว่าชี้ไปหา Backend ถูกต้องหรือไม่
