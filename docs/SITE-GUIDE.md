# Site guide: how to change anything on the website

This guide is for the person who looks after the Manahil-e-Quran Academy website. It tells you where each thing lives and the exact steps to change, add or remove it.

There are two ways to change the site:

| Way | What you can change | Who can do it | Needs a developer? |
| --- | --- | --- | --- |
| **The dashboard** at `/admin` | Guides (articles, pillar pages, cluster pages), search settings and schema for every page, staff accounts, fees and invoices, leads, classes | Admin or editor (see section 2) | No |
| **The files** on GitHub | Menu, home page sections, course pages, country pages, fees table, questions, colours, contact details | Anyone who can edit a file on GitHub | No for text. A little care for layout |

A change made in the dashboard is live at once. A change made in a file goes live about a minute after you save ("commit") it on GitHub, because Vercel rebuilds the site by itself.

---

## 1. Quick finder

| I want to change… | Where | Section |
| --- | --- | --- |
| A guide, article, pillar page or cluster page | Dashboard → **Content** | 3 |
| The Google title, description or schema of any page | Dashboard → **SEO** | 4 |
| Who can sign in to the dashboard | Dashboard → **Staff** | 2 |
| How families pay, and invoices | Dashboard → **Fees** | 12 |
| Phone, WhatsApp, email, social links, trial offer | `src/content/site.ts` | 5 |
| The menu at the top | `src/components/Header.tsx` | 6 |
| The links in the footer | `src/components/Footer.tsx` | 6 |
| A section of the home page | `src/views/page.tsx` and `src/i18n/ui.en.ts` | 7 |
| A course page, or add a course | `src/content/courses.ts` | 8 |
| A country or audience page, or add one | `src/content/pages.ts` | 9 |
| Fees and plans | `src/content/pricing.ts` | 10 |
| Questions and answers | `src/content/faqs.ts` | 11 |
| Privacy policy, terms, refund policy | `src/content/legal.ts` | 11 |
| Reviews and teachers | `src/content/site.ts` | 5 |
| Urdu or Arabic wording | `src/i18n/ui.ur.ts`, `ui.ar.ts`, `src/content/i18n/` | 13 |
| Colours, fonts, logo | `src/app/globals.css`, `public/brand/` | 14 |
| The trial form | `src/components/LeadForm.tsx` | 15 |

---

## 2. Dashboard roles: admin and editor

Open `/admin/login`.

| Role | Signs in with | Can do |
| --- | --- | --- |
| **Owner** | The `ADMIN_PASSWORD` set in Vercel. Leave the email box empty | Everything |
| **Admin** | Email and password | Everything: leads, people, classes, performance, fees, content, SEO, staff |
| **Editor** | Email and password | **Content only**: write, edit, preview, publish and unpublish guides. Delete drafts |

An editor cannot see leads, families, fees, SEO settings for built-in pages or staff. If an editor opens one of those addresses, they are sent back to Content. An editor cannot delete a published page: they unpublish it, or ask an admin.

### Add an editor

1. Sign in as owner or admin.
2. Open **Staff**.
3. Fill in name, email, role (**Editor (content only)**) and a password of 10 characters or more.
4. Press **Create account**, then send the person their email and password yourself. The site does not email it.

### Change or remove someone

On the **Staff** page each account has four buttons:

- **Make admin / Make editor** switches the role.
- **Pause** signs the person out at once and stops them signing in. **Activate** undoes it.
- **Set** (beside "New password") gives them a new password.
- **Remove** deletes the account. Pages they wrote stay.

You cannot change your own account from this page, so nobody can lock themselves out by mistake.

---

## 3. Content: articles, pillar pages and cluster pages

Open **Content** in the dashboard. Everything here appears on the website under **Guides** (`/blog`).

### The three page types

| Type | What it is | Example |
| --- | --- | --- |
| **Pillar page** | The main page for a whole subject. It lists every cluster page that belongs to it | "Tajweed: a complete guide" |
| **Cluster page** | Goes deep on one question inside a subject, and links back to its pillar | "Makharij al-huruf: the 17 articulation points" |
| **Article** | Stands alone | A news item or a one-off guide |

Search engines and AI assistants trust a site more on a subject when one strong pillar page is supported by several cluster pages that link to each other. The site starts with three pillars (learning online, Tajweed, Hifz) and thirteen cluster pages.

### Write a new page

