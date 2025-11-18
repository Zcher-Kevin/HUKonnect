# HUKonnect

COMP3330_Group project

Here is the group project that created by COMP3330-Group3 :

## Participant
1. Chan Wai Lung, Kevin
2. Galiev Ildar

## Features
1. Personalized Schedule Builder — Create, edit, and color-code your weekly schedule with classes, labs, and study blocks.
2. Find Classmates’ Schedules — Search for other students and view their public schedules to identify common free times.
3. Real-time Chat — One-to-one messaging with read receipts and in-app notifications.
4. Study Group Invites — Create groups, invite classmates, share meeting times, and coordinate tasks.
5. Privacy Controls — Mark schedule items as private or public and control what others see.
6. Fast & Local-first — Designed for speed on campus networks with offline-friendly caching.

## Stucture
- `backend/` — Node + Express API
  - `package.json` — backend dependencies and npm scripts (start, seed, etc.)
  - `server.js` — Express app bootstrap, DB connection and route mounting
  - `middleware/` — request middleware (e.g., `auth.js` for JWT protection)
  - `models/` — Mongoose schemas (`User.js`, `Group.js`, `Event.js`)
  - `routes/` — Express route handlers (`auth.js`, `users.js`, `messages.js`, `events.js`, `groups.js`, `admin.js`)
  - `scripts/` — helper scripts (e.g., `seedDatabase.js`, `test-user-data.js`)

- `frontend/` — Expo (React Native) mobile client (TypeScript)
  - `package.json` — frontend deps and scripts (`expo`, `start`, `ios`, `android`)
  - `app.json`, `babel.config.js`, `tsconfig.json`, `metro.config.js` — Expo / build config
  - `app/` — Expo Router file-based routes and screens
    - `_layout.tsx` — app-level layout and router wrapper
    - `(tabs)/` — tabbed navigation (tabs layout + `events.tsx`, `messages.tsx`, `settings.tsx`)
    - `auth/` — `login.tsx`, `create-account.tsx`
    - `user/` — profile screens (`[id].tsx`, `[id]/schedule.tsx`)
    - `messages/` — DM screens (`[id].tsx`)
  - `components/` — shared UI components (e.g., `TabTransitionView.tsx`, `BouncyButton.tsx`, `Schedule.tsx`)
  - `app/lib/` — helpers and utilities (`axiosSetup.ts`, `config.ts`, `events.ts`, `chatStore.ts`, `storage.ts`, `validators.ts`)
  - `assets/` — fonts, images, sounds (`assets/sounds/tap.mp3`)
  - `constants/`, `hooks/`, `diagnostics/` — theme constants, hooks and diagnostics utilities

## Quickstart


Prerequisites: Node 18+, npm, Git, and Android/iOS emulator or an Expo Go/dev client on your device.

Start the backend:
```bash
cd backend
npm install
# optionally seed the DB
node scripts/seedDatabase.js
npm start
```
Start the frontend:
```bash
cd frontend
npm install
npx expo start -c
# choose LAN or tunnel; open in Expo Go or a matching dev client
```

## Requirements

- Node.js 18.x (tested)
- npm 9.x
- Expo CLI (latest)
- Android Studio emulator or iOS Simulator (Xcode) for native testing
- MongoDB (local or Atlas)

## Configuration

Backend:
- MONGO_URI (defaults to mongodb://localhost:27017/hukonnect)
- JWT_SECRET
- PORT (default: 3000)

Frontend:
- To use a local backend from a physical device, set the API base to your machine LAN IP in:
  - `frontend/app/lib/config.ts` or
  - `frontend/app/lib/axiosSetup.ts`
  Example: `http://192.168.0.3:3000`

## Troubleshooting

- Device cannot reach backend:
  - Make sure the backend binds to `0.0.0.0` (not just `localhost`) and macOS firewall isn't blocking the port.
  - For a physical Android/iOS device, set the frontend API base to `http://<YOUR_LAN_IP>:3000` in `frontend/app/lib/config.ts` or `frontend/app/lib/axiosSetup.ts`.
  - For Android emulator (Android Studio): use `10.0.2.2` to reach host localhost.

- Expo / dev-client native module errors (TurboModule, PlatformConstants):
  - Ensure Expo Go or the dev client installed on the device matches the project's Expo SDK.
  - Run: `npx expo-doctor` and `npx expo install --check`

## Contributing

- Branch from `main` using `feature/<name>` or `fix/<ticket>`.
- Add tests where applicable and run lint before PR.
- Create a PR and request a reviewer.
