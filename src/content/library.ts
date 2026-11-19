import type { Faq } from "./types";
import { posts as articles } from "./blog";
import { courses } from "./courses";
import { landings } from "./pages";
import { site } from "./site";
import { blocksToMd } from "@/lib/markdown";

/**
 * The guides the site starts with: three pillar pages and the cluster pages that belong to them.
 *
 * - A PILLAR page covers a whole subject and links to every cluster page under it.
 * - A CLUSTER page answers one question in depth and links back to its pillar.
 * - An ARTICLE stands alone.
 *
 * When a database is connected these are copied into it once, and from then on they are edited in the admin panel
 * under Content. Changing this file later does not change a guide that has already been copied.
 * Without a database the site shows them straight from this file.
 *
 * Bodies are written in the same simple Markdown the editor uses (see src/lib/markdown.ts).
 */
export type LibraryPost = {
  slug: string;
  kind: "article" | "pillar" | "cluster";
  /** For a cluster page: the slug of its pillar. */
  pillar?: string;
  title: string;
  excerpt: string;
  answer: string;
  body: string;
  faqs: Faq[];
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  date: string;
  updated: string;
};

const t = site.trial.classes;
const NEW = "2026-10-10";

/* ------------------------------------------------------------------ pillar 1 */
const learnOnline: LibraryPost = {
  slug: "learn-quran-online",
  kind: "pillar",
  title: "How to learn the Quran online: a complete guide for families",
  excerpt: "Everything a parent or adult learner needs to know before starting: how online Quran classes work, the five stages of learning, what they cost, how to choose a teacher and how to tell whether it is working.",
  answer:
    "To learn the Quran online you take live video classes with a teacher who listens to you read and corrects each mistake. Most learners move through five stages: the Arabic letters (Noorani Qaida), reading the Quran, Tajweed, memorisation and, for some, Ijazah. Two to five half-hour classes a week is typical.",
  seoTitle: "How to Learn the Quran Online: Complete Guide (2026)",
  seoDescription: "A complete guide to learning the Quran online: how classes work, the five stages from Qaida to Ijazah, costs, choosing a teacher and tracking progress.",
  focusKeyword: "learn Quran online",
  date: NEW,
  updated: NEW,
  body: `## What "learning the Quran online" actually means

It is not an app and it is not a video course. It is a live class on Zoom or Google Meet. The teacher shares the page on screen, the student reads aloud, and the teacher stops and corrects every mistake as it happens. That is the same method the Quran has always been taught by: one person reciting to another who knows it.

What changes online is the practical side. There is no travel, the class happens at home where a parent can listen, and you are not limited to the teachers who live near you.

## Who it suits, and who it does not

| It suits | It is harder for |
| --- | --- |
| Children from about age 4 who can sit for 20 to 30 minutes | Children under 4, who learn better by listening at home |
| Adults who want privacy while they learn to read | Anyone without a quiet place and a steady connection |
| Families far from a mosque or without a teacher they trust | Children who need other children around them to stay motivated |
| Sisters who want a female teacher | |

If your child thrives on being with friends, keep the mosque class for community and use online lessons for the reading itself. Our comparison of [online classes and the local madrasah](/blog/online-quran-classes-vs-madrasah) goes through this honestly.

## The five stages of learning

Almost every learner follows the same path. You start wherever you already are.

| Stage | What you learn | Typical time |
| --- | --- | --- |
| 1. [Noorani Qaida](/courses/noorani-qaida-online) | Arabic letters, their sounds and how they join | 4 to 8 months for a child, 2 to 4 for an adult |
| 2. [Quran reading](/courses/quran-reading-course) | Reading the whole Quran from the mushaf | 1.5 to 3 years |
| 3. [Tajweed](/courses/online-tajweed-classes) | The rules of correct recitation | 4 to 8 months for the core rules |
| 4. [Hifz](/courses/online-hifz-classes) | Memorising, from Juz Amma to the whole Quran | 3 to 5 years part-time for the whole Quran |
| 5. [Ijazah](/courses/quran-ijazah-course) | Reciting the whole Quran to a certified teacher | 6 to 18 months |

Alongside these, many families add [Islamic studies for children](/courses/islamic-studies-for-kids), [translation and Tafseer](/courses/quran-tafseer-course) or [Quranic Arabic](/courses/quranic-arabic-course).

If you are starting from zero, read [what Noorani Qaida is and how long it takes](/blog/what-is-noorani-qaida). If you are deciding when a child should begin, see [the best age to start Quran classes](/blog/best-age-to-start-quran-classes).

## 1-on-1 or a small group?

1-on-1 gives the most correction time: the learner reads for nearly the whole class. A small group of two to six learners at the same level costs less for each family and suits siblings, cousins and friends who enjoy learning together. The rule that matters is the level. A group only works when everyone in it is at the same stage. See how [group Quran classes](/group-quran-classes) are arranged.

## How many classes a week

- **Qaida and reading:** three classes a week suits most children.
- **Tajweed for adults:** two classes a week with ten minutes of daily practice.
- **Hifz:** five classes a week, because memorisation depends on daily contact.

Short and regular beats long and occasional at every stage.

## What you need at home

1. A laptop or tablet with a camera and microphone. A phone works but the page is small.
2. A steady internet connection.
3. A quiet place and, ideally, headphones.
4. For children under 7, a parent nearby for the first few weeks.

## How to choose a teacher

Listen to the teacher recite, check their qualification, and make sure they can explain a mistake in words your child understands. Then confirm three practical things: the class is truly 1-on-1 (or a real small group), the same teacher takes every class, and you will receive progress reports. Our checklist covers all nine points: [how to choose an online Quran teacher](/blog/how-to-choose-online-quran-teacher).

## What it costs

Fees depend on how many classes you take each week, how long each class is and whether it is 1-on-1 or a group. We publish ours on the [fees page](/pricing), and we explain the going rates across the USA, UK and Australia in [how much online Quran classes cost](/blog/online-quran-classes-cost). Always compare academies by the price of one hour of teaching, not by the monthly figure.

## How to tell whether it is working

After the first month you should be able to answer yes to each of these:

- Does the learner read for most of the class, rather than listen?
- Can you say what was learned this week and what comes next?
- Is the same mistake being corrected until it disappears?
- Does your child go to class without a fight?

A good academy shows you this without being asked. In our dashboard parents see attendance, the lesson covered, the homework and the result of every quiz after each class.

## What the first month looks like

| Week | What happens |
| --- | --- |
| 1 | Trial classes. The teacher checks the level, and you agree fixed days and times |
| 2 | Regular classes begin. Expect some revision of things the learner already "knows": the teacher is closing gaps |
| 3 | A rhythm settles in: revision, new lesson, homework. The first short quiz |
| 4 | The first progress note. You should be able to say what was learned and what comes next |

If the fourth week arrives and you cannot say what has been learned, ask the teacher directly. A clear answer is a good sign. A vague one is your answer too.

## Class times that work, by country

Online classes are booked on your own clock. These are the slots that usually suit school-age children and working adults.

| Where you live | Children | Adults |
| --- | --- | --- |
| [USA](/online-quran-classes-usa) and [Canada](/online-quran-classes-canada) | 4 pm to 8 pm in your own time zone, and weekend mornings | Before work, lunchtime, or after Isha |
| [UK](/online-quran-classes-uk) | 4 pm to 8 pm, straight after school or after dinner | Early morning or late evening |
| [Australia](/online-quran-classes-australia) | 4 pm to 8 pm in your state, and weekend mornings | Before work or after the children are in bed |

Pick times you can keep every week. A fixed slot that never moves does more for progress than a longer class that keeps being rearranged.

## Seven questions to ask any academy before you pay

1. Is the class 1-on-1, and exactly how many minutes is it?
2. Will the same teacher take every class?
3. Can I choose a male or a female teacher?
4. What happens when we miss a class?
5. How will I see what was taught and how my child is doing?
6. Is there a contract, and how do I stop?
7. What does one hour of teaching cost?

Our own answers are on the [questions page](/faq) and the [fees page](/pricing).

## Common mistakes to avoid

- **Rushing the Qaida.** A letter learned wrongly is read wrongly on every page that follows.
- **Starting Hifz before the reading is sound.** The child memorises mistakes.
- **Changing teachers often.** Each change costs weeks while the new teacher finds the learner's level.
- **No practice between classes.** Five minutes a day makes the difference between months and years.
- **Choosing on price alone.** The cheapest class is expensive if the child has to be re-taught.

## Getting started

The simplest first step is a trial. Book [${t} free trial classes](/free-trial): in the first one the teacher checks the learner's level and tells you which stage to begin at.`,
  faqs: [
    { q: "Can you really learn the Quran online?", a: "Yes. The Quran is learned by reciting to a teacher who listens and corrects, and a live video class does exactly that. 1-on-1 online classes often give more reading time than a group class in person." },
    { q: "How long does it take to learn to read the Quran online?", a: "A child starting from the alphabet usually finishes Noorani Qaida in 4 to 8 months and a first complete reading of the Quran in a further 1.5 to 3 years, with three classes a week. Adults move through the Qaida in 2 to 4 months." },
    { q: "What is the best way to learn the Quran online for beginners?", a: "Begin with Noorani Qaida in short, regular 1-on-1 classes, practise for a few minutes every day, and do not move on to reading the Quran until every letter is pronounced correctly." },
  ],
};