1. Press **New article**, **New pillar page** or **New cluster page**.
2. **Title**: the main heading of the page. The address is made from it. You can edit the address before the first publish.
3. **The short answer**: 40 to 60 words that answer the question on their own. It is shown in a box at the top. Google and AI assistants quote this part, so write it carefully.
4. **Summary**: one or two sentences, shown in lists of guides.
5. **The page**: the text itself. Formatting is explained below.
6. **Questions and answers** (optional): start each question with `Q:` and each answer with `A:`. These are shown at the end, and FAQ schema is added for you.
7. For a cluster page, choose its pillar under **Belongs to pillar page**.
8. Fill in **Search settings** (section 3.3).

### Formatting the text

Press **How to format text** above the box to see this on screen.

| You type | You get |
| --- | --- |
| `## Heading` | A section heading. Each one is added to "In this guide" at the top |
| `### Smaller heading` | A sub-heading |
| `**bold**` and `*italic*` | **bold** and *italic* |
| `[fees page](/pricing)` | A link to a page on this site |
| `[Quran.com](https://quran.com)` | A link to another site |
| Lines starting with `- ` | A bullet list |
| Lines starting with `1. ` | A numbered list |
| `> text` | A highlighted note |
| A row like `\| Age \| Minutes \|` followed by `\| --- \| --- \|` | A table |

Leave an empty line between paragraphs. HTML and scripts are not accepted: they are shown as plain text.

### 3.1 Draft, preview, publish

| Button | What it does |
| --- | --- |
| **Save draft** | Saves the page. Only staff can see it. It is not on the website and not in the sitemap |
| **Save and preview** | Saves, then shows the page exactly as visitors will see it. Only signed-in staff can open a preview |
| **Publish** | Puts the page on the website, in the Guides list, in the sitemap and in `llms.txt` |
| **Save and update the live page** | Shown once a page is published. Saves your changes to the live page |
| **Unpublish** | Takes the page off the website and makes it a draft again. The text is kept |
| **Delete this page** (bottom of the screen) | Removes it for good. Editors can delete drafts only |

A page cannot be published while a required part is missing. The screen says which.

### 3.2 Change or remove a page

- **Change**: Content → click the title → edit → **Save and update the live page**.
- **Take it off the site but keep it**: **Unpublish**.
- **Remove for good**: **Delete this page** → **Delete for good**. Links to it will stop working, so unpublishing is usually the better choice.
- **Do not change the address of a live page.** Other pages and Google already point to it.

### 3.3 On-page SEO settings (right-hand column)

| Setting | What to put |
| --- | --- |
| **Focus keyword** | The search you want this page to appear for, such as `makharij al-huruf` |
| **Search title** | 30 to 60 characters, with the keyword near the start. Empty = the page title |
| **Meta description** | 110 to 160 characters that make someone want to click. Empty = the summary |
| **More search settings → Canonical address** | Leave empty unless the same text lives at another address |
| **More search settings → Picture for social sharing** | Address of an image for WhatsApp and Facebook previews. Optional |
| **More search settings → Hide from search engines** | Tick to keep the page out of Google. The page still works for people who have the link |

The box "How it can look on Google" updates as you type. Under it, the **checklist** marks each point green when it is met: title length, description length, keyword in the title, description, address and first paragraph, short answer length, at least 600 words, at least 3 headings, at least 3 links to other pages of the site, at least 2 questions and answers, and a pillar chosen for cluster pages. Aim for all green. It is advice, not a lock: you can publish with some points open.

### 3.4 Schema markup for a guide

Under **Schema markup**:

- **Main schema type**: `Blog post` (default), `Article`, `How-to` or `None`. Choose **How-to** for a step-by-step page that has a numbered list.
- FAQ schema is added by itself when the page has questions and answers. Breadcrumb schema is always added.
- **Extra schema markup (JSON-LD)**: optional. Press **FAQ**, **How-to**, **Video**, **Course** or **Review** to start from an example, then replace the sample values with real ones. The box checks the text as you type and will not save schema that is not valid JSON.

Only mark up what is really on the page. Review schema for reviews that do not exist is against Google's rules and can get the site penalised.

---

## 4. SEO and schema for every other page

Open **SEO** in the dashboard (admins only). Every built-in page is listed by group: main pages, course pages, country pages, audience pages and policy pages, with a column for each language.

1. Click the language name (**English**, **اردو** or **العربية**) beside the page. A page you have already changed is marked "changed" or "hidden".
2. The screen shows the title and description the page has now, and the schema types it already carries.
3. Type a new **Title** or **Description**. Leave a box empty to keep the built-in one.
4. Tick **Hide from search engines** only for a page you do not want in Google.
5. **Extra schema markup (JSON-LD)**: add schema for this one page, in this one language. Use the example buttons as a start.
6. Press **Save**. The page changes straight away. Google shows the change after it next visits, usually within days.

