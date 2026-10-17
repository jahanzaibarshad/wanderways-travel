# WanderWays database setup — simple steps

Website code ready hai; yeh steps permanent database connect karne ke liye hain. Abhi koi Atlas account, cluster ya local secret is guide ki wajah se create/change nahi hua.

## 1. Atlas account aur free cluster

[MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) par account banao. Project ka naam `WanderWays` rakh sakte ho. Cluster create karte waqt **Free / M0** select karo, paid tier nahi. Available nearby region select karo. Cluster name `wanderways` rakh sakte ho. Atlas sample dataset import karna zaroori nahi; hamara apna tour seed hai.

## 2. Database user

Security setup / Database Access mein database user banao, misal `wanderways_app`. Strong generated password password manager mein save karo. App ko `wanderways` database par read/write access do; Atlas administrator permission ki zaroorat nahi. Atlas login aur database user alag cheezen hain.

## 3. Apna IP allow karo

Network Access / IP Access List mein **Add My Current IP Address** select karo. `0.0.0.0/0` (access from anywhere) local setup ke liye mat use karo. Internet/IP badalne par apna naya IP add karna ho sakta hai.

## 4. Connection string lo

Cluster mein **Connect → Drivers → Node.js** select karke URI copy karo. Username/password placeholders apne database user se replace karo. Hostname Atlas wala hi rakho. Hostname ke baad database name `wanderways` hona chahiye:

```dotenv
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/wanderways?retryWrites=true&w=majority
```

Yeh template hai, working credential nahi. Password mein `@`, `:`, `/`, `?`, `#`, `%` jaise characters hon to URI mein percent-encode karo. Atlas ke diye hue extra connection options preserve karo. URI/password chat, screenshots ya GitHub par share mat karo.

## 5. Existing server/.env edit karo

`server/.env` already exists. Isay example file se overwrite mat karo. Sirf `MONGODB_URI` add/update karo aur baqi local cache settings preserve karo. Local values:

```dotenv
NODE_ENV=development
PORT=5000
CLIENT_URL=http://127.0.0.1:5174
```

Persistent login ke liye unique `JWT_SECRET` bhi add karo. Project terminal mein yeh command random value generate karegi; output private rakho aur locally `.env` mein paste karo:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

`JWT_SECRET` restart ke baad same rakho. Isay change karne se existing login sessions invalid ho jate hain. Secrets sirf ignored `server/.env` mein rakho, React/VITE environment mein nahi.

## 6. Tours insert karo

Project root terminal mein:

```powershell
cd C:\Users\MSI\Internship-project-1
npm run seed --workspace server
```

Yeh five sample tours insert karta hai, existing bookings/tours delete nahi karta. `users`, `tours`, `bookings` collections app/models manage karte hain; manually schema banana zaroori nahi. Existing demo accounts/bookings automatically Atlas par transfer nahi hote.

## 7. Website normal mode mein chalao

Purana demo process chal raha ho to usi terminal mein Ctrl+C karo. Phir:

```powershell
npm run dev
```

**`npm run dev:demo` mat chalana**: woh Atlas ke bajaye temporary database use karega.

Open `http://127.0.0.1:5174`. Health check `http://127.0.0.1:5000/api/health` mein `database: connected` hona chahiye. Customer account dobara register karo aur booking banao. Server restart karke verify karo ke account aur booking ab bhi maujood hain.

## 8. Apna staff login banao

Ignored `server/.env` mein temporary private values add karo:

```dotenv
STAFF_NAME=Your Staff Name
STAFF_EMAIL=your-real-staff-email
STAFF_PASSWORD=your-unique-password-at-least-12-characters
```

Valid email aur unique 12–72-byte password use karo. Customer registration mein wohi email pehle use mat karo: script existing customer ko staff promote nahi karta.

```powershell
npm run create-staff --workspace server
```

Success ke baad `.env` se `STAFF_PASSWORD` line remove karo. Staff same login form se `/staff` dashboard open karega. Demo staff credentials Atlas par kaam nahi karte.

## Agar connection fail ho

- Authentication failed: database user/password aur URI encoding check karo, Atlas login password nahi.
- Timeout: current public IP access list aur network/VPN check karo.
- DNS error: Atlas hostname correctly copied hai ya nahi check karo; TLS verification disable mat karo.
- Website par tours empty: seed command Atlas URI ke saath run karo.
- Restart par data gayab: `npm run dev:demo` ke bajaye `npm run dev` use karo.

Free cluster learning/demo ke liye hai. Production hosting, network restrictions, backups aur business policies alag launch steps hain.

Official sources: [Free cluster setup](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/), [Atlas connection requirements](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/).