const vsMadrasah: LibraryPost = {
  slug: "online-quran-classes-vs-madrasah",
  kind: "cluster",
  pillar: "learn-quran-online",
  title: "Online Quran classes or the local madrasah: an honest comparison",
  excerpt: "What each one does well, where each falls short, and why many families end up using both.",
  answer:
    "Neither is better for everyone. A local madrasah gives children friends, a link to the mosque and prayer in congregation. A private online class gives far more reading time, individual correction and a pace set by the child. Many families keep the mosque for community and use online lessons for the reading itself.",
  seoTitle: "Online Quran Classes vs Madrasah: Which Is Better?",
  seoDescription: "An honest comparison of online Quran classes and the local madrasah: reading time, cost, safety, social benefits and which suits your child.",
  focusKeyword: "online Quran classes vs madrasah",
  date: NEW,
  updated: NEW,
  body: `## The comparison at a glance

| | Local madrasah (group) | Online, 1-on-1 |
| --- | --- | --- |
| Time the child reads to the teacher | A few minutes in a one or two hour session | Most of a 30-minute class |
| Pace | Set by the class | Set by the child |
| Correction | Shared between many children | Every mistake, as it happens |
| Friends and community | Strong | Limited, unless siblings or friends share a group |
| Link to the mosque and congregational prayer | Yes | No |
| Travel | Drop-off and pick-up, often on school nights | None |
| Parent can listen in | Rarely | Always |
| Choice of teacher | Whoever teaches locally | Any teacher, including female teachers |
| Typical cost | Usually lower | Higher for 1-on-1, similar for a small group |

## What the madrasah does better

A child who walks into a mosque several times a week grows up at home there. They pray in congregation, hear the adhan, know the imam and make Muslim friends. No video class gives that, and it matters more as children become teenagers.

A good madrasah also teaches manners in a group: waiting, listening, respecting a teacher in front of others.

## What online classes do better

The honest weakness of most evening madrasahs is arithmetic. With twenty or thirty children and one teacher, each child reads for three or four minutes. The rest of the time is spent waiting. In a 1-on-1 class the child reads for the whole lesson, so progress is usually much faster.

Online also solves three practical problems: there is no teacher nearby, the family's evenings are already full, or a daughter needs a female teacher and the mosque does not have one.

## Questions to ask about your own child

- **Does my child read to the teacher for more than five minutes a session?** If not, progress will be slow wherever they are.
- **Does my child need other children to stay motivated?** If yes, keep a group setting, or use a small online group of friends.
- **Can I be at home during an online class?** Younger children need an adult nearby.
- **How far is the mosque?** An hour of driving for a few minutes of reading is a poor trade.

## Using both

This is what many families settle on:

1. **Weekend madrasah** for community, prayer and Islamic studies with friends.
2. **Two or three online classes in the week** for the reading, Tajweed or memorisation, where individual correction matters most.

The two teachers do not need to follow the same book. Tell the online teacher what the madrasah is covering and the lessons will support it.

## If you choose online only

Make up for what is missing. Take your children to Jumu'ah and Eid prayers, arrange for them to learn alongside a sibling or cousin when you can, and let them recite to grandparents. Our guide to [learning the Quran online](/blog/learn-quran-online) explains how to set classes up well, and you can see how our [classes for children](/online-quran-classes-for-kids) run.`,
  faqs: [
    { q: "Are online Quran classes as good as in-person classes?", a: "For reading, Tajweed and memorisation, a 1-on-1 online class usually gives a child more correction time than an in-person group class. For community and a connection with the mosque, in-person is better." },
    { q: "Can my child do both madrasah and online classes?", a: "Yes, and many families do. The madrasah provides community and the online class provides individual reading time. Two online classes a week alongside a weekend madrasah is a common pattern." },
    { q: "Is 1-on-1 always better than a group?", a: "Not always. Children who enjoy company often work harder in a small group of two to six at the same level, and it costs less. Large groups are where reading time becomes too short." },
  ],
};