To go back to the built-in wording, empty the boxes and save.

Each language is separate: changing the English fees page does not touch the Urdu or Arabic one.

---

## 5. Academy details: phone, email, offer, reviews, teachers

File: `src/content/site.ts`. One file controls what appears across the whole site.

| Line | What it changes |
| --- | --- |
| `name`, `shortName` | The academy name everywhere |
| `whatsapp` | WhatsApp number, digits only with country code, e.g. `923156540714` |
| `email` | Contact email |
| `address` | Postal address in the footer and in schema. Empty = hidden |
| `social` | Facebook, Instagram, YouTube, TikTok links. Empty = hidden |
| `trial: { classes: 3, minutes: 30 }` | The free-trial offer. Change the number here and every heading, button, FAQ and schema block follows |
| `classMinutes` | Length of a one-to-one class |
| `siblingDiscountPercent` | Sibling discount |
| `paymentMethods` | Which ways to pay are mentioned |
| `story` | Two or three sentences for the About page |
| `teachers` | Add real teachers and a "Meet the teachers" section appears on the About page |
| `reviews` | Add real reviews and the reviews section and star-rating schema switch on by themselves |
| `lastUpdated` | The "Last reviewed" date on key pages |

**Rule: only real teachers and real reviews.** Empty lists are simply hidden, so nothing fake is ever shown.

### How to edit a file on GitHub

1. Open the repository on github.com and click through to the file.
2. Press the pencil icon (**Edit this file**).
3. Make the change. Keep the quotation marks and commas exactly as they are around your text.
4. Press **Commit changes**. Vercel rebuilds the site in about a minute.
5. If the build fails, Vercel emails you and keeps the old version live. Open the file again: the usual cause is a missing quotation mark or comma.

---

## 6. Menu and footer

### Top menu

File: `src/components/Header.tsx`. Near the top is this list:

```ts
const nav = [
  { path: "/courses", label: t.courses },
  { path: "/online-quran-classes-for-kids", label: t.kids },
  { path: "/online-quran-classes-for-adults", label: t.adults },
  { path: "/female-quran-teacher-online", label: t.female },
  { path: "/group-quran-classes", label: t.group },
  { path: "/pricing", label: t.fees },
];
```

- **Remove an item**: delete its line.
- **Reorder**: move the lines.
- **Add an item**: add a line such as `{ path: "/about", label: t.about },` and add the word to the `nav:` block of each of the three files `src/i18n/ui.en.ts`, `ui.ur.ts` and `ui.ar.ts`, for example `about: "About",`.
- **Rename an item**: change the word in the `nav:` block of `src/i18n/ui.en.ts` (and the Urdu and Arabic files).

Keep the menu to six or seven items. More than that wraps on a tablet.

The **Book free trial** button in the header and the WhatsApp number in the top bar are part of the same file. The button text is `nav.trial` in the `ui` files.

### Footer

File: `src/components/Footer.tsx`. The course list and the country and audience lists build themselves from the content files, so a new course or landing page appears in the footer without any work. The last column ("Academy") is a plain list of links in that file: add, remove or reorder its lines the same way as the menu.

---

## 7. Home page sections

- **Layout and order**: `src/views/page.tsx`
- **Wording**: the `home:` block in `src/i18n/ui.en.ts` (and `ui.ur.ts`, `ui.ar.ts`)

The home page is a stack of sections, each starting with a comment that names it:

| Order | Section (comment in the file) | Wording key |
| --- | --- | --- |
| 1 | Hero: heading, text, buttons, trial form | `h1`, `sub`, `feesCta`, `facts` |
| 2 | What happens after the form: three steps | `trialSection.steps` |
| 3 | Learning path | `pathH`, `pathSub` (courses come from `courses.ts`) |
| 4 | Who it is for | `whoH`, `whoSub`, `who` |
| 5 | How classes work | `howH`, `howSub`, `how` |
| 6 | Fees | `feesH` (plans come from `pricing.ts`) |
| 7 | One-to-one, group or madrasah comparison | `compareH`, `compareRows` |
| 8 | Countries | `countriesH`, `countriesSub` |
| 9 | Reviews (shown only when `site.reviews` has entries) | `reviewsH` |
| 10 | Questions | `faqH` (questions come from `faqs.ts`) |
| 11 | Guides (the three pillar guides, English site only) | `guidesH` |
| 12 | Closing trial section | `trialSection` |

