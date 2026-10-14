# OurHouse

A mobile app where members of a household share shopping lists and see what everyone has added.

- `Client/`: Expo (SDK 54) / React Native app in TypeScript.
- `Server/`: Flask API.
- `database/migrations/`: SQL for the Supabase (PostgreSQL) database.

## Prerequisites

- Python 3.9 or newer
- Node.js 20 or newer, with npm
- A Supabase project. Its URL, anon key and service key are under **Settings → API**.
- On a phone: the Expo Go app. Otherwise use an Android emulator or iOS simulator.

## Database

Run the files in `database/migrations/` in numeric order in the Supabase SQL editor.

## Server

```bash
cd Server
python -m venv venv
# Windows: venv\Scripts\activate    macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then fill in SUPABASE_URL and SUPABASE_KEY
flask --app app run --port 5000
```

To check that the server is up, run `curl http://localhost:5000/api/health`. It should return `{"status": "healthy"}`.

To run the tests, which don't need a `.env`:

```bash
pytest
```

## Client

```bash
cd Client
npm install
cp .env.example .env          # then fill in the Supabase URL and anon key
npx expo start
```

When you run the app on a phone, set `EXPO_PUBLIC_API_BASE_URL` to your computer's LAN IP, for example `http://192.168.1.20:5000/api`. `localhost` won't reach the server from the phone.

To run the tests and type-check:

```bash
npm test
npm run type-check
```
