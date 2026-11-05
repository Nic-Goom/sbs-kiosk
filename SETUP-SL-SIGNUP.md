# Supported Lodgings kiosk: connecting the host sign-up to ActiveCampaign

Page: `supported-lodgings.html`
(live at `https://nic-goom.github.io/sbs-kiosk/supported-lodgings.html` once merged to `main`)

The page has two forms. They do different jobs and go to different places.

| Form | What the visitor gets | Where it goes | Status |
|---|---|---|---|
| **Get the free guide** | The SL guide by email | Fostering & Lodgings form (f=3), Source `SL Guide`, which fires the existing guide automation | **Live** |
| **Sign up to host** | A call from the SL team | Its own form (`slsignup` in CONFIG), Source `SL Kiosk Sign-up` | **Held on the device until connected** |

Until the sign-up form is connected, every sign-up is saved on the tablet or phone it was taken on. Nothing is lost, but nothing reaches ActiveCampaign either. The staff panel shows how many sign-ups are being held. **Export the CSV before you leave each event.**

---

## Step 1. Pick or make the ActiveCampaign form

Use whichever of these fits:

- **Option A: reuse the website's sign-up form** (if it's an ActiveCampaign form). The kiosk sign-ups then land in the same place as website sign-ups, and the same automation picks them up.
- **Option B: make a new form called "SL Kiosk Sign-up".** Choose this if you want kiosk sign-ups reported separately.

The form needs these fields:

- Full name
- Email
- **Phone**. Use a custom **text** field rather than ActiveCampaign's built-in Phone field. The built-in field rejected kiosk entries before, because of its validation.
- Postcode (custom text field)
- Spare room? (custom text field; the kiosk sends `Yes` / `Not yet` / `Not sure`)
- Best time to call (custom text field; the kiosk sends `Morning` / `Afternoon` / `Evening` / `Any time`)
- Source, Date, Time and Opt-in. These are the same custom fields the F&L form already uses: field 30, 31, 32 and 33.

## Step 2. Get the embed code

In ActiveCampaign, go to **Website → Forms**, open the form, then choose **Integrate → Embed → Full embed** and copy the code.

The embed code contains no personal data. It's just the form's settings, so it's safe to paste into a Claude chat. Claude can then do Step 3 for you.

## Step 3. Put the values into the kiosk

To do it yourself, open `supported-lodgings.html` on GitHub (click the pencil to edit) and search for `slsignup:`. Fill it in from the embed code:

```js
slsignup: {
  ready: true,                                   // ← switch on
  meta: { u: '…', f: '…', s: '', c: '0', m: '0', act: 'sub', v: '2', or: '…' },
  fields: {
    source: 'field[30]', date: 'field[31]', time: 'field[32]', optin: 'field[33]',
    phone: 'field[..]', postcode: 'field[..]', room: 'field[..]', calltime: 'field[..]'
  }
}
```

- `u`, `f` and `or` are the values of the hidden inputs with those names in the embed code.
- Each `field[..]` is the `name="field[NN]"` of the matching input in the embed code.

## Step 4. Automation

In ActiveCampaign, add an automation that starts when someone **submits** the form (or, on the shared form, when Source is `SL Kiosk Sign-up`). It should:

- notify the SL team or create a task to call the person back
- add a tag such as `SL – Kiosk sign-up` so you can report on it

## Step 5. Test it, then bump the cache

1. Submit a test sign-up on a phone.
2. Check it arrives in ActiveCampaign with the phone, postcode, room and call-time values filled in.
3. Tablets keep a cached copy of the page. To make them pick up the change, edit `sw.js` and add one to `CACHE_VERSION` (e.g. `sbs-kiosk-v59` → `sbs-kiosk-v60`).

Anything held on a device sends automatically the next time it's online with the new version.

---

## Staff panel

There are three ways in:

- **Press and hold the Step by Step logo for 2 seconds** (on the home screen)
- tap the bottom-right corner 5 times quickly
- open the page with `#staff` on the end of the address

The panel shows entries waiting to send, sign-ups held on the device, **Try to send now**, **Export all entries (CSV)** and **Close**.

## Donations

The Give a Little link is in `CONFIG.event.donateUrl`, and the QR image is `project/assets/qr-donate.png`. The QR encodes the same link.