- **Change wording**: edit the text beside the key in `ui.en.ts`.
- **Remove a section**: in `src/views/page.tsx`, delete from the section's comment line down to its closing `</section>`.
- **Move a section**: cut that same block and paste it above or below another section.
- **Add a section**: copy an existing block, give it a new heading key in the three `ui` files, and change the content.

**Keep the hero short.** The heading, the first paragraph and the main button must fit the first screen on a phone. If you lengthen `h1` or `sub`, check the page on a phone afterwards (section 16).

---

## 8. Course pages (the "service" pages)

File: `src/content/courses.ts`. Each course is one block between `{` and `},`. The page at `/courses/<slug>`, the course list, the menu on the trial form, the footer, the sitemap and the course schema are all built from it.

| Field | Where it shows |
| --- | --- |
| `slug` | The address. Do not change it after launch |
| `name` | Menus, cards, the trial form |
| `h1` | Page heading |
| `metaTitle`, `metaDescription` | Google |
| `answer` | The 40 to 60 word answer under the heading |
| `step` | Position on the learning path (1 to 5), or `null` |
| `summary`, `ages`, `level`, `duration`, `schedule` | Cards and the fact row |
| `before`, `after`, `forWho` | "Who this course is for" |
| `syllabus` | "What you will learn": a list of `{ title, detail }` |
| `howTaught` | "How it is taught" |
| `faqs` | Questions at the end, with FAQ schema |
| `next` | The course that usually follows |

- **Change a course**: edit its fields.
- **Add a course**: copy a whole block, paste it after the last one, change every field and give it a new `slug`. Then add the same slug with translated text to `src/content/i18n/courses.ur.ts` and `courses.ar.ts`. Until you do, the Urdu and Arabic pages show the English text.
- **Remove a course**: delete its block here and in the two translation files. If another course names it in `next`, remove that line too.

---

## 9. Country and audience pages

File: `src/content/pages.ts`. These are the pages at the top level, such as `/online-quran-classes-usa` and `/female-quran-teacher-online`.

Each page has `slug`, `nav` (menu label), `h1`, `metaTitle`, `metaDescription`, `answer`, `facts` (the four facts beside the form), `blocks` (the body) and `faqs`.

The body is a list of blocks:

```ts
{ type: "h2", text: "A section heading" },
{ type: "p", text: "A paragraph. Link like this: [fees page](/pricing)." },
{ type: "ul", items: ["First point", "Second point"] },
{ type: "ol", items: ["Step one", "Step two"] },
{ type: "table", head: ["Age", "Class"], rows: [["4 to 5", "20 minutes"], ["6 to 8", "30 minutes"]] },
{ type: "note", text: "A highlighted note." },
```

- **Add a section**: add an `h2` block followed by its paragraphs, lists or table.
- **Remove a section**: delete the `h2` block and the blocks under it, up to the next `h2`.
- **Reorder**: move the blocks.
- **Add a page** (for example New Zealand): copy a whole country block, change the `slug`, the texts and the `country` line, and add its translation under the same slug in `src/content/i18n/pages.ur.ts` and `pages.ar.ts`. The page, its footer link, its sitemap entry and its row on the SEO screen appear by themselves.
- **Trial form presets**: `formCourse`, `formStudent`, `formTeacher`, `formClassType` and `country.formCountry` fill the form in for visitors of that page.

---

## 10. Fees and plans

File: `src/content/pricing.ts`.

- **Change a price**: edit the number in `prices: { USD: 45, GBP: 35, AUD: 69, CAD: 62 }`. Every page, FAQ, table and schema block that mentions the fee updates.
- **Add or remove a plan**: add or delete a block in `plans` (one-to-one) or in `groupTiers` (family and community groups).
- **Group class length and size**: `groupClass` and `groupTiers` in the same file.
- **Wording on the fees page**: the `pricingPage:` and `plan:` blocks in `src/i18n/ui.en.ts`.

---

## 11. Questions and policy pages

- **Questions**: `src/content/faqs.ts`. They sit in four groups (Getting started, Teachers, Fees and schedule, Learning), and each is `{ id: "cost", q: "Question?", a: "Answer." }`. Edit, add or delete blocks, giving each new one its own short `id`. FAQ schema follows by itself. The questions shown on the home, fees and trial pages are chosen by `id` in the `faqsFor` list at the bottom of the same file. Translations are in `src/content/i18n/faqs.ur.ts` and `faqs.ar.ts`, under the same `id`.
- **Policy pages**: `src/content/legal.ts`, written with the same blocks as section 9. Have them checked by someone who knows the law where you operate before launch.