const newMuslim: LibraryPost = {
  slug: "learn-quran-as-a-new-muslim",
  kind: "cluster",
  pillar: "learn-quran-online",
  title: "Learning the Quran as a new Muslim: where to start",
  excerpt: "A calm first plan for reverts: what to learn first for the prayer, how to start reading Arabic, and what can wait.",
  answer:
    "As a new Muslim, start with what your prayer needs: Surah Al-Fatihah and two or three short surahs, learned by listening and repeating with a teacher. Then learn the Arabic letters with Noorani Qaida so you can read for yourself. Understanding can begin on day one in your own language. Rules of recitation can wait.",
  seoTitle: "Learning the Quran as a New Muslim: Where to Start",
  seoDescription: "A practical first plan for new Muslims: what to learn first for salah, how to start reading Arabic with Noorani Qaida, and what can wait until later.",
  focusKeyword: "learn Quran for new Muslims",
  date: NEW,
  updated: NEW,
  body: `## You do not have to learn everything at once

New Muslims often feel they are years behind people who grew up with the Quran. You are not behind. You are at the start of the same path everyone walks, and adults move along it faster than children because they practise on purpose.

Take it in this order.

## Step 1: what your prayer needs

The five daily prayers come first, and they need only a little recitation to begin with.

1. **Surah Al-Fatihah.** It is recited in every unit of every prayer, so it is the first thing to learn well.
2. **Two or three short surahs**, such as Al-Ikhlas, Al-Falaq and An-Nas.
3. **The words said in each position** of the prayer.

Learn these by ear. Your teacher recites a phrase, you repeat it, and the teacher corrects you. Most adults have Al-Fatihah correct within two or three weeks of short, regular lessons.

> Writing the Arabic out in English letters can help you for the first few weeks. Treat it as a temporary support and drop it as soon as you can read the script, because English letters cannot show several Arabic sounds.

## Step 2: learn to read the script

Reading for yourself is what frees you from depending on recordings and transliteration. The standard beginner's book is [Noorani Qaida](/blog/what-is-noorani-qaida). It teaches the 28 letters, their sounds, the vowel marks and how letters join.

With two or three classes a week and ten minutes of daily practice, most adults finish it in two to four months. See our [Noorani Qaida course](/courses/noorani-qaida-online).

## Step 3: start reading the Quran

After the Qaida you read from the Quran itself, beginning with the short surahs at the end, which you will already half know from your prayers. Your teacher listens to a few lines each class. Fluency comes with pages read, not with theory.

## Understanding can start today

You do not need Arabic to understand what the Quran says. Read a clear translation in your own language alongside your lessons, starting with the surahs you recite in prayer. When you know what Al-Fatihah means, every prayer changes. Later, a [translation and Tafseer course](/courses/quran-tafseer-course) goes passage by passage with a teacher.

## What can wait

- **The detailed rules of Tajweed.** Your teacher will correct your pronunciation from the first day. The names of the rules can come once you read fluently.
- **Memorising long passages.** Short surahs are enough for now.
- **Arabic grammar.** Useful later, not needed to begin.

## Practical advice for adult beginners

- **Choose private lessons.** Most adults are shy about reading aloud. 1-on-1, nobody else hears you.
- **Keep lessons short and frequent.** Two half-hours a week with daily practice beats one long session.
- **Ask your questions.** A good teacher expects them. If you would rather ask a woman, sisters can choose a [female teacher](/female-quran-teacher-online).
- **Do not compare yourself** with born Muslims who have recited since childhood.

Our [classes for adults](/online-quran-classes-for-adults) are private and start from the first letter. For the full picture of how online learning works, read the guide to [learning the Quran online](/blog/learn-quran-online).`,
  faqs: [
    { q: "What should a new Muslim learn first from the Quran?", a: "Surah Al-Fatihah, because it is recited in every prayer, followed by two or three short surahs such as Al-Ikhlas, Al-Falaq and An-Nas." },
    { q: "Can I pray before I can read Arabic?", a: "Yes. You learn what the prayer needs by listening and repeating with a teacher, and you improve it as you go. Learning to read the script follows alongside." },
    { q: "How long does it take an adult to learn to read the Quran?", a: "Most adults finish Noorani Qaida in two to four months with regular classes and daily practice, and can then read the Quran slowly. Fluency builds over the following months." },
  ],
};

/* ------------------------------------------------------------------ pillar 2 */
const tajweed: LibraryPost = {
  slug: "tajweed-guide",
  kind: "pillar",
  title: "Tajweed: a complete guide to reciting the Quran correctly",
  excerpt: "What Tajweed is, why it matters, every main rule in the order you should learn it, and how to practise so the rules become habit.",
  answer:
    "Tajweed is the science of reciting the Quran as it was revealed: each letter from its correct place in the mouth or throat, with its correct qualities, for its correct length. It covers the articulation points of the letters, the rules of noon and meem, lengthening (madd), the echo of qalqalah, heavy and light letters, and where to stop.",
  seoTitle: "Tajweed: Complete Guide to the Rules of Recitation",
  seoDescription: "A complete guide to Tajweed: what it is, why it matters, the main rules in learning order (makharij, noon and meem, madd, qalqalah, waqf) and how to practise.",
  focusKeyword: "Tajweed",
  date: NEW,
  updated: NEW,
  body: `## What Tajweed means

The word comes from the Arabic for "making something excellent". In recitation it means giving every letter its right: where it comes from, what it sounds like and how long it lasts.

The Arabs at the time of revelation spoke this way naturally. As Islam spread and spoken Arabic changed, scholars wrote the rules down so that recitation would stay exactly as it was taught by the Prophet, peace be upon him, to his companions.

## Why it matters

Arabic words can change meaning with one sound. قَلْب (qalb) means heart. كَلْب (kalb) means dog. The only difference is the letter the word starts with. Tajweed protects the reciter from mistakes of that kind.

Scholars divide mistakes into two kinds:

| Kind | What it is | Example |
| --- | --- | --- |
| Clear mistakes | Changing a letter or a vowel so the word or its meaning changes | Reading ص as س, or dropping a letter |
| Hidden mistakes | The word is right but a finer rule is missed | Shortening a nasal sound that should be held |

Avoiding clear mistakes is required of everyone who is able to learn. Mastering the finer rules is the work of those who want to recite well. For a ruling on your own situation, ask a scholar you trust.

## The rules, in the order to learn them

### 1. Makharij: where each letter comes from

There are 17 articulation points in five areas: the open space of the mouth and throat, the throat, the tongue, the lips and the nose. This comes first because every other rule assumes the letters themselves are right. Full detail: [the articulation points of the Arabic letters](/blog/makharij-al-huruf).

### 2. Sifaat: the qualities of letters

Two letters can share a place and still sound different because of their qualities. The most useful one to learn early is heaviness. Seven letters are always heavy: خ ص ض غ ط ق ظ. The rest are light, except alif, lam and ra, which depend on what is around them.

### 3. Noon sakinah and tanween

A noon with no vowel, or the "n" sound of a tanween, is read in one of four ways depending on the next letter: clearly (izhar), merged (idgham), changed to a meem (iqlab) or hidden (ikhfa). These four rules come up in nearly every line. See [noon sakinah and tanween, with examples](/blog/noon-sakinah-and-tanween-rules).

### 4. Meem sakinah

A meem with no vowel has three rules: hidden before ب, merged into another م, and clear before every other letter.

### 5. Ghunnah

The nasal sound of noon and meem. When either letter carries a shaddah (نّ or مّ), the ghunnah is held for two counts.

### 6. Qalqalah

Five letters echo when they have no vowel or when you stop on them: ق ط ب ج د. The echo is light in the middle of a word and stronger at the end of an ayah, as in the last words of Surah Al-Ikhlas.

### 7. Madd: lengthening

The three madd letters are alif, waw and ya. A natural madd lasts two counts. It becomes longer when a hamzah or a sukoon follows. See [the types of madd and how long to hold each](/blog/madd-rules-in-tajweed).

### 8. Lam and ra

The lam in the name of Allah is heavy after a fatha or damma and light after a kasra. Ra is heavy or light depending on its vowel and the vowel before it. The lam of "al" is read before the 14 moon letters and silent before the 14 sun letters.

### 9. Waqf: stopping and starting

When you stop, the last vowel is dropped. A tanween with fatha becomes an alif sound, and ة is read as ه. The small signs printed in the mushaf show where stopping is required, allowed or best avoided.

## A simple order for the first six months

| Month | Focus |
| --- | --- |
| 1 | Makharij and heavy and light letters |
| 2 | Noon sakinah and tanween |
| 3 | Meem sakinah, ghunnah and qalqalah |
| 4 | Madd |
| 5 | Lam, ra and stopping |
| 6 | Applying everything at reading speed |

The short version of these rules is in [Tajweed rules for beginners](/blog/tajweed-rules-for-beginners).

## The letters English speakers most often get wrong

Most early mistakes come from swapping an Arabic letter for the nearest English sound. These are the pairs to listen for.

| Letter | Often read as | What to change |
| --- | --- | --- |
| ح | ه | ح comes from the middle of the throat and has a sharper, breathier sound. ه comes from the lowest part |
| ع | ء | ع is squeezed from the middle of the throat. A plain "a" sound is hamzah, not ع |
| ق | ك | ق is made further back, with the back of the tongue against the soft palate, and it is heavy |
| ص | س | Keep the tip of the tongue where it is and raise the back of the tongue, so the sound fills the mouth |
| ط | ت | The same place as ت, read heavy |
| ض | د | The side of the tongue presses against the upper back teeth. It is heavy and has no English equivalent |
| ث | س | The tip of the tongue touches the edge of the upper front teeth, like "th" in "think" |
| ذ | ز | The same place as ث, with voice, like "th" in "this" |
| ظ | ز | The same place as ذ, read heavy |

A teacher will hear in the first class which of these you need to work on. Most people need three or four of them, not all nine.

## Do you need to know Arabic?

No. Tajweed is about sound, not meaning. You need to be able to read the Arabic script, which is what the [Noorani Qaida](/courses/noorani-qaida-online) teaches. Understanding what you recite is a separate study, and a rewarding one: see [Quranic Arabic](/courses/quranic-arabic-course).

## How long it takes

With two classes a week and ten minutes of practice a day, most adults cover the core rules in four to eight months. Knowing a rule and applying it at reading speed are different things, so expect a further period in which the teacher simply listens and stops you until the rules are habit. Children usually learn the rules more slowly and apply them more easily.

## How to practise

1. **Recite to a teacher.** You cannot hear your own mistakes. This is the one part that cannot be skipped.
2. **Take one rule at a time** and find it in the surahs you already know.
3. **Listen daily** to a reciter known for precise, unhurried recitation, and copy a few ayahs.
4. **Go slowly.** Speed comes by itself. Accuracy does not.
5. **Record yourself** once a week and compare with last week.

## Learning Tajweed with a teacher

In our [online Tajweed classes](/courses/online-tajweed-classes) a teacher listens to your own recitation 1-on-1, teaches each rule in a few minutes and has you apply it for the rest of the class. Sisters can study with a female teacher. Strong reciters can go on to an [Ijazah](/courses/quran-ijazah-course).`,
  faqs: [
    { q: "What is Tajweed in simple words?", a: "Tajweed is reciting the Quran correctly: pronouncing each letter from its proper place, with its proper sound, and holding it for the proper length." },
    { q: "How many rules of Tajweed are there?", a: "There is no single agreed number, because rules can be grouped in different ways. Beginners usually learn about nine areas: makharij, the qualities of letters, noon sakinah and tanween, meem sakinah, ghunnah, qalqalah, madd, lam and ra, and stopping." },
    { q: "Can I learn Tajweed from YouTube?", a: "Videos are useful for understanding the rules. They cannot hear you, so they cannot correct your pronunciation. Use them alongside a teacher who listens to you recite." },
  ],
};

