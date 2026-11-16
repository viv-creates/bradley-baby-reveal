# Baby Bradley #1 — Setup

Everything guests see is in **index.html**. Guesses are saved to a Google Sheet through a small Google Apps Script.

## 1. Make the Google Sheet (about 5 minutes)

1. Create a new Google Sheet, e.g. "Baby Bradley Guesses".
2. Open **Extensions → Apps Script**. Delete the starter code and paste in all of `google-apps-script.gs`. Save.
3. In the function dropdown pick **setup** and click **Run**. Approve the permissions. Back in the Sheet you'll now see two tabs, **Guesses** and **Config**.
4. Click **Deploy → New deployment**. Under the gear icon choose **Web app**, then set:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.

## 2. Connect the page

Open `index.html` and paste the URL near the top:

```js
SCRIPT_URL: "https://script.google.com/macros/s/XXXX/exec",
```

If the URL is left empty, the page runs in **demo mode** and saves guesses only in that one browser.

## 3. Host it and send the invite

Any static host works. Two free options:
- **Netlify Drop** (app.netlify.com/drop): drag the folder in and you get a link.
- **GitHub Pages**: upload `index.html` to a repo and turn on Pages.

Send that link to friends and family.

## 4. Running the reveal (Config tab)

| Setting | What it does |
|---|---|
| `revealAt` | When the reveal goes live. Default is Thanksgiving, Nov 26 2026 at 4:00 PM in the Sheet's time zone. Anyone who hasn't guessed yet can still guess before they pop the balloon. |
| `gender` | Type `boy` or `girl`. **Only the Sheet knows this.** It is never in the HTML, so nobody can find it in the page source. |
| `revealNow` | Set to `TRUE` to reveal right away, for example when everyone is around the table. |

The reveal goes live once `gender` is filled in **and** either `revealAt` has passed or `revealNow` is TRUE. Open pages check for updates every 30 seconds. After that, the balloon glows and **tapping anywhere pops it**: confetti, "It's a BOY!/GIRL!", and the correct guessers get a 🏆.

## Testing before you send it

- Add `?preview=girl` or `?preview=boy` to the end of the page URL to try the pop without revealing anything to anyone.
- To clear test guesses, delete those rows from the **Guesses** tab.
- If you edit the script later, use **Deploy → Manage deployments → Edit → New version** so the same URL keeps working.
