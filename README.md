# mehreenz + ali

a cute retro arcade + tamagotchi-style world for **two people** — mehreenz and ali. it's a
tiny private world with an access code, two separate pets, a shared realtime pet park,
gifts, friendship, and a floating chat.

open it up, enter the secret code, pick who you are, and you and your partner each raise your
own little pixel pet. your pets can meet in the **pet park**, walk around, say hi, play, sit
together, trade gifts, and grow their friendship — all synced live between both of you.

## the loop

play games → earn rewards → take care of your own pet → meet in the park → build friendship

## two people, one world

- **each person has their own password** — typing it logs you straight into that account
  (mehreenz or ali). no shared code, no "who are you?" step. switch people by logging out
  (click your name in the header) and entering the other password.
- **each person has their own pet** (name, hunger, happiness, energy, health, xp, level, coins,
  appearance) saved separately — you can only permanently change your *own* pet
- **you both see each other's pet** and whether the other is **online**
- interact with each other's pets only through approved actions: say hi, gifts, playing,
  sitting together, shared activities

## the pet park (the heart of it)

- a little pixel environment: sky, sun, clouds, trees, flowers, a bench, a ball, grass
- **move your pet** with arrow keys / wasd on desktop or the on-screen d-pad on mobile
- **realtime**: when one of you moves, the other sees it move immediately
- **walk close** and the two pets meet — hearts, a cute message, and friendship goes up
- **interactions unlock as friendship grows**:
  - lvl 1 — say hi
  - lvl 2 — play together
  - lvl 3 — sit together / nap
  - lvl 4 — give gifts
  - lvl 5 — special moment ✨
- **gifts**: 🍎 apple, 🌷 flower, 🍪 cookie, 🎁 present, ⭐ star — the receiver's pet reacts live
- **rare special moments** happen on their own when you're both online
- **finish a game** and your partner's pet celebrates too (+friendship)

## games — now two-player

- **four games** wired to your pet: 🔤 wordle, 🧱 tetris, 🐍 snake, 🐤 flappy
- **🔤 wordle is co-op** — you both share **one board and one word**: you see each other's
  letters appear live as you type and take turns guessing to crack it **together**
- **🐤 flappy is truly two-player** — you both fly through the **same sky / same pipes** at the
  same time and see each other's bird live; when you both crash, a winner is shown
- **tetris & snake** show a **versus scoreboard** so your scores race head-to-head in realtime
- tetris now has a smooth **animated hard drop** (the piece falls instead of teleporting)
- every game still feeds rewards back into your own pet, and high scores are saved forever

## also included

- **floating realtime chat** (the pink **💬 chat** button, bottom-right) with quick messages
  and an unread badge
- **desktop notifications** — click **🔔 alerts** in the header once to allow them, then you'll
  get a chrome pop-up when the other person messages you (even if the tab isn't focused)
- **📣 bug {partner}** button — pokes the other person with a "come play!" desktop notification
- **shared friendship stat** (★★★★★) that grows the more your pets interact
- **food shop, xp + levels, gentle stat decay, crt/pixel aesthetic**

## setup — turning on cross-device realtime (one time)

out of the box the app runs in **preview mode**: everything syncs between browser tabs on the
same computer, so you can try the whole thing immediately. to make it sync between two
different devices, add a free Firebase Realtime Database:

1. go to <https://console.firebase.google.com> and create a project
2. **Build → Realtime Database → Create Database** (start in test mode)
3. **Project settings → General → Your apps → </> Web** and copy the config
4. add the values either by:
   - copying **`.env.example`** to **`.env`** and filling in the `VITE_FIREBASE_*` values
     (recommended for deploying — no code edits, secrets stay out of the source), **or**
   - pasting them straight into `FIREBASE_CONFIG` in **`src/realtime/config.js`**
5. set each person's password with `VITE_CODE_MEHREENZ` and `VITE_CODE_ALI` (and keep
   `VITE_WORLD_ID` the same for both people so you share one world)
6. lock the database down with the included **`database.rules.json`** (Realtime Database → Rules
   → paste → publish) so only your world path is readable/writable

that's it — you two now share one live world from anywhere.

> **confirming your keys loaded:** after editing `.env` you must **restart `npm run dev`** (Vite
> only reads env files at startup). you'll know it worked when the login screen says
> **"☁ cloud sync on"** and the header shows a green **"☁ live"** badge — that badge only turns
> green once the app has actually reached your database, so it's proof the keys are correct.

### deploying

it's a static site — run `npm run build` and host the `dist/` folder anywhere (Netlify, Vercel,
GitHub Pages, Firebase Hosting…). set the same `VITE_*` env vars in your host so realtime works
in production. the app also **self-heals** the shared world by trimming old chat/events so the
database doesn't grow forever.

> tip while testing on one computer: open a second tab at `?me=ali` (or `?me=mehreenz`) to be
> the other person.

## running it

```bash
npm install
npm run dev
```

then open the local url vite prints (usually http://localhost:5173).

to build for production:

```bash
npm run build
npm run preview
```

## project structure

```
src/
  components/   header, pet, home, petpage, petpark, friendship, giftmenu,
                floatingchat, versushud, arcademenu, feedmenu, navigation,
                notification, animalpicker, petstats, gamecard, statsscreen
  games/        wordle, tetris, snake, flappybird
  hooks/        usePet, useLocalStorage, useWorldEvents
  realtime/     config, firebaseClient, localClient, RealtimeContext, world
  session/      useSession, AccessGate
  utils/        rewards, timeGreeting, petDecay, words, animals, social, petText
  styles/       index.css
```

## tech

react + vite. realtime via firebase realtime database (with a built-in same-device fallback so
it works with zero setup). each pet is saved locally; the shared park, friendship, gifts and
chat live in the realtime layer.

made with care for mehreenz + ali 😊
# ittakestwo