const makharij: LibraryPost = {
  slug: "makharij-al-huruf",
  kind: "cluster",
  pillar: "tajweed-guide",
  title: "Makharij al-huruf: the 17 articulation points of the Arabic letters",
  excerpt: "Where each of the 28 Arabic letters is produced, area by area, with the letters most often confused and how to fix them.",
  answer:
    "Makharij al-huruf are the places in the mouth, throat and nose where the Arabic letters are produced. Scholars of Tajweed count 17 of them in five areas: the open space of the mouth and throat (1), the throat (3), the tongue (10), the lips (2) and the nasal passage (1).",
  seoTitle: "Makharij al-Huruf: 17 Articulation Points Explained",
  seoDescription: "The 17 makharij (articulation points) of the Arabic letters in five areas, with a table for every letter, the pairs learners confuse and how to practise them.",
  focusKeyword: "makharij al-huruf",
  date: NEW,
  updated: NEW,
  body: `## Why makharij come first

Every other rule of Tajweed is about what to do with a letter. Makharij are about the letter itself. If ح comes out as ه, no later rule will repair it. This is why teachers spend the first weeks here, and why time spent on it is never wasted.

The count of 17 points follows Imam Ibn al-Jazari, whose description is the one most teachers use today.

## The five areas

| Area | Points | Letters |
| --- | --- | --- |
| The open space of the mouth and throat (al-jawf) | 1 | The three long vowels: alif, waw and ya when they lengthen |
| The throat (al-halq) | 3 | ء ه ع ح غ خ |
| The tongue (al-lisan) | 10 | ق ك ج ش ي ض ل ن ر ط د ت ص ز س ظ ذ ث |
| The lips (ash-shafatan) | 2 | ف ب م و |
| The nasal passage (al-khayshum) | 1 | The nasal sound (ghunnah) of ن and م |

## The throat: three points

| Part of the throat | Letters |
| --- | --- |
| Deepest, nearest the chest | ء ه |
| Middle | ع ح |
| Top, nearest the mouth | غ خ |

These six are the letters English speakers find hardest, because English uses only one of them (ه, as in "house").

## The tongue: ten points

| Part of the tongue | Touches | Letters |
| --- | --- | --- |
| The very back | The soft palate | ق |
| The back, slightly further forward | The hard palate | ك |
| The middle | The roof of the mouth | ج ش ي |
| One or both sides | The upper back teeth | ض |
| The sides near the tip | The gums of the upper front teeth | ل |
| The tip | The gum just behind the upper front teeth | ن |
| The tip, a little further back | The same gum | ر |
| The top of the tip | The roots of the upper front teeth | ط د ت |
| The tip | Just behind the lower front teeth, air passing over them | ص ز س |
| The tip | The edges of the upper front teeth | ظ ذ ث |

## The lips: two points

- **ف** : the inside of the lower lip touches the edges of the upper front teeth.
- **ب م و** : both lips. They close for ب and م, and round without closing for و.

## Letters that learners confuse

| Often read as | Should be | The fix |
| --- | --- | --- |
| ه | ح | ح is from the middle of the throat with a tight, breathy sound. ه is from the very bottom and is soft. |
| ء | ع | ع squeezes the middle of the throat. It is a consonant, not a vowel. |
| ك | ق | ق is further back, and heavy. |
| س | ص | Same place. ص is heavy: raise the back of the tongue. |
| د | ض | ض uses the side of the tongue against the back teeth, and is heavy. |
| ت | ط | Same place. ط is heavy. |
| ز or ذ | ظ | ظ: the tongue tip touches the edges of the upper teeth, and the sound is heavy. |
| س or ت | ث | ث: the tongue tip comes lightly between the teeth, as in English "three". |

## How to practise

1. **Say each letter with a sukoon after a hamzah**: أَبْ, أَتْ, أَثْ and so on. This isolates the place the sound comes from.
2. **Use a mirror** for the lip and tongue-tip letters.
3. **Work in pairs.** Practise ح against ه, and ص against س, until you can hear and feel the difference.
4. **Recite to a teacher.** You cannot see your own throat or hear your own accent. A teacher catches in one lesson what self-study misses for months.

Makharij are the first unit of our [online Tajweed classes](/courses/online-tajweed-classes), and the first chapter of [Noorani Qaida](/courses/noorani-qaida-online) for children. The full list of rules is in the [complete guide to Tajweed](/blog/tajweed-guide).`,
  faqs: [
    { q: "How many makharij are there?", a: "Seventeen, in five areas, according to Imam Ibn al-Jazari, whose count most teachers follow. Some earlier scholars counted sixteen or fourteen by grouping certain letters differently." },
    { q: "What is the difference between makharij and sifaat?", a: "Makharij are where a letter is produced. Sifaat are its qualities, such as heaviness or lightness. Two letters can share a place and still sound different because their qualities differ, as ص and س do." },
    { q: "Which Arabic letters are hardest for English speakers?", a: "Usually ع, ح, غ, خ, ق and ض, because English has no equivalent sounds. Daily practice of each one with a sukoon, corrected by a teacher, fixes them." },
  ],
};