---

## 12. Fees dashboard and payments

Dashboard → **Fees**.

1. **How families can pay** (bottom of the page): enter your card payment page link, your Payoneer details and your bank details once. Families see these on their invoice.
2. **New invoice**: choose the account, a title, the amount and currency, and a due date. Add a payment link for that invoice if you send separate links.
3. **Monthly invoices**: set each family's monthly fee on their page under **People**, then create a whole month's invoices in one step.
4. The family opens **Fees** in their dashboard and sees two steps: **1. Pay** (card button, or Payoneer and bank details) and **2. Tell us you have paid**.
5. The invoice then waits under **Payments to confirm**. Check the money has arrived and press **Confirm payment**. The family gets a receipt they can print.

Nothing is charged automatically and no card numbers are stored on this site.

---

## 13. Languages

The site is in English, Urdu and Arabic. Guides are in English only.

| Text | English | Urdu | Arabic |
| --- | --- | --- | --- |
| Menus, buttons, headings, forms | `src/i18n/ui.en.ts` | `ui.ur.ts` | `ui.ar.ts` |
| Dashboards | `src/i18n/app.en.ts` | `app.ur.ts` | `app.ar.ts` |
| Courses | `src/content/courses.ts` | `src/content/i18n/courses.ur.ts` | `courses.ar.ts` |
| Country and audience pages | `src/content/pages.ts` | `src/content/i18n/pages.ur.ts` | `pages.ar.ts` |
| Questions | `src/content/faqs.ts` | `src/content/i18n/faqs.ur.ts` | `faqs.ar.ts` |

When you change English wording, change the same key in the other two files. The three files must keep the same keys, or the build stops and tells you which key is missing.

---

## 14. Brand: colours, fonts, logo

- **Colours**: the top of `src/app/globals.css`. Deep emerald `#123D32`, antique gold `#C7A45D`, warm ivory `#FAF7EF`, charcoal `#26332E`. Change a value there and the whole site follows.
- **Fonts**: Cormorant Garamond for headings, Inter for text, Noto Naskh Arabic for Urdu and Arabic. Also set at the top of `src/app/globals.css`.
- **Logo files**: `public/brand/`. Replace a file with one of the same name and size.
- Full brand notes: `docs/BRAND.md`.

---

## 15. The trial form

File: `src/components/LeadForm.tsx`. It has three forms in one:

| Form | Where | Fields on show |
| --- | --- | --- |
| `quick` | Every hero and the closing section | Name, phone, country, course. "Add more details" opens the rest |
| `trial` | `/free-trial` | The same, plus class type and teacher |
| `full` | `/contact` | Everything, with the message box |

- **Countries in the list**: `COUNTRIES` in `src/lib/lead-types.ts`.
- **Field labels**: the `form:` block in the `ui` files.
- **Keep it short.** Each extra required field lowers the number of people who finish the form. The optional fields are behind "Add more details" on purpose.

A button on a course or landing page carries its choices to the trial page in the address, for example `/free-trial?course=Online+Tajweed+Classes&teacher=Female+teacher`. You can use the same kind of link in an advert or a WhatsApp message.

**If the form shows "We could not save your request just now"**, the site has no working database. Open `/api/health` on your live site: it lists what is missing. See README section 2.

---

## 16. Check before you publish a change

1. Open the page on a **phone**, a **tablet** and a **laptop** (or narrow the browser window). The heading and the main button should be visible without scrolling.
2. Send one test trial request and find it under **Leads**.
3. For a new guide, look at the checklist in the editor and open **Save and preview**.
4. Paste the page address into Google's Rich Results Test (search.google.com/test/rich-results) to confirm the schema reads correctly.
5. Open `/sitemap.xml` and check a new page is listed.

---

## 17. Adding a completely new page

For a new guide, use **Content** in the dashboard. For a new country or audience page, use section 9. For a new course, use section 8. These cover almost every case and need no layout work.

A page of a new kind (for example `/scholarships`) needs four small files. Ask a developer, or copy the About page:

1. `src/views/scholarships/page.tsx`: copy `src/views/about/page.tsx` and change the content.
2. `src/app/(en)/scholarships/page.tsx`, `src/app/ur/scholarships/page.tsx` and `src/app/ar/scholarships/page.tsx`: copy the three matching About route files and change `about` to `scholarships` inside.
3. Add the page to `src/app/sitemap.ts` (`...multi("/scholarships", 0.6),`) and to `src/lib/site-pages.ts` so it appears on the SEO screen.
4. Add it to the menu or footer (section 6).