const noonRules: LibraryPost = {
  slug: "noon-sakinah-and-tanween-rules",
  kind: "cluster",
  pillar: "tajweed-guide",
  title: "Noon sakinah and tanween: the four rules, with examples",
  excerpt: "Izhar, idgham, iqlab and ikhfa explained simply, with the letters for each, examples from short surahs and the exceptions.",
  answer:
    "A noon with no vowel (noon sakinah) or the n-sound of a tanween is read in one of four ways, decided by the letter that follows: izhar (clear) before six throat letters, idgham (merged) before six letters, iqlab (changed to meem) before ب, and ikhfa (hidden, with a nasal sound) before the remaining fifteen.",
  seoTitle: "Noon Sakinah and Tanween Rules with Examples",
  seoDescription: "The four rules of noon sakinah and tanween (izhar, idgham, iqlab, ikhfa) with their letters, examples from the Quran, the exceptions and how to practise.",
  focusKeyword: "noon sakinah and tanween rules",
  date: NEW,
  updated: NEW,
  body: `## First, what are noon sakinah and tanween?

- **Noon sakinah** is a noon with a sukoon: نْ. It has no vowel of its own, as in مِنْ.
- **Tanween** is the doubled vowel mark at the end of a noun: ـً ـٍ ـٌ. It is pronounced as a vowel followed by an "n" sound, so it behaves the same way.

The rule is decided by the letter that comes next, whether in the same word or the next one.

## The four rules at a glance

| Rule | Meaning | What you do | Letters |
| --- | --- | --- | --- |
| Izhar | Making clear | Pronounce the noon plainly, with no extra nasal sound | ء ه ع ح غ خ |
| Idgham | Merging | Merge the noon into the next letter | ي ر م ل و ن |
| Iqlab | Changing | Turn the noon into a meem, with a nasal sound | ب |
| Ikhfa | Hiding | Hide the noon between clear and merged, with a nasal sound | The other 15 letters |

## 1. Izhar: the six throat letters

When any of ء ه ع ح غ خ follows, the noon is read clearly and quickly.

- مِنْ خَوْفٍ (Surah Quraysh): the noon is clear before خ.
- أَنْعَمْتَ (Surah Al-Fatihah): the noon is clear before ع.

The reason is distance. The noon comes from the tip of the tongue and these letters from the throat, so each is pronounced separately without effort.

## 2. Idgham: the six letters of يرملون

The noon merges into the next letter, which is then read as if doubled. The six letters are remembered by the word **يَرْمَلُون**.

| Type | Letters | Example |
| --- | --- | --- |
| With a nasal sound (ghunnah), held two counts | ي ن م و | مَن يَعْمَلْ (Surah Az-Zalzalah), read "may-ya'mal" |
| Without a nasal sound | ل ر | مِن رَّبِّهِمْ, read "mir-rabbihim" |

**The exception.** Idgham only happens across two words. When the noon and the following letter are inside one word, the noon is read clearly. There are four such words in the Quran: دُنْيَا, بُنْيَان, قِنْوَان and صِنْوَان.

## 3. Iqlab: one letter

Before ب, the noon turns into a meem, held with a nasal sound for two counts. Most mushafs print a small م above the noon to remind you.

- مِنۢ بَعْدِ, read "mim ba'di".
- سَمِيعٌۢ بَصِيرٌ, read "samee'um baseer".

## 4. Ikhfa: the remaining fifteen letters

The letters are ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك.

The noon is neither clear nor merged. The tongue does not touch the place of the noon. Instead it prepares for the next letter while a nasal sound is held for two counts.

- مِن شَرِّ (Surah Al-Falaq).
- أَنتُمْ.
- مِن قَبْلُ.

The nasal sound takes the colour of the next letter. Before a heavy letter such as ص or ق it sounds heavy. Before a light letter such as ت or س it sounds light.

## A quick way to decide

1. Is the next letter from the throat? **Izhar.**
2. Is it one of يرملون, in the next word? **Idgham.**
3. Is it ب? **Iqlab.**
4. Anything else? **Ikhfa.**

## Common mistakes

- **Adding a nasal sound to izhar.** The noon should be clean and short.
- **Pressing the tongue for ikhfa.** If the tip touches the gum, you have pronounced a full noon.
- **Forgetting the nasal sound in idgham with ي and و.**
- **Holding the nasal sound too long or too briefly.** It is two counts, about the time it takes to say "one, two" at your reading speed.

## Practise in Juz Amma

Take Surah Al-Falaq, An-Nas and Al-Qari'ah. Mark every noon sakinah and tanween in pencil, name the rule for each, then recite to your teacher. Within a few weeks you will apply the rules without stopping to think.

These rules are taught in the second month of our [online Tajweed classes](/courses/online-tajweed-classes). For the full picture, read the [complete guide to Tajweed](/blog/tajweed-guide), and for the lengthening rules see [madd in Tajweed](/blog/madd-rules-in-tajweed).`,
  faqs: [
    { q: "What are the four rules of noon sakinah?", a: "Izhar (clear) before the six throat letters, idgham (merging) before the letters of يرملون, iqlab (changing to meem) before ب, and ikhfa (hiding) before the remaining fifteen letters." },
    { q: "What is the difference between idgham and ikhfa?", a: "In idgham the noon disappears into the next letter, which is read as doubled. In ikhfa the noon is hidden but not merged: a nasal sound is held for two counts before the next letter is pronounced normally." },
    { q: "How long is the ghunnah?", a: "Two counts, measured at the speed you are reciting. It applies in idgham with ghunnah, iqlab, ikhfa, and on any noon or meem with a shaddah." },
  ],
};

const madd: LibraryPost = {
  slug: "madd-rules-in-tajweed",
  kind: "cluster",
  pillar: "tajweed-guide",
  title: "Madd in Tajweed: the types and how long to hold each",
  excerpt: "Natural madd and the longer madds caused by a hamzah or a sukoon, with a length table and an example of each.",
  answer:
    "Madd means lengthening the sound of the letters alif, waw and ya. The natural madd is held for two counts. It becomes longer when a hamzah or a sukoon follows: four or five counts when a hamzah follows, two, four or six when you stop on the word, and always six when a permanent sukoon or shaddah follows.",
  seoTitle: "Madd Rules in Tajweed: Types, Lengths and Examples",
  seoDescription: "The rules of madd in Tajweed: natural, muttasil, munfasil, arid lis-sukoon, leen and lazim, with the counts to hold each and examples from the Quran.",
  focusKeyword: "madd rules in Tajweed",
  date: NEW,
  updated: NEW,
  body: `## The three madd letters

A madd happens on one of three letters when it follows its matching vowel:

- **Alif** after a fatha: قَالَ
- **Waw with sukoon** after a damma: يَقُولُ
- **Ya with sukoon** after a kasra: قِيلَ

The word نُوحِيهَا contains all three.

## What "a count" means

A count is the time of one short vowel at the speed you are reciting. Teachers often show it by closing or opening one finger. The lengths below are relative: at a slow pace every count is slower, but a four-count madd is always twice a two-count madd.

## The natural madd: two counts

When a madd letter is not followed by a hamzah or a sukoon, hold it for exactly two counts, no more and no less. Examples: قَالَ, يَقُولُ, فِي.

Cutting it short is a clear mistake, because it can turn one word into another.

## The longer madds

The lengths given here follow the narration of Hafs from Asim as it is most widely taught.

| Madd | When it happens | Counts | Example |
| --- | --- | --- | --- |
| Muttasil (connected) | A hamzah follows the madd letter in the same word | 4 or 5 | جَآءَ, ٱلسَّمَآءِ |
| Munfasil (separated) | The madd letter ends one word and a hamzah begins the next | 4 or 5 | إِنَّآ أَعْطَيْنَٰكَ (Surah Al-Kawthar) |
| 'Arid lis-sukoon | You stop on a word, so its last letter takes a temporary sukoon after a madd letter | 2, 4 or 6 | ٱلْعَٰلَمِينَ when you stop at the end of the ayah |
| Leen | You stop after a waw or ya with sukoon that follows a fatha | 2, 4 or 6 | قُرَيْشٍ, خَوْفٍ when you stop |
| Lazim (compulsory) | A permanent sukoon or a shaddah follows the madd letter | Always 6 | ٱلضَّآلِّينَ (Surah Al-Fatihah) |

Whichever length you choose for muttasil and munfasil, keep to it for the whole recitation. Do the same for the madd when stopping.

## Smaller madds worth knowing

- **Badal**: a hamzah comes before the madd letter, as in ءَامَنُوا. Two counts.
- **'Iwad**: when you stop on a tanween with fatha, it becomes an alif held for two counts. عَلِيمًا becomes "aleemaa".
- **The opening letters of some surahs**: letters such as the lam and meem of الٓمٓ are held for six counts, which is a form of madd lazim.

## The signs in the mushaf

In most printed copies a wavy line (ٓ) above a letter tells you a longer madd is needed there. If you see it, hold the sound for more than two counts and work out which rule applies from what follows.

## Common mistakes

- **Shortening the natural madd.** The most frequent mistake of all, especially at speed.
- **Adding a madd where there is none**, such as stretching a short vowel at the end of a phrase.
- **Uneven lengths.** Four counts in one ayah and six in the next for the same kind of madd.
- **Running out of breath on a six-count madd.** Take your breath before the word, not in the middle of it.

## How to practise

1. Recite Surah Al-Fatihah slowly, counting each madd on your fingers. It contains natural madds, a madd lazim (ٱلضَّآلِّينَ) and a madd for stopping at the end of every ayah.
2. Mark the madds in one page of Juz Amma and name each one.
3. Recite to a teacher and ask them to check that your lengths are even.

Madd is taught in month four of our [online Tajweed classes](/courses/online-tajweed-classes). See also [noon sakinah and tanween](/blog/noon-sakinah-and-tanween-rules) and the [complete guide to Tajweed](/blog/tajweed-guide).`,
  faqs: [
    { q: "How many types of madd are there?", a: "Two main kinds: the natural madd of two counts, and the secondary madds that are lengthened because a hamzah or a sukoon follows. The secondary madds most learners study are muttasil, munfasil, 'arid lis-sukoon, leen and lazim." },
    { q: "How long is a madd of six counts?", a: "Three times the length of a natural madd at whatever speed you are reciting. It is measured against your own pace, not against a clock." },
    { q: "What is the difference between madd muttasil and munfasil?", a: "In muttasil the madd letter and the hamzah are in the same word, as in جَآءَ. In munfasil the madd letter ends one word and the hamzah starts the next, as in إِنَّآ أَعْطَيْنَٰكَ." },
  ],
};

/* ------------------------------------------------------------------ pillar 3 */
const hifz: LibraryPost = {
  slug: "hifz-guide",
  kind: "pillar",
  title: "Hifz: how to memorise the Quran, a complete guide",
  excerpt: "Who can do Hifz, what must be in place first, the daily method, realistic timelines, how to revise and how parents can help.",
  answer:
    "Hifz is memorising the Quran word for word. It works through a daily routine in three parts: a new portion, the last few days' portions, and a rotating share of everything memorised before. A child studying part-time alongside school usually completes the Quran in three to five years. Revision continues for life.",
  seoTitle: "Hifz: How to Memorise the Quran (Complete Guide)",
  seoDescription: "A complete guide to Hifz: who can do it, what to have in place first, the daily sabaq, sabqi and manzil method, timelines and how parents can help.",
  focusKeyword: "how to memorise the Quran",
  date: NEW,
  updated: NEW,
  body: `## What Hifz is

Hifz means preserving. A hafiz (or hafiza, for a woman) is someone who carries the whole Quran in memory and can recite any part of it without looking. Muslims have memorised the Quran in every generation since it was revealed, and it remains the main way the text is passed on with its exact recitation.

You do not have to memorise all of it for the effort to be worthwhile. Many people set out to memorise the last part (Juz Amma), or a few surahs they love.

## Before you start: three things to have in place

1. **Fluent reading.** The learner should read from the mushaf at a steady pace without spelling words out.
2. **Sound Tajweed.** What is memorised wrongly is very hard to correct later. See the [complete guide to Tajweed](/blog/tajweed-guide).
3. **A daily slot.** Twenty minutes every day will take you further than two hours at the weekend.

If the reading is not ready, fix that first. A good teacher will tell you plainly after listening for a few minutes.

## Choose a goal that fits your life

| Goal | Who it suits | Typical time, part-time |
| --- | --- | --- |
| Selected surahs (Yasin, Al-Mulk, Al-Kahf) | Busy adults | 1 to 3 months each |
| Juz Amma (the 30th part) | Children starting out, and most adults | 4 to 12 months |
| Five parts | Committed learners | 1 to 2 years |
| The whole Quran | Children with daily support at home, and determined adults | 3 to 5 years |

For a worked calculation by lines per day, see [how long it takes to memorise the Quran](/blog/how-long-to-memorize-quran).

## The daily method

Traditional Hifz divides each day into three parts. In South Asia they are called sabaq, sabqi and manzil. Arab teachers describe the same three as new memorisation, recent revision and old revision.

| Part | What it is | Share of the time |
| --- | --- | --- |
| New lesson (sabaq) | The lines memorised today | About a third |
| Recent revision (sabqi) | The lessons of the last five to seven days | About a third |
| Old revision (manzil) | A rotating share of everything earlier | About a third, growing as you progress |

All three are recited to the teacher every day. Skipping revision to move ahead is the most common reason people stall. The method is explained step by step in [sabaq, sabqi and manzil](/blog/sabaq-sabqi-manzil).

## How to memorise a new portion

1. **Read it to your teacher first**, looking at the page, so that you memorise it correctly.
2. **Understand the gist.** Even a simple translation makes the words easier to hold.
3. **Take one line.** Read it ten times looking, then recite it without looking until it is smooth.
4. **Add the next line** and join the two.
5. **Recite the whole portion** from memory several times before sleeping.
6. **Recite it again** first thing in the morning, then to your teacher.

Use one mushaf, always the same print. The position of an ayah on the page becomes part of the memory.

## Keeping what you have memorised

The Prophet, peace be upon him, told his companions to keep returning to the Quran, and compared it to a tied camel that slips away if its owner does not check on it. This is reported by al-Bukhari and Muslim. Forgetting is normal and the cure is a fixed routine. See [how to revise the Quran so you do not forget it](/blog/how-to-revise-quran).

## Hifz alongside school

Most children who memorise today do it part-time. A pattern that works:

- One class of 30 to 45 minutes, five days a week.
- 30 to 45 minutes of practice at home, split between early morning and evening.
- A lighter load during exams and a heavier one in the holidays.
- A day or two each week for revision only.

A plan that ignores school does not last. Set the daily amount with the teacher and adjust it every month.

## A sample day for a school-age child

| When | What | Minutes |
| --- | --- | --- |
| After Fajr, or before school | Memorise today's new lines | 15 to 20 |
| After school | Class: recite the new lesson, the recent lessons and the old revision to the teacher | 30 to 45 |
| Before bed | Recite today's lines five times, then read tomorrow's lines once, looking at the page | 10 |

Keep one day a week with no new lesson at all, only revision.

## Signs that it is time to slow down

- Yesterday's lesson is shaky today.
- Mistakes are appearing in parts that were memorised months ago.
- Revision is being cut short to make room for the new lesson.
- The child has started to dread the class.

When you see two of these, stop new lessons for a week or two and revise only. Then restart with a smaller daily amount. Slowing down at the right moment is how people finish. Pushing on is how they stall.

## Four mistakes that undo Hifz

- **Memorising from audio alone.** Recite to a teacher first, so that what you memorise is correct.
- **Switching between mushafs.** A different print moves every ayah on the page.
- **Reciting only in your head.** Memorise and revise aloud.
- **Stopping completely in the holidays.** If the new lessons pause, the revision must not.

## What parents can do

- **Listen daily**, even for five minutes. You do not need to be a hafiz. Follow in the mushaf and stop your child when the words differ.
- **Protect the time slot** the way you protect school.
- **Praise consistency**, not speed.
- **Never compare** one child with another.
- **Keep in touch with the teacher** and read the monthly report.

## Adults can memorise too

Adults need more repetitions for each line, and they are better at keeping a routine. Start with a small, clear goal such as Juz Amma, attach it to something you already do every day, such as after Fajr, and recite what you learn in your prayers.

## Learning with a teacher

Our [online Hifz classes](/courses/online-hifz-classes) are 1-on-1, five days a week, with a written plan and a target date that is reviewed every month. Parents see each day's lesson and attendance in their dashboard. Book [${t} free trial classes](/free-trial) and the teacher will assess the learner's reading first.`,
  faqs: [
    { q: "What is the best age to start Hifz?", a: "Whenever the reading is fluent and correct, which for most children is between 7 and 10. Starting before that means memorising mistakes. Adults can begin at any age." },
    { q: "How many pages a day should I memorise?", a: "Start with three to five lines and increase only when revision stays strong. Half a page a day, five days a week, completes the Quran in about five years." },
    { q: "Can I do Hifz online?", a: "Yes. Hifz depends on reciting to a teacher every day, and a 1-on-1 video class does that well. Many learners find daily attendance easier online because there is no travel." },
  ],
};

const sabaq: LibraryPost = {
  slug: "sabaq-sabqi-manzil",
  kind: "cluster",
  pillar: "hifz-guide",
  title: "Sabaq, sabqi and manzil: the Hifz revision method explained",
  excerpt: "The three parts of a hafiz's day, how much to do in each, a sample timetable and what to do when revision starts slipping.",
  answer:
    "Sabaq is the new portion memorised today. Sabqi is the recent portion, usually the last five to seven lessons. Manzil is a rotating share of everything memorised earlier. A Hifz student recites all three to the teacher every day, which is what stops new memorisation from pushing out the old.",
  seoTitle: "Sabaq, Sabqi and Manzil: Hifz Method Explained",
  seoDescription: "What sabaq, sabqi and manzil mean in Hifz, how much to recite in each, a sample daily timetable for children and adults, and how to fix weak revision.",
  focusKeyword: "sabaq sabqi manzil",
  date: NEW,
  updated: NEW,
  body: `## The three parts

| Part | Also called | What it is | Why it exists |
| --- | --- | --- | --- |
| Sabaq | New lesson | The lines memorised since yesterday | To move forward |
| Sabqi | Recent revision | The last five to seven lessons | New memorisation is fragile. Repeating it daily for a week makes it firm |
| Manzil | Old revision | A fixed share of everything memorised before that | So the first part stays as strong as the latest |

The words come from the Urdu and Persian tradition of teaching. Arab teachers use different names for the same three parts.

## How much in each

There is no single rule, but these amounts are typical for a part-time student.

| Stage | Sabaq | Sabqi | Manzil |
| --- | --- | --- | --- |
| First juz | 3 to 5 lines | Everything so far | None yet |
| 2 to 5 juz memorised | 5 to 8 lines | The last 5 to 7 lessons | Half a juz a day |
| 5 to 15 juz | Half a page to a page | The last 5 to 7 lessons | One juz a day |
| 15 juz and more | A page | The last 5 to 7 lessons | One to two juz a day |

Notice how manzil grows. By the second half of the Quran, most of each day is revision. That is how it should be.

## A sample day for a child in school

| Time | What |
| --- | --- |
| Before school, 15 minutes | Recite yesterday's sabaq twice, then start today's lines |
| After school, 20 minutes | Finish memorising today's sabaq |
| Class, 30 to 45 minutes | Recite sabaq, then sabqi, then manzil to the teacher |
| Before bed, 10 minutes | Recite today's sabaq once more and read tomorrow's lines |

## A sample day for a working adult

- **After Fajr, 20 minutes:** new lines.
- **Commute or lunch, 15 minutes:** listen to and recite the sabqi.
- **Evening class, 30 minutes:** recite all three to the teacher.
- **In your prayers:** recite from your manzil.

## The order in class

Teachers differ, but most hear the sabaq first while the student is fresh, then the sabqi, then the manzil. The teacher marks each mistake on a sheet: a slip the student corrects alone, a prompt from the teacher, or a place where the student stops completely. A lesson with too many prompts is repeated the next day and no new lesson is given.

## When revision starts slipping

Signs: more prompts in the manzil, ayahs from similar passages getting mixed up, the student avoiding old parts.

What to do:

1. **Stop new lessons for a week.** This is not a failure. Every hafiz does it.
2. **Halve the sabaq** when you restart.
3. **Recite the weak part to someone every day** until it passes without prompts.
4. **Mark the look-alike ayahs** in pencil and learn what is different in each.

## After finishing

Completing the Quran is the beginning of revision, not the end of it. Most huffaz keep a manzil for life, commonly one juz a day, which takes them through the whole Quran every month. See [how to revise the Quran so you do not forget it](/blog/how-to-revise-quran).

Our [online Hifz classes](/courses/online-hifz-classes) follow this method, with each day's sabaq, sabqi and manzil recorded where parents can see it. For the full picture, read the [complete guide to Hifz](/blog/hifz-guide).`,
  faqs: [
    { q: "What does manzil mean in Hifz?", a: "Manzil is the old revision: a fixed portion of everything memorised earlier, recited every day in rotation so that no part is left untouched for long." },
    { q: "How much manzil should I recite a day?", a: "It depends how much you have memorised. Half a juz a day is common up to five juz, one juz a day up to fifteen, and one to two juz a day after that." },
    { q: "What if I do not have time for all three every day?", a: "Reduce the new lesson before you reduce revision. New memorisation without revision is lost within weeks, while revision without new memorisation loses nothing." },
  ],
};

const revise: LibraryPost = {
  slug: "how-to-revise-quran",
  kind: "cluster",
  pillar: "hifz-guide",
  title: "How to revise the Quran so you do not forget it",
  excerpt: "A revision plan for people who are memorising now, and a way back for those who memorised years ago and have forgotten.",
  answer:
    "Revise on a fixed rotation, not when you feel like it. Recite a set portion of what you have memorised every day so that you pass through all of it regularly, recite it aloud to another person at least once a week, and use it in your prayers. Forgetting is almost always a problem of routine, not of memory.",
  seoTitle: "How to Revise the Quran and Not Forget It",
  seoDescription: "A practical Quran revision plan: daily rotations by amount memorised, reciting in prayer, look-alike ayahs, and how to bring back Hifz you have forgotten.",
  focusKeyword: "how to revise Quran",
  date: NEW,
  updated: NEW,
  body: `## Why memorised Quran fades

Anything memorised weakens unless it is recalled. The Prophet, peace be upon him, warned his companions about this, telling them to keep returning to the Quran because it slips away faster than a camel from its rope. This is reported by al-Bukhari and Muslim.

So forgetting is not a sign of a weak memory or of failure. It is what happens to everyone who stops revising, and it is reversed by revising.

## The principle: a fixed rotation

Decide how many days it will take you to pass through everything you know, divide it up, and recite that share every day whether you feel like it or not.

| You have memorised | Daily revision | You complete a round every |
| --- | --- | --- |
| Juz Amma only | A quarter of the juz | 4 days |
| 1 to 3 juz | Half a juz | 2 to 6 days |
| 5 juz | Half a juz to one juz | 5 to 10 days |
| 10 juz | One juz | 10 days |
| 15 to 20 juz | One and a half to two juz | 10 days |
| The whole Quran | One to three juz | 10 to 30 days |

Many huffaz settle on one juz a day for life, which completes the Quran every month.

## Six habits that keep it

1. **Recite aloud.** Reading with the eyes is not revision. The tongue has to do the work.
2. **Recite from memory, then check.** Open the mushaf only where you stop or doubt.
3. **Recite to a person** at least once a week: a teacher, a spouse, a friend who is also memorising.
4. **Use it in your prayers.** Reciting your revision portion in the night prayer or the sunnah prayers is the oldest method there is.
5. **Listen** to the portion you are revising, at a moderate speed, while travelling.
6. **Keep the same mushaf.** The picture of the page is half the memory.

## Dealing with look-alike ayahs

Passages that resemble each other are where strong students stumble. They are called mutashabihat.

- Mark each pair in pencil when you meet it.
- Say out loud what is different: one word, one ending, the order.
- Tie each version to its surah and what the passage is about.
- Recite the two one after the other until you can switch between them.

## If you have already forgotten

Many adults memorised as children and feel ashamed of what they have lost. It comes back faster than it went in, because the memory is weakened rather than gone.

1. **Find out where you stand.** Recite to a teacher for a few sessions and sort each juz into strong, weak or lost.
2. **Start with the strong parts** and put them on a daily rotation at once. This stops further loss.
3. **Take one weak juz at a time.** Treat a quarter of it as a new lesson each day.
4. **Do not memorise anything new** until the old is back on rotation.
5. **Tell someone**, and recite to them. Accountability does what willpower cannot.

How long it takes depends on how much is left and how much you can do each day. A teacher can give you an estimate after listening for a few sessions.

## A weekly plan that works

| Day | Plan |
| --- | --- |
| Monday to Friday | Daily rotation portion, recited aloud, part of it in prayer |
| Saturday | Recite the week's weakest portion to a teacher or partner |
| Sunday | Catch up anything missed, and prepare next week's portions |

## Get a listener

The single most useful step is to recite regularly to someone who will stop you when you slip. Our [online Hifz classes](/courses/online-hifz-classes) include revision-only plans for people who have finished or who are bringing their memorisation back. See also [sabaq, sabqi and manzil](/blog/sabaq-sabqi-manzil) and the [complete guide to Hifz](/blog/hifz-guide).`,
  faqs: [
    { q: "How often should a hafiz revise the Quran?", a: "Every day. Most huffaz recite between one and three juz a day, which completes the whole Quran every ten to thirty days." },
    { q: "Can I get my Hifz back after years of not revising?", a: "Yes. Memorisation that has faded returns faster than it was first learned. Put the parts you still know on a daily rotation first, then rebuild the weak parts one at a time with a teacher." },
    { q: "Is it enough to revise by listening?", a: "No. Listening helps, but revision means reciting aloud from memory and being corrected. Use listening as a support alongside your own recitation." },
  ],
};

/* ------------------------------------------------------------------ the six earlier articles, now filed under their pillars */
const pillarOf: Record<string, string> = {
  "online-quran-classes-cost": "learn-quran-online",
  "what-is-noorani-qaida": "learn-quran-online",
  "best-age-to-start-quran-classes": "learn-quran-online",
  "how-to-choose-online-quran-teacher": "learn-quran-online",
  "tajweed-rules-for-beginners": "tajweed-guide",
  "how-long-to-memorize-quran": "hifz-guide",
};
const keywordOf: Record<string, string> = {
  "online-quran-classes-cost": "online Quran classes cost",
  "what-is-noorani-qaida": "Noorani Qaida",
  "best-age-to-start-quran-classes": "best age to start Quran classes",
  "how-to-choose-online-quran-teacher": "online Quran teacher",
  "tajweed-rules-for-beginners": "Tajweed rules for beginners",
  "how-long-to-memorize-quran": "how long to memorize the Quran",
};
const labelFor = (path: string): string => {
  if (path === "/pricing") return "Fees for online Quran classes";
  if (path === "/free-trial") return `Book ${t} free trial classes`;
  if (path.startsWith("/courses/")) return courses.find((c) => `/courses/${c.slug}` === path)?.h1 ?? path;
  if (path.startsWith("/blog/")) return articles.find((x) => `/blog/${x.slug}` === path)?.title ?? path;
  return landings.find((l) => `/${l.slug}` === path)?.h1 ?? path;
};

const earlier: LibraryPost[] = articles.map((p) => ({
  slug: p.slug,
  kind: pillarOf[p.slug] ? "cluster" : "article",
  pillar: pillarOf[p.slug],
  title: p.title,
  excerpt: p.description,
  answer: p.answer,
  body: `${blocksToMd(p.blocks)}\n\n## Read next\n\n${p.related.map((r) => `- [${labelFor(r)}](${r})`).join("\n")}`,
  faqs: p.faqs,
  seoTitle: p.metaTitle,
  seoDescription: p.description,
  focusKeyword: keywordOf[p.slug] ?? "",
  date: p.date,
  updated: p.updated,
}));

export const library: LibraryPost[] = [learnOnline, vsMadrasah, newMuslim, tajweed, makharij, noonRules, madd, hifz, sabaq, revise, ...earlier];
