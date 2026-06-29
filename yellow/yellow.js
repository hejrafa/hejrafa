const body = document.body;
const dock = document.querySelector(".yellow-dock");
const dockItems = document.querySelectorAll("[data-yellow-nav]");
const panels = document.querySelectorAll("[data-yellow-page]");
const passwordInput = document.querySelector("[data-yellow-password]");
const gateForm = document.querySelector("[data-yellow-gate]");
const viewTransitionDuration = 460;
const validViews = new Set(["health", "finance", "finance-yearly", "finance-debt", "letter"]);
const routePaths = new Map([
  ["/yellow", "health"],
  ["/yellow/index.html", "health"],
  ["/yellow/health", "health"],
  ["/yellow/health/index.html", "health"],
  ["/yellow/finance", "finance"],
  ["/yellow/finance/index.html", "finance"],
  ["/yellow/finance-yearly", "finance-yearly"],
  ["/yellow/finance-yearly/index.html", "finance-yearly"],
  ["/yellow/finance-debt", "finance-debt"],
  ["/yellow/finance-debt/index.html", "finance-debt"],
  ["/yellow/letter", "letter"],
  ["/yellow/letter/index.html", "letter"],
]);
const unlockStorageKey = "hejrafa-yellow-unlocked";
const healthStorageKey = "hejrafa-yellow-health-v1";
const healthModeStorageKey = "hejrafa-yellow-health-mode-v1";
const healthTitleStorageKey = "hejrafa-yellow-health-title-v1";
const letterStorageKey = "hejrafa-yellow-letter-v2";
const html2PdfUrl = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
let html2PdfLoader = null;
const validHealthModes = new Set(["track", "cook", "train"]);
const healthTitleOptions = [
  ["Two months.", "All in."],
  ["Build strength.", "Stay human."],
  ["Fuel ready.", "Train clean."],
  ["Small reps.", "Real change."],
  ["Show up.", "Recover well."],
  ["Eat enough.", "Get stronger."],
  ["Clean reps.", "Quiet proof."],
  ["Future Rafa.", "Earned daily."],
  ["Track light.", "Move hard."],
  ["Health.", "No noise."],
];
const letterDrafts = [
  {
    greeting: "Dear future favorite person,",
    "paragraph-1": "I hope this letter finds you well, hydrated, and only mildly surrounded by tabs you swear you still need. I am writing to share a thought, make a request, or simply put something important on a page before my brain turns it into seventeen separate notes.",
    "paragraph-2": "The short version is this: there is an idea here, and it deserves a little room to breathe. The slightly longer version has nuance, context, and at least one sentence that makes me sound more organized than I felt while writing it.",
    "paragraph-3": "I care about clarity, good timing, and the rare miracle of everyone knowing what happens next. If this page can help move things from vague cloud shape to actual next step, then frankly, it has already earned its keep.",
    portfolio: "Optional useful detail goes here: a link, a date, a number, or the tiny but crucial thing nobody should miss.",
    salary: "Another note can live here, provided it behaves itself and does not become a spreadsheet in disguise.",
    closing: "Thank you for reading. I am looking forward to the next step, ideally one involving fewer open loops and maybe a decent coffee.",
    signoff: "Warmly",
  },
  {
    greeting: "Hello from the page with margins,",
    "paragraph-1": "This is a small note with decent posture and no ambition to become a slide deck. I wanted to put the important bit somewhere quiet, where it can sit still long enough for both of us to look at it.",
    "paragraph-2": "The point is simple: something deserves attention, a decision, or at least a friendly nudge out of the swamp of later. I have tried to keep it concise, which is brave considering my natural habitat is the thoughtful tangent.",
    "paragraph-3": "If this lands well, wonderful. If it needs a tweak, also wonderful. Progress is often just a fancy word for moving the furniture until nobody walks into it anymore.",
    portfolio: "Useful detail: add a date, link, number, address, or tiny clue that makes the whole thing easier to act on.",
    salary: "Optional note: this line is available for context, constraints, or one suspiciously practical sentence.",
    closing: "Thanks for reading this without making it a meeting first. That already feels like civilization.",
    signoff: "Best",
  },
  {
    greeting: "Dear person with excellent timing,",
    "paragraph-1": "I am writing because some thoughts are better behaved on paper. Left unattended, this one would probably start rearranging my brain furniture at 11:47 p.m., and nobody needs that.",
    "paragraph-2": "Here is the shape of it: there is a thing worth doing, saying, changing, asking, or finally admitting is not going to magically organize itself. I am in favor of giving it a real next step.",
    "paragraph-3": "I like when things are clear, useful, and just dramatic enough to stay interesting. This letter is attempting all three while wearing sensible shoes.",
    portfolio: "Small but important detail: place the practical bit here before it escapes.",
    salary: "Second optional detail: add whatever makes this easier to understand, approve, schedule, or remember.",
    closing: "Thank you for giving this a proper read. I appreciate attention in a world determined to turn everything into a notification.",
    signoff: "Cheers",
  },
  {
    greeting: "Hi there,",
    "paragraph-1": "Consider this a neatly dressed carrier pigeon, except without the pigeon and with better typography. I am sending it because the message deserves more ceremony than a chat bubble, but less ceremony than a committee.",
    "paragraph-2": "What matters is fairly straightforward: there is a direction, a question, or a little decision waiting to become real. I have put it here so it can stop floating around like a browser tab with emotional leverage.",
    "paragraph-3": "If the next move is obvious, fantastic. If it is not, we can make it obvious with a little patience, a little taste, and maybe one brutally honest sentence.",
    portfolio: "Relevant detail: add the link, deadline, amount, name, or tiny logistical gem here.",
    salary: "Optional context: this space exists for the thing that would otherwise be remembered five minutes too late.",
    closing: "Thanks for reading. May the next step be clear and the calendar invite mercifully short.",
    signoff: "Kindly",
  },
  {
    greeting: "Dear sensible human,",
    "paragraph-1": "I am putting this in letter form because it makes the idea look like it pays rent. There is something pleasantly official about a white page, even when the message is mostly: let us make this easier.",
    "paragraph-2": "The practical version is this: we have enough information to move, or enough uncertainty to ask a better question. Either way, the next step does not need to be heroic. It just needs to exist.",
    "paragraph-3": "I am a big believer in clear edges, useful defaults, and removing the little frictions that make everyone silently tired. This letter is, hopefully, one small act in that direction.",
    portfolio: "Helpful detail: this is where the specific thing goes, ideally before anyone has to hunt for it.",
    salary: "Optional note: constraints, preferences, and tiny caveats may live here peacefully.",
    closing: "Thank you for reading and for not turning this into a twelve-tab investigation unless absolutely necessary.",
    signoff: "All the best",
  },
  {
    greeting: "Dear keeper of the time circuits,",
    "paragraph-1": "I am writing from a very specific point in the timeline: after the idea became obvious, but before anyone accidentally made it complicated. The dashboard is blinking, the coffee is questionable, and the next step is asking for a little courage.",
    "paragraph-2": "We may not need roads, but we do need a destination. Ideally one with fewer paradoxes, a working plan, and no dramatic sprint toward a clock tower unless absolutely necessary.",
    "paragraph-3": "So here is the pitch: let us set the coordinates, hit the right speed, and give this thing enough energy to become real. If a little lightning shows up, great. If not, we can probably use a calendar invite.",
    portfolio: "Timeline detail: add the date, link, number, or tiny piece of future-saving information here.",
    salary: "Optional note: constraints, caveats, and suspiciously important side quests may live here.",
    closing: "Thanks for reading. May the next version of this moment be the one where everything clicks.",
    signoff: "See you in the future",
  },
];
const healthProfileFields = [
  { id: "height", label: "Height", placeholder: "cm", inputmode: "decimal", type: "text" },
  { id: "age", label: "Age", placeholder: "years", inputmode: "numeric", type: "text" },
];
const healthProfileSexOptions = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
];
const healthProfileActivityOptions = [
  { id: "sedentary", label: "Sedentary", factor: 1.2, hint: "desk + little movement" },
  { id: "light", label: "Light", factor: 1.375, hint: "1-3 light sessions/wk" },
  { id: "moderate", label: "Moderate", factor: 1.55, hint: "3-5 real sessions/wk" },
  { id: "heavy", label: "Heavy", factor: 1.725, hint: "6+ sessions or physical job" },
];
const healthProfileGoalFields = [
  { id: "goalWeight", label: "Goal weight", placeholder: "kg" },
  { id: "goalBodyFat", label: "Goal body fat", placeholder: "%" },
];
const healthXaryuReference = {
  height: 180,
  weight: 80,
  bodyFat: 10,
};
const healthMeasurementCheckpoints = [
  { id: "start", label: "Start", date: "Jun 29" },
  { id: "week4", label: "W4", date: "Jul 20" },
  { id: "week8", label: "W8", date: "Aug 17" },
];
const healthMeasurementMetrics = [
  { id: "weight", label: "Weight", hint: "weekly average", placeholder: "kg" },
  { id: "bodyFat", label: "Body fat", hint: "same method", placeholder: "%" },
  { id: "waist", label: "Waist", hint: "navel, relaxed", placeholder: "cm" },
  { id: "chest", label: "Chest", hint: "nipple line", placeholder: "cm" },
  { id: "shoulders", label: "Shoulders", hint: "widest point", placeholder: "cm" },
  { id: "hips", label: "Hips", hint: "widest point", placeholder: "cm" },
  { id: "arm", label: "Arm", hint: "same side, relaxed", placeholder: "cm" },
  { id: "thigh", label: "Thigh", hint: "mid-thigh", placeholder: "cm" },
];
const healthPhotoAngles = [
  { id: "front", label: "Front" },
  { id: "side", label: "Side" },
  { id: "back", label: "Back" },
];
const healthWarmupItems = [
  {
    title: "Dead hang",
    detail: "1 min",
    image: "/assets/images/health/warmup-dead-hang.jpg",
    alt: "Dead hang warm-up from the bodyweight program",
  },
  {
    title: "Deep squat",
    detail: "1 min",
    image: "/assets/images/health/warmup-deep-squat.jpg",
    alt: "Deep squat warm-up from the bodyweight program",
  },
  {
    title: "Leg swings",
    detail: "10 each leg",
    image: "/assets/images/health/warmup-leg-swings.jpg",
    alt: "Leg swings warm-up from the bodyweight program",
  },
  {
    title: "Arm swings",
    detail: "10 each arm",
    image: "/assets/images/health/warmup-arm-swings.jpg",
    alt: "Arm swings warm-up from the bodyweight program",
  },
];
const healthWorkoutDays = [
  {
    id: "mon",
    day: "Mon",
    title: "Upper I",
    description: "Pull-ups, push-ups, bodyweight rows, ring chest fly, ring back fly.",
    image: "/assets/images/health/program-upper-1.jpg",
    imageAlt: "Upper I pull-up photo from the bodyweight program",
    items: [
      { label: "Pull-ups", tooltip: "Pull yourself up until your chin clears the bar. Use assistance if needed." },
      { label: "Push-ups", tooltip: "Lower your chest, then press back up. Keep your body straight." },
      { label: "Rows", tooltip: "Lean back holding rings or a bar, then pull your chest toward your hands." },
      { label: "Chest fly", tooltip: "Open your arms slowly on rings, then squeeze them back together." },
      { label: "Back fly", tooltip: "Open your arms out to the side to work your upper back." },
    ],
    explanation: "Strength day for vertical pull, horizontal pull, and horizontal push. Keep the big moves in the 5-12 clean-rep range, then use the fly work for control and upper-back balance.",
  },
  {
    id: "tue",
    day: "Tue",
    title: "Mobility",
    description: "Active stretching, dynamic stretching, intuitive movement.",
    image: "/assets/images/health/program-mobility.jpg",
    imageAlt: "Mobility photo from the bodyweight program",
    items: [
      { label: "Active stretching", tooltip: "Move into a stretch using your own strength." },
      { label: "Dynamic work", tooltip: "Move joints through range: hips, shoulders, ankles, spine." },
      { label: "Intuitive movement", tooltip: "Spend time on what feels tight or stiff that day." },
    ],
    explanation: "A recovery and range day. Move joints through active control, add dynamic stretches, then spend time in positions that feel stiff without forcing them.",
  },
  {
    id: "wed",
    day: "Wed",
    title: "Lower",
    description: "Pistols, hinge or nordics, split squats, hips, calves, toe raises.",
    image: "/assets/images/health/program-lower.jpg",
    imageAlt: "Lower-body mobility photo from the bodyweight program",
    items: [
      { label: "Pistols", tooltip: "Single-leg squat. Use a box, wall, or support if needed." },
      { label: "Hinge/Nordics", tooltip: "Hamstring work. Bend at the hips or lower slowly from your knees." },
      { label: "Split squats", tooltip: "One foot forward, one foot back. Lower down and stand up." },
      { label: "Hip thrusts", tooltip: "Drive your hips up and squeeze your glutes at the top." },
      { label: "Calves", tooltip: "Raise your heels slowly, pause, then lower with control." },
      { label: "Toe raises", tooltip: "Lift your toes toward your shins to train the front of your lower leg." },
    ],
    explanation: "Single-leg strength plus posterior-chain work. Track the main leg movement, keep the hinge strict, and use calves and toe raises to round out lower-leg durability.",
  },
  {
    id: "thu",
    day: "Thu",
    title: "Core",
    description: "Hanging leg raises, L-sits, oblique raises, hollow body holds.",
    image: "/assets/images/health/program-core.jpg",
    imageAlt: "Core hanging leg raise photo from the bodyweight program",
    items: [
      { label: "Hanging raises", tooltip: "Hang and lift your knees or legs without swinging." },
      { label: "L-sits", tooltip: "Hold yourself up with your legs forward. Tuck your knees if needed." },
      { label: "Oblique raises", tooltip: "Hang and lift your knees toward each side." },
      { label: "Hollow holds", tooltip: "Lie on your back, ribs down, arms and legs long." },
    ],
    explanation: "Body-control day for compression, bracing, and anti-extension. Regress if the low back or shoulders take over before the abs do.",
  },
  {
    id: "fri",
    day: "Fri",
    title: "Upper II",
    description: "Pike or HSPU, dips, curls, triceps, face pulls.",
    image: "/assets/images/health/program-upper-2.jpg",
    imageAlt: "Upper II dips photo from the bodyweight program",
    items: [
      { label: "Pike/HSPU", tooltip: "Push like an overhead press. Start with pike push-ups if handstand work is too hard." },
      { label: "Dips", tooltip: "Lower between bars or rings, then press back up." },
      { label: "Curls", tooltip: "Pull your hands toward your face or body to train biceps." },
      { label: "Triceps", tooltip: "Bend and straighten your elbows to train the back of your arms." },
      { label: "Face pulls", tooltip: "Pull rings or a band toward your face with elbows high." },
    ],
    explanation: "Vertical push, dips, arms, and shoulder health. Progress the hardest push first, then use curls, triceps, and face pulls to build volume without wrecking form.",
  },
  {
    id: "sat",
    day: "Sat",
    title: "Skill work",
    description: "Skills, mobility, core, outside work, sport, or play.",
    image: "/assets/images/health/program-modular.jpg",
    imageAlt: "Skill day movement photo from the bodyweight program",
    items: [
      { label: "Skills", tooltip: "Practice handstands, rings, L-sit, or another skill slowly." },
      { label: "Mobility", tooltip: "Do extra easy stretching or range work." },
      { label: "Core", tooltip: "Add a little ab work if you feel fresh." },
      { label: "Outside", tooltip: "Walk, run, play a sport, or just move outside." },
    ],
    explanation: "Flexible slot. Pick the thing that helps most this week: skill practice, extra mobility, easy cardio, core, or something playful outside.",
  },
  {
    id: "sun",
    day: "Sun",
    title: "Active rest",
    description: "Walk, yoga, mobility, de-stress, reset.",
    items: [
      { label: "Walk", tooltip: "Easy walk. Keep it relaxed." },
      { label: "Yoga", tooltip: "Gentle yoga or mobility." },
      { label: "De-stress", tooltip: "Do the recovery basics: sleep, food, water, calm." },
      { label: "Reset", tooltip: "Look at the week and make Monday easy." },
    ],
    explanation: "Recovery that still moves blood. Keep it easy enough that Monday feels better, not like you snuck in another hard workout.",
  },
];
const healthWeeks = [
  { id: "week1", label: "Week 1", dates: "Jun 29-Jul 5", focus: "Baseline and form" },
  { id: "week2", label: "Week 2", dates: "Jul 6-Jul 12", focus: "Add one clean rep" },
  { id: "week3", label: "Week 3", dates: "Jul 13-Jul 19", focus: "Tempo or harder variation" },
  { id: "week4", label: "Week 4", dates: "Jul 20-Jul 26", focus: "Form check + midpoint photos" },
  { id: "week5", label: "Week 5", dates: "Jul 27-Aug 2", focus: "Level up one movement" },
  { id: "week6", label: "Week 6", dates: "Aug 3-Aug 9", focus: "Hold intensity, own the reps" },
  { id: "week7", label: "Week 7", dates: "Aug 10-Aug 16", focus: "Push clean top sets" },
  { id: "week8", label: "Week 8", dates: "Aug 17-Aug 23", focus: "Retest + compare" },
];
const healthMealLabels = ["Breakfast", "Lunch", "Dinner"];
const healthRecipes = {
  goToBreakfast: {
    name: "Go-to breakfast",
    calories: 640,
    protein: 54,
    image: "/assets/images/health/food-breakfast-classic.jpg",
    detail: "2 toasts, eggs, turkey, avocado, cottage cheese, espresso, fresh lime shot.",
    cook: [
      "Toast the bread and cook the eggs how you like them.",
      "Add turkey slices, avocado, and a couple scoops of cottage cheese to the plate.",
      "Make espresso and squeeze one lime shot fresh.",
    ],
    source: "Your default",
    shopping: [
      { group: "Breakfast", item: "Toast bread", amount: 2, unit: "slices" },
      { group: "Breakfast", item: "Eggs", amount: 3, unit: "pcs" },
      { group: "Breakfast", item: "Turkey slices", amount: 3, unit: "slices" },
      { group: "Dairy", item: "Cottage cheese", amount: 120, unit: "g" },
      { group: "Produce", item: "Avocados", amount: 0.5, unit: "pcs" },
      { group: "Produce", item: "Limes", amount: 1, unit: "pcs" },
      { group: "Pantry", item: "Espresso coffee", amount: 1, unit: "servings" },
    ],
  },
  stirFry: {
    name: "The Stir Fry",
    calories: 1192,
    protein: 90,
    image: "/assets/images/health/food-stir-fry.jpg",
    detail: "Chicken, jasmine rice, broccoli, carrots, mushrooms, sprouts.",
    cook: [
      "Cook rice first so it is ready.",
      "Cut chicken small, salt it, then sear until browned and cooked through.",
      "Stir-fry the vegetables fast, add soy sauce, then plate with sesame and green onion.",
    ],
    prep: "Dice chicken, salt it, and sear in a hot pan until browned and cooked through. Cool in shallow boxes, then refrigerate. Keep soy, sesame, cashews, sprouts, and green onion separate until eating.",
    prepCook: "Dice chicken, salt it, then sear until cooked. Stir-fry broccoli, carrots, and mushrooms.",
    prepLater: "Soy, sesame, cashews, sprouts, green onion.",
    source: "Cookbook p. 9",
    shopping: [
      { group: "Proteins", item: "Chicken breast", amount: 340, unit: "g" },
      { group: "Carbs", item: "Jasmine rice", amount: 90, unit: "g" },
      { group: "Produce", item: "Broccoli", amount: 300, unit: "g" },
      { group: "Produce", item: "Carrots", amount: 3, unit: "pcs" },
      { group: "Produce", item: "Mushrooms", amount: 150, unit: "g" },
      { group: "Produce", item: "Mung bean sprouts", amount: 100, unit: "g" },
      { group: "Produce", item: "Green onion", amount: 1, unit: "bunches" },
      { group: "Pantry", item: "Cashews", amount: 25, unit: "g" },
      { group: "Pantry", item: "Soy sauce", amount: 1, unit: "bottles", pantry: true },
      { group: "Pantry", item: "Sesame seeds", amount: 1, unit: "packs", pantry: true },
    ],
  },
  allAmerican: {
    name: "All American",
    calories: 1079,
    protein: 88,
    image: "/assets/images/health/food-all-american.jpg",
    detail: "Sirloin, russet potato, asparagus, butter, parmesan.",
    cook: [
      "Bake or microwave the potato until soft.",
      "Salt steak, sear both sides hard, then rest it for a few minutes.",
      "Saute asparagus and finish the plate with butter and parmesan.",
    ],
    source: "Cookbook p. 10",
    shopping: [
      { group: "Proteins", item: "Sirloin or steak", amount: 340, unit: "g" },
      { group: "Carbs", item: "Russet potatoes", amount: 1, unit: "pcs" },
      { group: "Produce", item: "Asparagus", amount: 1, unit: "bunches" },
      { group: "Dairy", item: "Butter", amount: 10, unit: "g" },
      { group: "Dairy", item: "Parmesan", amount: 25, unit: "g" },
    ],
  },
  salmonGuac: {
    name: "Salmon + Guac",
    calories: 1047,
    protein: 85,
    image: "/assets/images/health/food-salmon-guac.jpg",
    detail: "Salmon, sweet potato, avocado, cilantro, lime.",
    cook: [
      "Bake the sweet potato until soft.",
      "Salt salmon, then bake or pan-sear until it flakes.",
      "Mash avocado with cilantro, lime, and salt for quick guac.",
    ],
    source: "Cookbook p. 11",
    shopping: [
      { group: "Proteins", item: "Salmon", amount: 340, unit: "g" },
      { group: "Carbs", item: "Sweet potatoes", amount: 1, unit: "pcs" },
      { group: "Produce", item: "Avocados", amount: 0.5, unit: "pcs" },
      { group: "Produce", item: "Cilantro", amount: 1, unit: "bunches" },
      { group: "Produce", item: "Limes", amount: 1, unit: "pcs" },
    ],
  },
  pollos: {
    name: "Los Pollos",
    calories: 826,
    protein: 86,
    image: "/assets/images/health/food-pollos.jpg",
    detail: "Chicken tacos with black beans, peppers, onion, salsa.",
    cook: [
      "Season chicken with lime, salt, and hot sauce.",
      "Sear chicken, then saute peppers and onion in the same pan.",
      "Warm tortillas and build tacos with beans and salsa.",
    ],
    prep: "Season chicken with lime, salt, and hot sauce. Sear it, then saute peppers and onion in the same pan. Cool chicken and peppers in shallow boxes. Store tortillas, beans, salsa, and lime separate.",
    prepCook: "Season chicken with lime, salt, and hot sauce. Sear it, then saute peppers and onion in the same pan.",
    prepLater: "Tortillas, beans, salsa, lime.",
    source: "Cookbook p. 12",
    shopping: [
      { group: "Proteins", item: "Chicken breast", amount: 340, unit: "g" },
      { group: "Carbs", item: "Corn tortillas", amount: 3, unit: "pcs" },
      { group: "Produce", item: "Mini bell peppers", amount: 3, unit: "pcs" },
      { group: "Produce", item: "Yellow or white onion", amount: 0.25, unit: "pcs" },
      { group: "Produce", item: "Limes", amount: 1, unit: "pcs" },
      { group: "Pantry", item: "Black beans", amount: 0.25, unit: "cans" },
      { group: "Pantry", item: "Salsa or hot sauce", amount: 1, unit: "jars", pantry: true },
    ],
  },
  chipotleBowl: {
    name: "Chipotle Bowl",
    calories: 1406,
    protein: 95,
    image: "/assets/images/health/food-chipotle-bowl.jpg",
    detail: "Steak bowl with rice, peppers, onion, beans, lime, salsa.",
    cook: [
      "Cook rice and warm the beans.",
      "Sear steak hot, then rest and slice it.",
      "Saute peppers and onion, then build the bowl with lime and salsa.",
    ],
    source: "Cookbook p. 13",
    shopping: [
      { group: "Proteins", item: "Flank steak or carne asada", amount: 340, unit: "g" },
      { group: "Carbs", item: "Jasmine rice", amount: 180, unit: "g" },
      { group: "Produce", item: "Mini bell peppers", amount: 3, unit: "pcs" },
      { group: "Produce", item: "Green onion", amount: 1, unit: "bunches" },
      { group: "Produce", item: "Yellow or white onion", amount: 0.5, unit: "pcs" },
      { group: "Produce", item: "Limes", amount: 2, unit: "pcs" },
      { group: "Pantry", item: "Black beans", amount: 0.25, unit: "cans" },
      { group: "Dairy", item: "Mozzarella", amount: 30, unit: "g" },
      { group: "Pantry", item: "Salsa or hot sauce", amount: 1, unit: "jars", pantry: true },
    ],
  },
  pestoPizza: {
    name: "G-Pie Pesto Pizza",
    calories: 1280,
    protein: 89,
    image: "/assets/images/health/food-pesto-pizza.jpg",
    detail: "Cauliflower crust, chicken, spinach, mozzarella, pesto.",
    cook: [
      "Cook or use pre-cooked chicken.",
      "Spread pesto on the crust, then add chicken, spinach, and mozzarella.",
      "Bake until the crust is crisp and the cheese is melted.",
    ],
    prep: "Cook the chicken plain or lightly salted, then cool and refrigerate it shredded or sliced in an airtight box. Do not assemble the pizza until eating.",
    prepCook: "Cook the chicken plain or lightly salted. Shred or slice it once cool.",
    prepLater: "Assemble and bake the pizza fresh.",
    source: "Cookbook p. 14",
    shopping: [
      { group: "Proteins", item: "Chicken breast", amount: 225, unit: "g" },
      { group: "Carbs", item: "Cauliflower crust", amount: 1, unit: "pcs" },
      { group: "Produce", item: "Spinach", amount: 50, unit: "g" },
      { group: "Dairy", item: "Mozzarella", amount: 110, unit: "g" },
      { group: "Pantry", item: "Pesto", amount: 60, unit: "g" },
    ],
  },
  bigBison: {
    name: "Big Bison",
    calories: 610,
    protein: 55,
    image: "/assets/images/health/food-big-bison.jpg",
    detail: "Bison or lean beef, sourdough, egg, avocado.",
    cook: [
      "Form the meat into patties and salt both sides.",
      "Sear patties until cooked through, then fry one egg.",
      "Toast bread and stack with avocado.",
    ],
    source: "Cookbook p. 15",
    shopping: [
      { group: "Proteins", item: "Lean beef or bison", amount: 225, unit: "g" },
      { group: "Breakfast", item: "Toast bread", amount: 2, unit: "slices" },
      { group: "Breakfast", item: "Eggs", amount: 1, unit: "pcs" },
      { group: "Produce", item: "Avocados", amount: 0.25, unit: "pcs" },
    ],
  },
  xarSalad: {
    name: "Xar Salad",
    calories: 527,
    protein: 58,
    image: "/assets/images/health/food-xar-salad.jpg",
    detail: "Chicken, spring mix, avocado, feta, pine nuts.",
    cook: [
      "Use pre-cooked chicken or sear a quick chicken breast.",
      "Add greens, avocado, feta, and pine nuts to a bowl.",
      "Toss with vinaigrette right before eating so it stays crisp.",
    ],
    prep: "Sear chicken breast with salt and pepper, cool it, then slice it cold for salads. Store chicken airtight. Keep greens, avocado, feta, pine nuts, and vinaigrette separate.",
    prepCook: "Sear chicken with salt and pepper. Cool it, then slice it for salads.",
    prepLater: "Greens, avocado, feta, pine nuts, vinaigrette.",
    source: "Cookbook p. 16",
    shopping: [
      { group: "Proteins", item: "Chicken breast", amount: 225, unit: "g" },
      { group: "Produce", item: "Spring mix", amount: 120, unit: "g" },
      { group: "Produce", item: "Avocados", amount: 0.5, unit: "pcs" },
      { group: "Dairy", item: "Feta", amount: 30, unit: "g" },
      { group: "Pantry", item: "Pine nuts", amount: 15, unit: "g" },
      { group: "Pantry", item: "Vinaigrette", amount: 1, unit: "bottles", pantry: true },
    ],
  },
  beefBroc: {
    name: "Beef Broc",
    calories: 829,
    protein: 63,
    image: "/assets/images/health/food-beef-broc.jpg",
    detail: "Lean beef, broccoli, egg, jasmine rice, soy sauce.",
    cook: [
      "Cook rice while you steam or saute the broccoli.",
      "Brown the beef with salt and pepper.",
      "Fry one egg, then serve everything with soy sauce.",
    ],
    prep: "Brown lean beef with salt and pepper. Steam or saute broccoli. Cool beef and broccoli in shallow boxes. Keep soy sauce separate and cook the egg fresh.",
    prepCook: "Brown beef with salt and pepper. Steam or saute broccoli.",
    prepLater: "Soy sauce. Cook the egg fresh.",
    source: "Cookbook p. 20",
    shopping: [
      { group: "Proteins", item: "Lean ground beef", amount: 225, unit: "g" },
      { group: "Carbs", item: "Jasmine rice", amount: 90, unit: "g" },
      { group: "Produce", item: "Broccoli", amount: 250, unit: "g" },
      { group: "Breakfast", item: "Eggs", amount: 1, unit: "pcs" },
      { group: "Pantry", item: "Soy sauce", amount: 1, unit: "bottles", pantry: true },
    ],
  },
  omega: {
    name: "The Omega",
    calories: 710,
    protein: 47,
    image: "/assets/images/health/food-omega.jpg",
    detail: "Salmon, potatoes, carrots, broccoli, Brussels sprouts.",
    cook: [
      "Roast potatoes and vegetables on a tray.",
      "Bake or pan-sear salmon while the tray finishes.",
      "Add butter, lemon or lime, salt, and pepper at the end.",
    ],
    source: "Cookbook p. 22",
    shopping: [
      { group: "Proteins", item: "Salmon", amount: 170, unit: "g" },
      { group: "Carbs", item: "Potatoes", amount: 250, unit: "g" },
      { group: "Produce", item: "Carrots", amount: 2, unit: "pcs" },
      { group: "Produce", item: "Broccoli", amount: 150, unit: "g" },
      { group: "Produce", item: "Brussels sprouts", amount: 150, unit: "g" },
      { group: "Dairy", item: "Butter", amount: 10, unit: "g" },
    ],
  },
  xarShake: {
    name: "Xar-Shake",
    calories: 155,
    protein: 20,
    image: "/assets/images/health/food-snack-xar-shake.jpg",
    detail: "Berry collagen shake with coconut milk and maca.",
    cook: [
      "Blend frozen berries, water, ice, collagen, maca, and stevia.",
      "Pour in coconut milk last and blend smooth.",
    ],
    source: "Cookbook p. 37",
    shopping: [
      { group: "Produce", item: "Frozen berries", amount: 75, unit: "g" },
      { group: "Pantry", item: "Collagen powder", amount: 1, unit: "packs", pantry: true },
      { group: "Pantry", item: "Coconut milk", amount: 1, unit: "cans", pantry: true },
      { group: "Pantry", item: "Maca powder", amount: 1, unit: "packs", pantry: true },
    ],
  },
  dilla: {
    name: "The Dilla",
    calories: 227,
    protein: 19,
    image: "/assets/images/health/food-snack-dilla.jpg",
    detail: "Mini chicken-mozzarella quesadilla, crisp and fast.",
    cook: [
      "Heat skillet. Crisp one tortilla, then add cheese.",
      "Add shredded chicken, top with second tortilla, flip until melted.",
    ],
    source: "Cookbook p. 41",
    shopping: [
      { group: "Carbs", item: "Corn tortillas", amount: 2, unit: "pcs" },
      { group: "Dairy", item: "Mozzarella", amount: 30, unit: "g" },
      { group: "Proteins", item: "Chicken breast", amount: 30, unit: "g" },
    ],
  },
  bananaPancakes: {
    name: "Banana Pancakes",
    calories: 286,
    protein: 13,
    image: "/assets/images/health/food-snack-banana-pancakes.jpg",
    detail: "Banana + egg pancakes. Two ingredients, mini-stack.",
    cook: [
      "Mash banana, whisk in eggs.",
      "Spoon small pancakes into a hot pan and flip when golden.",
    ],
    source: "Cookbook p. 39",
    shopping: [
      { group: "Produce", item: "Bananas", amount: 1, unit: "pcs" },
      { group: "Breakfast", item: "Eggs", amount: 2, unit: "pcs" },
    ],
  },
  roastedChickies: {
    name: "Roasted Chickies",
    calories: 506,
    protein: 25,
    image: "/assets/images/health/food-snack-roasted-chickies.jpg",
    detail: "Crispy roasted chickpeas, big-batch snack jar.",
    cook: [
      "Dry chickpeas thoroughly, toss with oil and seasoning.",
      "Roast at 230°C until crispy, ~25 min, shaking pan halfway.",
    ],
    source: "Cookbook p. 43",
    shopping: [
      { group: "Pantry", item: "Chickpeas", amount: 1, unit: "cans" },
      { group: "Pantry", item: "Everything bagel seasoning", amount: 1, unit: "packs", pantry: true },
    ],
  },
  fireballNachos: {
    name: "Fireball Nachos",
    calories: 506,
    protein: 40,
    image: "/assets/images/health/food-snack-fireball-nachos.jpg",
    detail: "Nut-thin nachos with chicken, beans, mozzarella, hot sauce.",
    cook: [
      "Layer crackers with cheese on a microwave-safe plate, melt 30s.",
      "Top with chicken, black beans, salsa, and green onion.",
    ],
    source: "Cookbook p. 36",
    shopping: [
      { group: "Pantry", item: "Nut-thin crackers", amount: 16, unit: "pcs" },
      { group: "Dairy", item: "Mozzarella", amount: 30, unit: "g" },
      { group: "Pantry", item: "Black beans", amount: 0.25, unit: "cans" },
      { group: "Proteins", item: "Chicken breast", amount: 85, unit: "g" },
      { group: "Produce", item: "Green onion", amount: 1, unit: "bunches" },
      { group: "Pantry", item: "Salsa or hot sauce", amount: 1, unit: "jars", pantry: true },
    ],
  },
  hungerHack: {
    name: "Hunger Hack",
    calories: 133,
    protein: 2,
    image: "/assets/images/health/food-snack-hunger-hack.jpg",
    detail: "One medjool date + a teaspoon of nut butter. Pre-workout fuel.",
    cook: [
      "Pit a medjool date and stuff with nut butter. That's it.",
    ],
    source: "Cookbook p. 46",
    shopping: [
      { group: "Pantry", item: "Medjool dates", amount: 1, unit: "pcs" },
      { group: "Pantry", item: "Nut butter", amount: 1, unit: "jars", pantry: true },
    ],
  },
  popeyeEffect: {
    name: "Popeye Effect",
    calories: 325,
    protein: 21,
    image: "/assets/images/health/food-snack-popeye-effect.jpg",
    detail: "Green smoothie: spinach, banana, peanut butter, collagen.",
    cook: [
      "Blend coconut milk, ice, spinach, banana, collagen, and nut butter.",
      "Add maca and stevia, blend smooth.",
    ],
    source: "Cookbook p. 45",
    shopping: [
      { group: "Produce", item: "Spinach", amount: 30, unit: "g" },
      { group: "Produce", item: "Bananas", amount: 1, unit: "pcs" },
      { group: "Pantry", item: "Collagen powder", amount: 1, unit: "packs", pantry: true },
      { group: "Pantry", item: "Coconut milk", amount: 1, unit: "cans", pantry: true },
      { group: "Pantry", item: "Peanut butter", amount: 1, unit: "jars", pantry: true },
      { group: "Pantry", item: "Maca powder", amount: 1, unit: "packs", pantry: true },
    ],
  },
  buffaloChicken: {
    name: "Buffalo Chicken",
    calories: 671,
    protein: 64,
    image: "/assets/images/health/food-buffalo-chicken.jpg",
    detail: "Buffalo chicken, potato wedges, carrots, celery, yogurt dip.",
    cook: [
      "Cut potatoes into wedges and bake until crisp.",
      "Cook chicken, then toss with buffalo sauce.",
      "Serve with carrots, celery, and Greek yogurt dip.",
    ],
    prep: "Cook chicken plain or lightly salted, then cool and refrigerate airtight. Toss with buffalo sauce when reheating. Bake wedges fresh if you want crisp potatoes.",
    prepCook: "Cook chicken plain or lightly salted.",
    prepLater: "Buffalo sauce when reheating. Bake wedges fresh if you want crisp potatoes.",
    source: "Cookbook p. 24",
    shopping: [
      { group: "Proteins", item: "Chicken breast", amount: 225, unit: "g" },
      { group: "Carbs", item: "Russet potatoes", amount: 1, unit: "pcs" },
      { group: "Produce", item: "Carrots", amount: 2, unit: "pcs" },
      { group: "Produce", item: "Celery", amount: 4, unit: "sticks" },
      { group: "Dairy", item: "Greek yogurt", amount: 60, unit: "g" },
      { group: "Pantry", item: "Buffalo sauce", amount: 1, unit: "bottles", pantry: true },
    ],
  },
};
const healthFoodPlans = [
  {
    id: "week1",
    focus: "Hit protein every day",
    days: [
      { id: "mon", day: "Mon", title: "Upper I fuel", meals: ["goToBreakfast", "stirFry", "xarSalad"] },
      { id: "tue", day: "Tue", title: "Easy fuel", meals: ["goToBreakfast", "xarSalad", "omega"] },
      { id: "wed", day: "Wed", title: "Leg day fuel", meals: ["goToBreakfast", "pollos", "beefBroc"] },
      { id: "thu", day: "Thu", title: "Core fuel", meals: ["goToBreakfast", "salmonGuac", "bigBison"] },
      { id: "fri", day: "Fri", title: "Upper II fuel", meals: ["goToBreakfast", "pestoPizza", "buffaloChicken"] },
      { id: "sat", day: "Sat", title: "Skill fuel", meals: ["goToBreakfast", "bigBison", "pollos"] },
      { id: "sun", day: "Sun", title: "Easy reset", meals: ["goToBreakfast", "omega", "xarSalad"] },
    ],
  },
  {
    id: "week2",
    focus: "Cook protein in bulk",
    days: [
      { id: "mon", day: "Mon", title: "Upper I fuel", meals: ["goToBreakfast", "chipotleBowl", "xarSalad"] },
      { id: "tue", day: "Tue", title: "Easy fuel", meals: ["goToBreakfast", "omega", "bigBison"] },
      { id: "wed", day: "Wed", title: "Leg day fuel", meals: ["goToBreakfast", "allAmerican", "pollos"] },
      { id: "thu", day: "Thu", title: "Core fuel", meals: ["goToBreakfast", "xarSalad", "beefBroc"] },
      { id: "fri", day: "Fri", title: "Upper II fuel", meals: ["goToBreakfast", "stirFry", "bigBison"] },
      { id: "sat", day: "Sat", title: "Skill fuel", meals: ["goToBreakfast", "buffaloChicken", "salmonGuac"] },
      { id: "sun", day: "Sun", title: "Easy reset", meals: ["goToBreakfast", "salmonGuac", "xarSalad"] },
    ],
  },
  {
    id: "week3",
    focus: "Add carbs around hard days",
    days: [
      { id: "mon", day: "Mon", title: "Upper I fuel", meals: ["goToBreakfast", "pollos", "stirFry"] },
      { id: "tue", day: "Tue", title: "Easy fuel", meals: ["goToBreakfast", "xarSalad", "bigBison"] },
      { id: "wed", day: "Wed", title: "Leg day fuel", meals: ["goToBreakfast", "chipotleBowl", "beefBroc"] },
      { id: "thu", day: "Thu", title: "Core fuel", meals: ["goToBreakfast", "omega", "xarSalad"] },
      { id: "fri", day: "Fri", title: "Upper II fuel", meals: ["goToBreakfast", "pestoPizza", "bigBison"] },
      { id: "sat", day: "Sat", title: "Skill fuel", meals: ["goToBreakfast", "buffaloChicken", "pollos"] },
      { id: "sun", day: "Sun", title: "Easy reset", meals: ["goToBreakfast", "salmonGuac", "omega"] },
    ],
  },
  {
    id: "week4",
    focus: "Midpoint adjust",
    days: [
      { id: "mon", day: "Mon", title: "Upper I fuel", meals: ["goToBreakfast", "stirFry", "xarSalad"] },
      { id: "tue", day: "Tue", title: "Easy fuel", meals: ["goToBreakfast", "omega", "buffaloChicken"] },
      { id: "wed", day: "Wed", title: "Leg day fuel", meals: ["goToBreakfast", "allAmerican", "pollos"] },
      { id: "thu", day: "Thu", title: "Core fuel", meals: ["goToBreakfast", "beefBroc", "omega"] },
      { id: "fri", day: "Fri", title: "Upper II fuel", meals: ["goToBreakfast", "chipotleBowl", "bigBison"] },
      { id: "sat", day: "Sat", title: "Skill fuel", meals: ["goToBreakfast", "pestoPizza", "xarSalad"] },
      { id: "sun", day: "Sun", title: "Easy reset", meals: ["goToBreakfast", "salmonGuac", "bigBison"] },
    ],
  },
  {
    id: "week5",
    focus: "Eat enough to progress",
    days: [
      { id: "mon", day: "Mon", title: "Upper I fuel", meals: ["goToBreakfast", "chipotleBowl", "stirFry"] },
      { id: "tue", day: "Tue", title: "Easy fuel", meals: ["goToBreakfast", "xarSalad", "omega"] },
      { id: "wed", day: "Wed", title: "Leg day fuel", meals: ["goToBreakfast", "stirFry", "allAmerican"] },
      { id: "thu", day: "Thu", title: "Core fuel", meals: ["goToBreakfast", "omega", "buffaloChicken"] },
      { id: "fri", day: "Fri", title: "Upper II fuel", meals: ["goToBreakfast", "pollos", "pestoPizza"] },
      { id: "sat", day: "Sat", title: "Skill fuel", meals: ["goToBreakfast", "bigBison", "buffaloChicken"] },
      { id: "sun", day: "Sun", title: "Easy reset", meals: ["goToBreakfast", "salmonGuac", "xarSalad"] },
    ],
  },
  {
    id: "week6",
    focus: "Repeat the meals that work",
    days: [
      { id: "mon", day: "Mon", title: "Upper I fuel", meals: ["goToBreakfast", "beefBroc", "pollos"] },
      { id: "tue", day: "Tue", title: "Easy fuel", meals: ["goToBreakfast", "xarSalad", "bigBison"] },
      { id: "wed", day: "Wed", title: "Leg day fuel", meals: ["goToBreakfast", "chipotleBowl", "pollos"] },
      { id: "thu", day: "Thu", title: "Core fuel", meals: ["goToBreakfast", "omega", "xarSalad"] },
      { id: "fri", day: "Fri", title: "Upper II fuel", meals: ["goToBreakfast", "stirFry", "buffaloChicken"] },
      { id: "sat", day: "Sat", title: "Skill fuel", meals: ["goToBreakfast", "pestoPizza", "salmonGuac"] },
      { id: "sun", day: "Sun", title: "Easy reset", meals: ["goToBreakfast", "salmonGuac", "beefBroc"] },
    ],
  },
  {
    id: "week7",
    focus: "Fuel the hard sets",
    days: [
      { id: "mon", day: "Mon", title: "Upper I fuel", meals: ["goToBreakfast", "pestoPizza", "stirFry"] },
      { id: "tue", day: "Tue", title: "Easy fuel", meals: ["goToBreakfast", "xarSalad", "omega"] },
      { id: "wed", day: "Wed", title: "Leg day fuel", meals: ["goToBreakfast", "allAmerican", "chipotleBowl"] },
      { id: "thu", day: "Thu", title: "Core fuel", meals: ["goToBreakfast", "omega", "buffaloChicken"] },
      { id: "fri", day: "Fri", title: "Upper II fuel", meals: ["goToBreakfast", "stirFry", "bigBison"] },
      { id: "sat", day: "Sat", title: "Skill fuel", meals: ["goToBreakfast", "pollos", "xarSalad"] },
      { id: "sun", day: "Sun", title: "Easy reset", meals: ["goToBreakfast", "salmonGuac", "beefBroc"] },
    ],
  },
  {
    id: "week8",
    focus: "Retest and compare",
    days: [
      { id: "mon", day: "Mon", title: "Upper I fuel", meals: ["goToBreakfast", "stirFry", "xarSalad"] },
      { id: "tue", day: "Tue", title: "Easy fuel", meals: ["goToBreakfast", "omega", "bigBison"] },
      { id: "wed", day: "Wed", title: "Leg day fuel", meals: ["goToBreakfast", "chipotleBowl", "beefBroc"] },
      { id: "thu", day: "Thu", title: "Core fuel", meals: ["goToBreakfast", "salmonGuac", "xarSalad"] },
      { id: "fri", day: "Fri", title: "Upper II fuel", meals: ["goToBreakfast", "pestoPizza", "buffaloChicken"] },
      { id: "sat", day: "Sat", title: "Skill fuel", meals: ["goToBreakfast", "allAmerican", "pollos"] },
      { id: "sun", day: "Sun", title: "Easy reset", meals: ["goToBreakfast", "salmonGuac", "omega"] },
    ],
  },
];
const healthFoodPrepWindows = [
  { plan: "Sun Jun 28", shop: "Mon Jun 29", topUp: "Thu Jul 2" },
  { plan: "Sun Jul 5", shop: "Mon Jul 6", topUp: "Thu Jul 9" },
  { plan: "Sun Jul 12", shop: "Mon Jul 13", topUp: "Thu Jul 16" },
  { plan: "Sun Jul 19", shop: "Mon Jul 20", topUp: "Thu Jul 23" },
  { plan: "Sun Jul 26", shop: "Mon Jul 27", topUp: "Thu Jul 30" },
  { plan: "Sun Aug 2", shop: "Mon Aug 3", topUp: "Thu Aug 6" },
  { plan: "Sun Aug 9", shop: "Mon Aug 10", topUp: "Thu Aug 13" },
  { plan: "Sun Aug 16", shop: "Mon Aug 17", topUp: "Thu Aug 20" },
];
const foodShoppingGroupOrder = [
  "Breakfast",
  "Proteins",
  "Carbs",
  "Produce",
  "Dairy",
  "Pantry",
];
const foodUnitLabels = {
  bottles: ["bottle", "bottles"],
  bunches: ["bunch", "bunches"],
  cans: ["can", "cans"],
  jars: ["jar", "jars"],
  packs: ["pack", "packs"],
  pcs: ["pc", "pcs"],
  servings: ["serving", "servings"],
  slices: ["slice", "slices"],
  sticks: ["stick", "sticks"],
};
const foodReadableItemNames = {
  "Avocados": ["avocado", "avocados"],
  "Cauliflower crust": ["cauliflower crust", "cauliflower crusts"],
  "Carrots": ["carrot", "carrots"],
  "Celery": ["celery stick", "celery sticks"],
  "Corn tortillas": ["corn tortilla", "corn tortillas"],
  "Eggs": ["egg", "eggs"],
  "Espresso coffee": ["espresso serving", "espresso servings"],
  "Limes": ["lime", "limes"],
  "Mini bell peppers": ["mini bell pepper", "mini bell peppers"],
  "Russet potatoes": ["russet potato", "russet potatoes"],
  "Sweet potatoes": ["sweet potato", "sweet potatoes"],
  "Toast bread": ["toast slice", "toast slices"],
  "Turkey slices": ["turkey slice", "turkey slices"],
  "Yellow or white onion": ["yellow or white onion", "yellow or white onions"],
};
const foodBatchPrepRecipeIds = new Set(["stirFry", "xarSalad", "pollos", "pestoPizza", "beefBroc", "buffaloChicken"]);
const healthSnackOptions = [
  "xarShake",
  "dilla",
  "bananaPancakes",
  "roastedChickies",
  "fireballNachos",
  "hungerHack",
  "popeyeEffect",
];
const defaultHealthSnackId = "xarShake";
const validHealthSnackIds = new Set(healthSnackOptions);
const foodPrepAheadCarbItems = new Set(["Jasmine rice", "Potatoes", "Sweet potatoes"]);

function escapeHtml(value) {
  const replacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  };

  return String(value ?? "").replace(/[&<>"']/g, (character) => replacements[character]);
}

function applyRandomHealthTitle() {
  const title = document.querySelector("[data-health-title]");

  if (!title) {
    return;
  }

  let titleIndex = Math.floor(Math.random() * healthTitleOptions.length);

  try {
    const savedTitleIndex = localStorage.getItem(healthTitleStorageKey);
    const lastTitleIndex = savedTitleIndex === null ? -1 : Number(savedTitleIndex);

    if (Number.isInteger(lastTitleIndex) && healthTitleOptions.length > 1 && titleIndex === lastTitleIndex) {
      titleIndex = (titleIndex + 1 + Math.floor(Math.random() * (healthTitleOptions.length - 1))) % healthTitleOptions.length;
    }

    localStorage.setItem(healthTitleStorageKey, String(titleIndex));
  } catch {
    // Cosmetic only; the page still works if title memory is unavailable.
  }

  const lines = healthTitleOptions[titleIndex];
  title.innerHTML = lines.map((line) => `<span>${escapeHtml(line)}</span>`).join(" ");
}

function getDefaultHealthProfile() {
  return {
    height: "",
    age: "",
    sex: "male",
    activity: "moderate",
    goalWeight: "",
    goalBodyFat: "",
  };
}

function getDefaultHealthState() {
  const state = {
    activeWorkoutWeek: healthWeeks[0].id,
    activeFoodWeek: healthWeeks[0].id,
    profile: getDefaultHealthProfile(),
    measurements: {},
    photos: {},
    shopping: {},
    snacks: {},
    workouts: {},
  };

  healthMeasurementMetrics.forEach((metric) => {
    state.measurements[metric.id] = {};

    healthMeasurementCheckpoints.forEach((checkpoint) => {
      state.measurements[metric.id][checkpoint.id] = "";
    });
  });

  healthMeasurementCheckpoints.forEach((checkpoint) => {
    state.photos[checkpoint.id] = {};

    healthPhotoAngles.forEach((angle) => {
      state.photos[checkpoint.id][angle.id] = "";
    });
  });

  healthFoodPlans.forEach((week) => {
    state.shopping[week.id] = {};
  });

  healthWeeks.forEach((week) => {
    state.workouts[week.id] = {
      target: "",
      review: "",
      days: {},
    };

    healthWorkoutDays.forEach((day) => {
      state.workouts[week.id].days[day.id] = {
        done: false,
        log: "",
        result: "",
        notes: "",
        sets: createDefaultDaySets(day),
      };
    });
  });

  return state;
}

const workoutSetCount = 3;

function createDefaultDaySets(day) {
  const sets = {};
  day.items.forEach((_, exerciseIndex) => {
    sets[exerciseIndex] = Array.from({ length: workoutSetCount }, () => ({ reps: "", weight: "" }));
  });
  return sets;
}

function normalizeDaySets(day, savedSets) {
  const sets = createDefaultDaySets(day);

  if (!savedSets || typeof savedSets !== "object") {
    return sets;
  }

  day.items.forEach((_, exerciseIndex) => {
    const saved = savedSets[exerciseIndex];

    if (!Array.isArray(saved)) {
      return;
    }

    for (let setIndex = 0; setIndex < workoutSetCount; setIndex += 1) {
      const entry = saved[setIndex];

      if (entry && typeof entry === "object") {
        if (typeof entry.reps === "string") {
          sets[exerciseIndex][setIndex].reps = entry.reps;
        }
        if (typeof entry.weight === "string") {
          sets[exerciseIndex][setIndex].weight = entry.weight;
        }
      }
    }
  });

  return sets;
}

function mergeHealthState(savedState) {
  const state = getDefaultHealthState();

  if (!savedState || typeof savedState !== "object") {
    return state;
  }

  if (healthWeeks.some((week) => week.id === savedState.activeWorkoutWeek)) {
    state.activeWorkoutWeek = savedState.activeWorkoutWeek;
  }

  if (healthWeeks.some((week) => week.id === savedState.activeFoodWeek)) {
    state.activeFoodWeek = savedState.activeFoodWeek;
  }

  if (savedState.profile && typeof savedState.profile === "object") {
    ["height", "age", "goalWeight", "goalBodyFat"].forEach((key) => {
      if (typeof savedState.profile[key] === "string") {
        state.profile[key] = savedState.profile[key];
      }
    });

    if (healthProfileSexOptions.some((option) => option.id === savedState.profile.sex)) {
      state.profile.sex = savedState.profile.sex;
    }

    if (healthProfileActivityOptions.some((option) => option.id === savedState.profile.activity)) {
      state.profile.activity = savedState.profile.activity;
    }
  }

  healthMeasurementMetrics.forEach((metric) => {
    const savedMetric = savedState.measurements?.[metric.id];

    if (!savedMetric || typeof savedMetric !== "object") {
      return;
    }

    healthMeasurementCheckpoints.forEach((checkpoint) => {
      const value = savedMetric[checkpoint.id];

      if (typeof value === "string") {
        state.measurements[metric.id][checkpoint.id] = value;
      }
    });
  });

  healthMeasurementCheckpoints.forEach((checkpoint) => {
    const savedCheckpoint = savedState.photos?.[checkpoint.id];

    if (!savedCheckpoint || typeof savedCheckpoint !== "object") {
      return;
    }

    healthPhotoAngles.forEach((angle) => {
      const value = savedCheckpoint[angle.id];

      if (typeof value === "string") {
        state.photos[checkpoint.id][angle.id] = value;
      }
    });
  });

  healthFoodPlans.forEach((week) => {
    const savedWeek = savedState.shopping?.[week.id];

    if (!savedWeek || typeof savedWeek !== "object") {
      return;
    }

    Object.entries(savedWeek).forEach(([key, value]) => {
      if (typeof key === "string" && value === true) {
        state.shopping[week.id][key] = true;
      }
    });
  });

  healthFoodPlans.forEach((week) => {
    const savedWeek = savedState.snacks?.[week.id];

    if (!savedWeek || typeof savedWeek !== "object") {
      return;
    }

    state.snacks[week.id] = state.snacks[week.id] || {};

    week.days.forEach((day) => {
      const value = savedWeek[day.id];

      if (value === null || value === "none") {
        state.snacks[week.id][day.id] = null;
      } else if (typeof value === "string" && validHealthSnackIds.has(value)) {
        state.snacks[week.id][day.id] = value;
      }
    });
  });

  healthWeeks.forEach((week) => {
    const savedWeek = savedState.workouts?.[week.id];

    if (!savedWeek || typeof savedWeek !== "object") {
      return;
    }

    if (typeof savedWeek.target === "string") {
      state.workouts[week.id].target = savedWeek.target;
    }

    if (typeof savedWeek.review === "string") {
      state.workouts[week.id].review = savedWeek.review;
    }

    healthWorkoutDays.forEach((day) => {
      const savedDay = savedWeek.days?.[day.id];

      if (!savedDay || typeof savedDay !== "object") {
        return;
      }

      state.workouts[week.id].days[day.id] = {
        done: savedDay.done === true,
        log: typeof savedDay.log === "string" ? savedDay.log : [savedDay.result, savedDay.notes].filter((value) => typeof value === "string" && value.trim()).join(" | "),
        result: typeof savedDay.result === "string" ? savedDay.result : "",
        notes: typeof savedDay.notes === "string" ? savedDay.notes : "",
        sets: normalizeDaySets(day, savedDay.sets),
      };
    });
  });

  return state;
}

function readHealthState() {
  try {
    const value = localStorage.getItem(healthStorageKey);
    return mergeHealthState(value ? JSON.parse(value) : null);
  } catch {
    return getDefaultHealthState();
  }
}

function saveHealthState(state) {
  try {
    localStorage.setItem(healthStorageKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function readHealthMode() {
  try {
    const mode = localStorage.getItem(healthModeStorageKey);
    return validHealthModes.has(mode) ? mode : "track";
  } catch {
    return "track";
  }
}

function saveHealthMode(mode) {
  try {
    localStorage.setItem(healthModeStorageKey, mode);
  } catch {
    // Best effort only; the page still works without saved tab state.
  }
}

function setHealthMode(mode) {
  if (!validHealthModes.has(mode)) {
    return;
  }

  const healthPanel = document.querySelector("[data-yellow-page=\"health\"]");
  const healthModeNav = document.querySelector("[data-health-mode-selected]");
  const buttons = document.querySelectorAll("[data-health-mode-button]");
  const panels = document.querySelectorAll("[data-health-mode-panel]");

  if (healthPanel) {
    healthPanel.dataset.healthMode = mode;
  }

  if (healthModeNav) {
    healthModeNav.dataset.healthModeSelected = mode;
  }

  buttons.forEach((button) => {
    const isSelected = button.dataset.healthModeButton === mode;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });

  panels.forEach((panel) => {
    panel.hidden = panel.dataset.healthModePanel !== mode;
  });
}

function setupHealthModeNavigation() {
  const buttons = document.querySelectorAll("[data-health-mode-button]");

  if (!buttons.length) {
    return;
  }

  setHealthMode(readHealthMode());

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.healthModeButton;

      if (!validHealthModes.has(mode)) {
        return;
      }

      setHealthMode(mode);
      saveHealthMode(mode);
    });
  });
}

function getActiveWorkoutWeekIndex(state) {
  const index = healthWeeks.findIndex((week) => week.id === state.activeWorkoutWeek);
  return index >= 0 ? index : 0;
}

function getActiveFoodWeekIndex(state) {
  const index = healthFoodPlans.findIndex((week) => week.id === state.activeFoodWeek);
  return index >= 0 ? index : 0;
}

function setActiveWorkoutWeek(root, state, nextIndex) {
  const clampedIndex = Math.max(0, Math.min(healthWeeks.length - 1, nextIndex));
  state.activeWorkoutWeek = healthWeeks[clampedIndex].id;
  saveHealthState(state);
  renderHealthProgram(root, state);
}

function setActiveFoodWeek(root, state, nextIndex) {
  const clampedIndex = Math.max(0, Math.min(healthFoodPlans.length - 1, nextIndex));
  state.activeFoodWeek = healthFoodPlans[clampedIndex].id;
  saveHealthState(state);
  renderHealthFood(root, state);
}

function getDaySnackId(state, weekId, dayId) {
  const stored = state.snacks?.[weekId]?.[dayId];

  if (stored === null) {
    return null;
  }

  if (typeof stored === "string" && validHealthSnackIds.has(stored)) {
    return stored;
  }

  return defaultHealthSnackId;
}

function augmentDayWithSnack(day, state, weekId) {
  const snackId = getDaySnackId(state, weekId, day.id);

  if (!snackId) {
    return day;
  }

  return { ...day, meals: [...day.meals, snackId] };
}

function getAugmentedFoodDays(foodWeek, state) {
  return foodWeek.days.map((day) => augmentDayWithSnack(day, state, foodWeek.id));
}

function getFoodPlanProtein(day) {
  return day.meals.reduce((total, recipeId) => total + (healthRecipes[recipeId]?.protein || 0), 0);
}

function getFoodPlanCalories(day) {
  return day.meals.reduce((total, recipeId) => total + (healthRecipes[recipeId]?.calories || 0), 0);
}

function getHealthDailyTargets(state) {
  const profile = state.profile || getDefaultHealthProfile();
  const height = parseHealthNumber(profile.height);
  const age = parseHealthNumber(profile.age);
  const goalWeight = parseHealthNumber(profile.goalWeight);
  const latestWeight = getLatestMeasurement(state, "weight");
  const activity = healthProfileActivityOptions.find((option) => option.id === profile.activity) || healthProfileActivityOptions[2];

  if (!latestWeight) {
    return { hasProfile: false };
  }

  const proteinTarget = Math.round(latestWeight.value * 2);

  if (!height || !age) {
    return {
      hasProfile: true,
      proteinTarget,
      hasCalorieTarget: false,
    };
  }

  const sexOffset = profile.sex === "female" ? -161 : 5;
  const bmr = 10 * latestWeight.value + 6.25 * height - 5 * age + sexOffset;
  const maintenance = bmr * activity.factor;

  let direction = "maintain";
  let calorieTarget = Math.round(maintenance);

  if (goalWeight !== null) {
    const delta = latestWeight.value - goalWeight;
    if (delta > 0.5) {
      direction = "cut";
      calorieTarget = Math.round(maintenance - 400);
    } else if (delta < -0.5) {
      direction = "bulk";
      calorieTarget = Math.round(maintenance + 250);
    }
  }

  return {
    hasProfile: true,
    hasCalorieTarget: true,
    proteinTarget,
    calorieTarget,
    direction,
    maintenance: Math.round(maintenance),
  };
}

function formatDelta(value, unit) {
  if (value === 0) return `±0 ${unit}`;
  const sign = value > 0 ? "+" : "−";
  return `${sign}${Math.abs(value)} ${unit}`;
}

function getFoodTargetBand(planned, target, tolerance) {
  const delta = planned - target;
  if (delta >= 0 && delta <= tolerance * 2) return "on";
  if (delta > tolerance * 2) return "over";
  if (delta >= -tolerance) return "near";
  return "under";
}

function getFoodRecipeCounts(foodWeek) {
  return getFoodRecipeCountsForDays(foodWeek.days);
}

function getFoodRecipeCountsForDays(days) {
  const counts = new Map();

  days.forEach((day) => {
    day.meals.forEach((recipeId) => {
      counts.set(recipeId, (counts.get(recipeId) || 0) + 1);
    });
  });

  return counts;
}

function getFoodShoppingGroupsForDays(days) {
  const groups = new Map();

  getFoodRecipeCountsForDays(days).forEach((count, recipeId) => {
    const recipe = healthRecipes[recipeId];

    recipe?.shopping?.forEach((entry) => {
      const group = groups.get(entry.group) || new Map();
      const key = `${entry.item}|${entry.unit}`;
      const existing = group.get(key) || {
        amount: 0,
        item: entry.item,
        pantry: false,
        unit: entry.unit,
      };
      const amount = entry.pantry ? entry.amount : entry.amount * count;

      existing.amount = entry.pantry ? Math.max(existing.amount, amount) : existing.amount + amount;
      existing.pantry = existing.pantry || Boolean(entry.pantry);
      group.set(key, existing);
      groups.set(entry.group, group);
    });
  });

  return foodShoppingGroupOrder
    .map((label) => ({ label, items: Array.from(groups.get(label)?.values() || []) }))
    .filter((group) => group.items.length);
}

function getFoodShoppingGroups(foodWeek) {
  return getFoodShoppingGroupsForDays(foodWeek.days);
}

function formatFoodShoppingAmount(amount, unit) {
  if (unit === "g") {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)} kg`;
    }

    return `${Math.round(amount)} g`;
  }

  const rounded = Math.max(1, Math.ceil(amount - 0.001));
  const labels = foodUnitLabels[unit];

  if (!labels) {
    return `${rounded} ${unit}`;
  }

  return `${rounded} ${rounded === 1 ? labels[0] : labels[1]}`;
}

function formatFoodShoppingLine(item) {
  const readableNames = foodReadableItemNames[item.item];

  if (readableNames && ["pcs", "servings", "slices", "sticks"].includes(item.unit)) {
    const rounded = Math.max(1, Math.ceil(item.amount - 0.001));
    return `${rounded} ${rounded === 1 ? readableNames[0] : readableNames[1]}`;
  }

  return `${formatFoodShoppingAmount(item.amount, item.unit)} ${item.item}`;
}

function getFoodShoppingItemKey(groupLabel, item) {
  return `${groupLabel}|${item.item}|${item.unit}`;
}

function getFoodShoppingTotalsForCounts(counts, shouldInclude) {
  const totals = new Map();

  counts.forEach((count, recipeId) => {
    const recipe = healthRecipes[recipeId];

    recipe?.shopping?.forEach((entry) => {
      if (entry.pantry || !shouldInclude(entry)) {
        return;
      }

      const key = `${entry.item}|${entry.unit}`;
      const existing = totals.get(key) || { amount: 0, item: entry.item, unit: entry.unit };
      existing.amount += entry.amount * count;
      totals.set(key, existing);
    });
  });

  return Array.from(totals.values());
}

function formatFoodPrepItemList(items) {
  return items.length
    ? items.map((item) => formatFoodShoppingLine(item)).join(", ")
    : "";
}

function formatFoodRecipeCountList(counts, allowedIds) {
  const items = Array.from(counts.entries())
    .filter(([recipeId]) => allowedIds.has(recipeId))
    .map(([recipeId, count]) => {
      const recipeName = healthRecipes[recipeId]?.name || recipeId;
      return count > 1 ? `${recipeName} x${count}` : recipeName;
    });

  return items.join(", ");
}

function getFilteredFoodRecipeCounts(counts, allowedIds) {
  return new Map(Array.from(counts.entries()).filter(([recipeId]) => allowedIds.has(recipeId)));
}

function getFoodPrepCarbMealCount(counts) {
  return Array.from(counts.entries()).reduce((total, [recipeId, count]) => {
    const recipe = healthRecipes[recipeId];
    const hasPrepCarb = recipe?.shopping?.some((entry) => foodPrepAheadCarbItems.has(entry.item));

    return hasPrepCarb ? total + count : total;
  }, 0);
}

function getFoodPrepDayRange(days) {
  if (!days.length) {
    return "";
  }

  return `${days[0].day}-${days[days.length - 1].day}`;
}

function getFoodBatchPrepSummary(days) {
  const counts = getFoodRecipeCountsForDays(days);
  const batchCounts = getFilteredFoodRecipeCounts(counts, foodBatchPrepRecipeIds);
  const batchRecipeNames = formatFoodRecipeCountList(batchCounts, foodBatchPrepRecipeIds);
  const batchProteins = getFoodShoppingTotalsForCounts(batchCounts, (entry) => entry.group === "Proteins");
  const prepCarbs = getFoodShoppingTotalsForCounts(counts, (entry) => entry.group === "Carbs" && foodPrepAheadCarbItems.has(entry.item));
  const batchServings = Array.from(counts.entries()).reduce((total, [recipeId, count]) => foodBatchPrepRecipeIds.has(recipeId) ? total + count : total, 0);

  return {
    carbs: formatFoodPrepItemList(prepCarbs),
    carbMeals: getFoodPrepCarbMealCount(counts),
    dayRange: getFoodPrepDayRange(days),
    proteinItems: batchProteins,
    proteins: formatFoodPrepItemList(batchProteins),
    recipes: batchRecipeNames,
    servings: batchServings,
  };
}

function getFoodPrepProteinSentences(batch) {
  const items = batch.proteinItems || [];
  const hasChicken = items.some((item) => item.item === "Chicken breast");
  const hasGroundBeef = items.some((item) => item.item === "Lean ground beef");
  const sentences = [];

  if (hasChicken) {
    sentences.push("Chicken: cut into strips or cubes for bowls, salads, tacos, and pizza; salt it, then sear it in a hot pan with a little oil until cooked through.");
  }

  if (hasGroundBeef) {
    sentences.push("Beef: brown it loose with salt and pepper for the Beef Broc rice bowl; do not make burger patties.");
  }

  if (!sentences.length && batch.proteins) {
    sentences.push(`Protein: cook ${batch.proteins}.`);
  }

  return sentences;
}

function renderFoodBatchPrepDetail(batch) {
  const cookSentences = getFoodPrepProteinSentences(batch);
  const carbSentence = batch.carbs ? `Also cook ${batch.carbs}.` : "";
  const packSentence = batch.servings
    ? `Make ${batch.servings} boxes for ${batch.dayRange}; add the fresh bits when you eat.`
    : `Prep only what helps ${batch.dayRange}; cook the rest fresh.`;

  return `
                        <p>${escapeHtml([...cookSentences, carbSentence, packSentence].filter(Boolean).join(" "))}</p>`;
}

function getFoodPrepJourneys(foodWeek, activeIndex, state) {
  const window = healthFoodPrepWindows[activeIndex] || healthFoodPrepWindows[0];
  const augmentedDays = state ? getAugmentedFoodDays(foodWeek, state) : foodWeek.days;
  const mondayDays = augmentedDays.slice(0, 3);
  const thursdayDays = augmentedDays.slice(3);

  return [
    {
      id: "shop",
      shopDate: window.shop,
      days: mondayDays,
      batch: getFoodBatchPrepSummary(mondayDays),
      groups: getFoodShoppingGroupsForDays(mondayDays),
    },
    {
      id: "topUp",
      shopDate: window.topUp,
      days: thursdayDays,
      batch: getFoodBatchPrepSummary(thursdayDays),
      groups: getFoodShoppingGroupsForDays(thursdayDays),
    },
  ].filter((journey) => journey.days.length && (journey.groups.length || journey.batch.servings));
}

function renderFoodJourneyShopping(journey, foodWeek, state) {
  return journey.groups.map((group) => `
                          <div>
                            <strong>${escapeHtml(group.label)}</strong>
                            <ul>${group.items.map((item) => {
                              const itemKey = `${journey.id}|${getFoodShoppingItemKey(group.label, item)}`;
                              const isChecked = state.shopping?.[foodWeek.id]?.[itemKey] === true;

                              return `
                              <li>
                                <label class="food-shopping-check">
                                  <input type="checkbox" data-health-shopping-week="${escapeHtml(foodWeek.id)}" data-health-shopping-item="${escapeHtml(itemKey)}"${isChecked ? " checked" : ""}>
                                  <span>${escapeHtml(formatFoodShoppingLine(item))}</span>
                                </label>
                              </li>`;
                            }).join("")}
                            </ul>
                          </div>`).join("");
}

function buildFoodJourneyCopyText(journey) {
  return journey.groups
    .flatMap((group) => group.items.map((item) => formatFoodShoppingLine(item)))
    .join("\n");
}

function copyShoppingTextToClipboard(text, button) {
  const flashFeedback = (label) => {
    if (!button) {
      return;
    }

    const previousLabel = button.dataset.previousLabel || button.textContent;
    button.dataset.previousLabel = previousLabel;
    button.textContent = label;
    button.classList.add("is-feedback");

    window.setTimeout(() => {
      button.textContent = previousLabel;
      button.classList.remove("is-feedback");
      delete button.dataset.previousLabel;
    }, 1400);
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => flashFeedback("Copied"))
      .catch(() => flashFeedback("Copy failed"));
    return;
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    flashFeedback("Copied");
  } catch {
    flashFeedback("Copy failed");
  }
}

function renderFoodPrep(foodWeek, activeIndex, state) {
  const journeys = getFoodPrepJourneys(foodWeek, activeIndex, state);

  const journeyHtml = journeys.map((journey, index) => {
    const detail = journey.batch.servings || journey.batch.carbs ? renderFoodBatchPrepDetail(journey.batch) : "";
    const dayRange = journey.batch.dayRange || (journey.days.length ? `${journey.days[0].day}-${journey.days[journey.days.length - 1].day}` : "");
    const shopping = renderFoodJourneyShopping(journey, foodWeek, state);
    const copyKey = `${foodWeek.id}|${journey.id}`;

    return `
                      <article class="food-prep-journey" data-food-journey-index="${index}">
                        <header class="food-prep-journey-header">
                          <span class="food-prep-kicker">Journey ${index + 1} · Shop ${escapeHtml(journey.shopDate)}</span>
                          <h3>For ${escapeHtml(dayRange)}</h3>
                        </header>
                        ${detail ? `<div class="food-prep-journey-cook"><h4>Cook</h4>${detail}</div>` : ""}
                        <div class="food-prep-journey-shop">
                          <header class="food-prep-journey-shop-header">
                            <h4>Shop</h4>
                            <button class="food-prep-copy" type="button" data-health-shopping-copy="${escapeHtml(copyKey)}" aria-label="Copy this shopping list to clipboard">Copy list</button>
                          </header>
                          <div class="food-shopping-list">${shopping}
                          </div>
                        </div>
                      </article>`;
  }).join("");

  return `
                <section class="food-prep" aria-label="Food prep and shopping list">${journeyHtml}
                </section>`;
}

function renderFoodSnackCard(weekId, day, snackId) {
  const recipe = snackId ? healthRecipes[snackId] : null;
  const options = healthSnackOptions.map((id) => {
    const optionRecipe = healthRecipes[id];
    if (!optionRecipe) return "";
    const isSelected = id === snackId;
    return `<option value="${escapeHtml(id)}"${isSelected ? " selected" : ""}>${escapeHtml(optionRecipe.name)} · ${optionRecipe.calories} cal · ${optionRecipe.protein} g</option>`;
  }).join("");
  const noneSelected = snackId === null ? " selected" : "";
  const cookSteps = recipe
    ? (Array.isArray(recipe.cook) ? recipe.cook : [recipe.cook]).filter(Boolean).map((step) => `<li>${escapeHtml(step)}</li>`).join("")
    : "";

  const mediaHtml = recipe && recipe.image
    ? `<figure class="food-snack-media"><img src="${escapeHtml(recipe.image)}" alt="${escapeHtml(recipe.name)}" loading="lazy"></figure>`
    : "";

  return `
                    <section class="food-snack${recipe ? "" : " food-snack--empty"}" aria-label="${escapeHtml(day.day)} snack">
                      ${mediaHtml}
                      <div class="food-snack-main">
                        <span class="section-label">Snack</span>
                        <h5>${escapeHtml(recipe ? recipe.name : "No snack")}</h5>
                        ${recipe ? `<p>${escapeHtml(recipe.detail)}</p>` : `<p>Pick a snack to bump cal &amp; protein.</p>`}
                        ${recipe && cookSteps ? `<ol class="food-snack-cook">${cookSteps}</ol>` : ""}
                        <small>${recipe ? `${recipe.protein}g protein · ${recipe.calories} cal · ${escapeHtml(recipe.source || "")}` : "0g protein · 0 cal"}</small>
                      </div>
                      <label class="food-snack-picker">
                        <span class="section-label">Swap</span>
                        <select class="health-text-input" data-health-snack-week="${escapeHtml(weekId)}" data-health-snack-day="${escapeHtml(day.id)}" aria-label="${escapeHtml(day.day)} snack picker">
                          <option value="none"${noneSelected}>No snack</option>
                          ${options}
                        </select>
                      </label>
                    </section>`;
}

function renderFoodMealCards(recipeIds) {
  return recipeIds.map((recipeId, index) => {
    const recipe = healthRecipes[recipeId];

    if (!recipe) {
      return "";
    }

    const cookSteps = (Array.isArray(recipe.cook) ? recipe.cook : [recipe.cook])
      .filter(Boolean)
      .map((step) => `<li>${escapeHtml(step)}</li>`)
      .join("");

    return `
                        <article class="food-meal-card">
                          <img src="${escapeHtml(recipe.image)}" alt="${escapeHtml(recipe.name)}" loading="lazy">
                          <div>
                            <span>${escapeHtml(healthMealLabels[index] || "Meal")}</span>
                            <h5>${escapeHtml(recipe.name)}</h5>
                            <p>${escapeHtml(recipe.detail)}</p>
                            <div class="food-cook">
                              <span class="food-cook-label">Cook steps</span>
                              <ol>${cookSteps}</ol>
                            </div>
                            <small>${escapeHtml(recipe.protein)}g protein - ${escapeHtml(recipe.calories)} cal - ${escapeHtml(recipe.source)}</small>
                          </div>
                        </article>`;
  }).filter(Boolean).join("");
}

function parseHealthNumber(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(",", ".").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getLatestMeasurement(state, metricId) {
  const values = state.measurements?.[metricId] || {};

  for (let index = healthMeasurementCheckpoints.length - 1; index >= 0; index -= 1) {
    const checkpoint = healthMeasurementCheckpoints[index];
    const parsed = parseHealthNumber(values[checkpoint.id]);

    if (parsed !== null) {
      return { value: parsed, checkpointId: checkpoint.id, checkpointLabel: checkpoint.label };
    }
  }

  return null;
}

function formatHealthNumber(value, fractionDigits) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function renderHealthProfile(root, state) {
  const profile = state.profile || getDefaultHealthProfile();
  const baseFields = healthProfileFields.map((field) => `
                <label class="profile-field">
                  <span>${escapeHtml(field.label)}</span>
                  <input class="health-text-input" type="${escapeHtml(field.type)}" inputmode="${escapeHtml(field.inputmode)}" autocomplete="off" placeholder="${escapeHtml(field.placeholder)}" value="${escapeHtml(profile[field.id])}" data-health-profile-field="${escapeHtml(field.id)}">
                </label>`).join("");

  const sexOptions = healthProfileSexOptions.map((option) => `
                  <label class="profile-segment-option${option.id === profile.sex ? " is-selected" : ""}">
                    <input type="radio" name="profile-sex" value="${escapeHtml(option.id)}" data-health-profile-field="sex"${option.id === profile.sex ? " checked" : ""}>
                    <span>${escapeHtml(option.label)}</span>
                  </label>`).join("");

  const activityOptions = healthProfileActivityOptions.map((option) => `<option value="${escapeHtml(option.id)}"${option.id === profile.activity ? " selected" : ""}>${escapeHtml(option.label)} · ${escapeHtml(option.hint)}</option>`).join("");

  const goalFields = healthProfileGoalFields.map((field) => `
                <label class="profile-field">
                  <span>${escapeHtml(field.label)}</span>
                  <input class="health-text-input" type="text" inputmode="decimal" autocomplete="off" placeholder="${escapeHtml(field.placeholder)}" value="${escapeHtml(profile[field.id])}" data-health-profile-field="${escapeHtml(field.id)}">
                </label>`).join("");

  root.innerHTML = `
              ${baseFields}
                <label class="profile-field profile-field--segmented">
                  <span>Sex</span>
                  <div class="profile-segment">${sexOptions}
                  </div>
                </label>
                <label class="profile-field">
                  <span>Activity</span>
                  <select class="health-text-input profile-select" data-health-profile-field="activity">${activityOptions}</select>
                </label>
              ${goalFields}`;
}

function buildHealthInsights(state) {
  const profile = state.profile || getDefaultHealthProfile();
  const height = parseHealthNumber(profile.height);
  const age = parseHealthNumber(profile.age);
  const goalWeight = parseHealthNumber(profile.goalWeight);
  const goalBodyFat = parseHealthNumber(profile.goalBodyFat);
  const latestWeight = getLatestMeasurement(state, "weight");
  const latestBodyFat = getLatestMeasurement(state, "bodyFat");
  const latestWaist = getLatestMeasurement(state, "waist");
  const latestShoulders = getLatestMeasurement(state, "shoulders");
  const activity = healthProfileActivityOptions.find((option) => option.id === profile.activity) || healthProfileActivityOptions[2];

  const stats = [];
  const coachNotes = [];

  if (latestWeight) {
    stats.push({ label: "Current weight", value: `${formatHealthNumber(latestWeight.value, 1)} kg`, hint: latestWeight.checkpointLabel });
  }

  if (latestBodyFat) {
    stats.push({ label: "Body fat", value: `${formatHealthNumber(latestBodyFat.value, 1)}%`, hint: latestBodyFat.checkpointLabel });
  }

  if (height && latestWeight) {
    const meters = height / 100;
    const bmi = latestWeight.value / (meters * meters);
    let band = "—";
    if (bmi < 18.5) band = "Underweight";
    else if (bmi < 25) band = "Healthy range";
    else if (bmi < 30) band = "Above range";
    else band = "High";

    stats.push({ label: "BMI", value: formatHealthNumber(bmi, 1), hint: band });
  }

  if (latestWeight && latestBodyFat) {
    const leanMass = latestWeight.value * (1 - latestBodyFat.value / 100);
    stats.push({ label: "Lean mass", value: `${formatHealthNumber(leanMass, 1)} kg`, hint: "estimate" });
  }

  if (height && age && latestWeight) {
    const sexOffset = profile.sex === "female" ? -161 : 5;
    const bmr = 10 * latestWeight.value + 6.25 * height - 5 * age + sexOffset;
    const tdee = bmr * activity.factor;
    const proteinTarget = Math.round(latestWeight.value * 2);
    const cutCalories = Math.round(tdee - 400);
    const bulkCalories = Math.round(tdee + 250);

    stats.push({ label: "Maintenance cal", value: `${formatHealthNumber(Math.round(tdee), 0)} kcal`, hint: activity.label.toLowerCase() });
    stats.push({ label: "Protein target", value: `${proteinTarget} g`, hint: "2 g per kg" });
    stats.push({ label: "Cut · Bulk", value: `${formatHealthNumber(cutCalories, 0)} · ${formatHealthNumber(bulkCalories, 0)}`, hint: "kcal/day" });
  }

  if (latestShoulders && latestWaist && latestShoulders.value && latestWaist.value) {
    const ratio = latestShoulders.value / latestWaist.value;
    let band = "Building";
    if (ratio >= 1.618) band = "Greek god";
    else if (ratio >= 1.5) band = "Aesthetic";
    else if (ratio >= 1.4) band = "Strong base";

    stats.push({ label: "Shoulder · waist", value: formatHealthNumber(ratio, 2), hint: band });
  }

  if (latestWeight && goalWeight) {
    const delta = latestWeight.value - goalWeight;
    const absDelta = Math.abs(delta);

    if (absDelta < 0.4) {
      coachNotes.push("You're sitting on your goal weight. Hold here and let composition catch up.");
    } else if (delta > 0) {
      coachNotes.push(`${formatHealthNumber(absDelta, 1)} kg above goal. Stay in a small deficit (~400 kcal) and keep protein high.`);
    } else {
      coachNotes.push(`${formatHealthNumber(absDelta, 1)} kg under goal. Eat above maintenance, prioritize hard sets.`);
    }
  }

  if (latestBodyFat && goalBodyFat) {
    const deltaBf = latestBodyFat.value - goalBodyFat;

    if (deltaBf > 1) {
      coachNotes.push(`Body fat ${formatHealthNumber(deltaBf, 1)}% above goal. Cut leads the lift right now.`);
    } else if (deltaBf < -1) {
      coachNotes.push("Body fat below goal — you have room to add lean mass.");
    } else {
      coachNotes.push("Body fat is on target. Focus on quality of lifts, not the scale.");
    }
  }

  if (latestWeight) {
    const deltaXaryu = latestWeight.value - healthXaryuReference.weight;
    if (Math.abs(deltaXaryu) > 0.4) {
      const direction = deltaXaryu > 0 ? "above" : "below";
      coachNotes.push(`${formatHealthNumber(Math.abs(deltaXaryu), 1)} kg ${direction} Xaryu reference (80 kg).`);
    }
  }

  if (!stats.length) {
    coachNotes.push("Fill in your height, age, and one measurement to see calories, protein, and progress.");
  }

  return { stats, coachNotes };
}

function buildProgressChart(state) {
  const profile = state.profile || getDefaultHealthProfile();
  const goalWeight = parseHealthNumber(profile.goalWeight);
  const points = healthMeasurementCheckpoints.map((checkpoint) => {
    const value = parseHealthNumber(state.measurements?.weight?.[checkpoint.id]);
    return value === null ? null : { checkpoint, value };
  });
  const realPoints = points.filter(Boolean);
  const allValues = realPoints.map((point) => point.value);

  if (goalWeight !== null) {
    allValues.push(goalWeight);
  }

  allValues.push(healthXaryuReference.weight);

  if (realPoints.length < 1) {
    return `
                <div class="progress-chart progress-chart--empty">
                  <p>Log a Start weight in the measurements card to see your line.</p>
                </div>`;
  }

  const minValue = Math.min(...allValues) - 1;
  const maxValue = Math.max(...allValues) + 1;
  const range = maxValue - minValue || 1;
  const width = 640;
  const height = 220;
  const paddingX = 48;
  const paddingY = 28;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const xFor = (index) => paddingX + (innerWidth * index) / (healthMeasurementCheckpoints.length - 1);
  const yFor = (value) => paddingY + innerHeight - ((value - minValue) / range) * innerHeight;

  const linePoints = points.map((point, index) => point ? `${xFor(index)},${yFor(point.value)}` : null).filter(Boolean).join(" ");
  const dots = points.map((point, index) => point ? `<circle cx="${xFor(index)}" cy="${yFor(point.value)}" r="6" class="progress-chart-dot"/>
                      <text x="${xFor(index)}" y="${yFor(point.value) - 12}" class="progress-chart-value" text-anchor="middle">${formatHealthNumber(point.value, 1)}</text>` : "").join("");

  const xLabels = healthMeasurementCheckpoints.map((checkpoint, index) => `<text x="${xFor(index)}" y="${height - 6}" class="progress-chart-label" text-anchor="middle">${escapeHtml(checkpoint.label)}</text>`).join("");

  const goalLine = goalWeight !== null ? `
                  <line x1="${paddingX}" x2="${width - paddingX}" y1="${yFor(goalWeight)}" y2="${yFor(goalWeight)}" class="progress-chart-goal"/>
                  <text x="${width - paddingX}" y="${yFor(goalWeight) - 6}" class="progress-chart-goal-label" text-anchor="end">Goal ${formatHealthNumber(goalWeight, 1)} kg</text>` : "";

  const xaryuLine = `
                  <line x1="${paddingX}" x2="${width - paddingX}" y1="${yFor(healthXaryuReference.weight)}" y2="${yFor(healthXaryuReference.weight)}" class="progress-chart-xaryu"/>
                  <text x="${paddingX}" y="${yFor(healthXaryuReference.weight) - 6}" class="progress-chart-xaryu-label" text-anchor="start">Xaryu ${healthXaryuReference.weight} kg</text>`;

  return `
                <div class="progress-chart" aria-label="Weight progress chart">
                  <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Weight progress over checkpoints">
                    ${xaryuLine}
                    ${goalLine}
                    ${realPoints.length > 1 ? `<polyline points="${linePoints}" class="progress-chart-line"/>` : ""}
                    ${dots}
                    ${xLabels}
                  </svg>
                </div>`;
}

function renderHealthInsights(root, state) {
  const { stats, coachNotes } = buildHealthInsights(state);
  const statHtml = stats.map((stat) => `
                  <div class="insight-stat">
                    <span>${escapeHtml(stat.label)}</span>
                    <strong>${escapeHtml(stat.value)}</strong>
                    <small>${escapeHtml(stat.hint)}</small>
                  </div>`).join("");

  const notesHtml = coachNotes.length ? `
                <ul class="insight-notes">${coachNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
                </ul>` : "";

  root.innerHTML = `
              <div class="insight-stats">${statHtml}
              </div>
              ${notesHtml}
              ${buildProgressChart(state)}`;
}

function renderHealthMeasurements(root, state) {
  const headerCells = healthMeasurementCheckpoints.map((checkpoint) => `
                  <span><strong>${escapeHtml(checkpoint.label)}</strong><small>${escapeHtml(checkpoint.date)}</small></span>`).join("");
  const rows = healthMeasurementMetrics.map((metric) => {
    const inputs = healthMeasurementCheckpoints.map((checkpoint) => {
      const value = state.measurements[metric.id]?.[checkpoint.id] ?? "";

      return `
                  <input class="measurement-input" type="text" inputmode="decimal" autocomplete="off" aria-label="${escapeHtml(metric.label)} ${escapeHtml(checkpoint.label)}" data-health-measurement="${escapeHtml(metric.id)}" data-health-checkpoint="${escapeHtml(checkpoint.id)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(metric.placeholder)}">`;
    }).join("");

    return `
                <div class="measurement-row" role="row">
                  <span><strong>${escapeHtml(metric.label)}</strong><small>${escapeHtml(metric.hint)}</small></span>${inputs}
                </div>`;
  }).join("");

  root.innerHTML = `
                <div class="measurement-row measurement-row--head" role="row">
                  <span>Metric</span>${headerCells}
                </div>${rows}`;
}

function renderHealthPhotos(root, state) {
  const slots = healthMeasurementCheckpoints.flatMap((checkpoint) => healthPhotoAngles.map((angle) => {
    const image = state.photos[checkpoint.id]?.[angle.id] ?? "";
    const label = `${checkpoint.label} ${angle.label}`;

    return `
                  <div class="photo-upload-card${image ? " has-photo" : ""}">
                    <label class="photo-upload-label">
                      <span>${escapeHtml(label)}</span>
                      <span class="photo-frame">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(label)} progress photo">` : "<span>Upload</span>"}</span>
                      <input class="photo-file-input" type="file" accept="image/*" data-health-photo-checkpoint="${escapeHtml(checkpoint.id)}" data-health-photo-angle="${escapeHtml(angle.id)}">
                    </label>
                    <button class="photo-remove" type="button" data-health-photo-checkpoint="${escapeHtml(checkpoint.id)}" data-health-photo-remove="${escapeHtml(angle.id)}">Remove</button>
                  </div>`;
  })).join("");

  root.innerHTML = `${slots}
                <p class="photo-error" data-health-photo-error hidden></p>`;
}

function renderWorkoutItems(items) {
  return items.map((item) => `<span class="program-exercise" tabindex="0" data-tooltip="${escapeHtml(item.tooltip)}">${escapeHtml(item.label)}</span>`).join("<span>, </span>");
}

function renderWarmup() {
  const items = healthWarmupItems.map((item) => `
                  <figure class="warmup-card">
                    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt)}" loading="lazy">
                    <figcaption><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></figcaption>
                  </figure>`).join("");

  return `
                <section class="workout-warmup" aria-label="Warm-up">
                  <header class="workout-warmup-header">
                    <div>
                      <span>Warm-up</span>
                      <h3>Before every session</h3>
                    </div>
                    <p>3 rounds, then one easy first set.</p>
                  </header>
                  <div class="warmup-grid">${items}
                  </div>
                </section>`;
}

function renderHealthFood(root, state) {
  const activeIndex = getActiveFoodWeekIndex(state);
  const foodWeek = healthFoodPlans[activeIndex];
  const weekMeta = healthWeeks.find((week) => week.id === foodWeek.id) || healthWeeks[activeIndex];
  const weekButtons = healthFoodPlans.map((navWeek, index) => `
                    <button class="workout-week-pill${index === activeIndex ? " is-selected" : ""}" type="button" data-health-food-week-select="${escapeHtml(navWeek.id)}" aria-label="${escapeHtml(healthWeeks[index].label)} ${escapeHtml(healthWeeks[index].dates)}" aria-current="${index === activeIndex ? "true" : "false"}">W${index + 1}</button>`).join("");
  const targets = getHealthDailyTargets(state);
  const days = foodWeek.days.map((day) => {
    const augmentedDay = augmentDayWithSnack(day, state, foodWeek.id);
    const plannedProtein = getFoodPlanProtein(augmentedDay);
    const plannedCalories = getFoodPlanCalories(augmentedDay);
    const snackId = getDaySnackId(state, foodWeek.id, day.id);
    const snackHtml = renderFoodSnackCard(foodWeek.id, day, snackId);

    let proteinHtml;
    let calorieHtml;

    if (targets.hasProfile) {
      const proteinDelta = plannedProtein - targets.proteinTarget;
      const proteinBand = getFoodTargetBand(plannedProtein, targets.proteinTarget, 15);
      proteinHtml = `
                        <div class="food-day-stat food-day-stat--${escapeHtml(proteinBand)}">
                          <strong>${plannedProtein} g</strong>
                          <span>target ${targets.proteinTarget} g · ${escapeHtml(formatDelta(proteinDelta, "g"))}</span>
                        </div>`;
    } else {
      proteinHtml = `
                        <div class="food-day-stat">
                          <strong>${plannedProtein} g protein</strong>
                          <span>fill profile for target</span>
                        </div>`;
    }

    if (targets.hasCalorieTarget) {
      const calorieDelta = plannedCalories - targets.calorieTarget;
      const calorieBand = getFoodTargetBand(plannedCalories, targets.calorieTarget, 150);
      const directionLabel = targets.direction === "maintain" ? "maintenance" : targets.direction;
      calorieHtml = `
                        <div class="food-day-stat food-day-stat--${escapeHtml(calorieBand)}">
                          <strong>${plannedCalories} kcal</strong>
                          <span>${escapeHtml(directionLabel)} ${targets.calorieTarget} · ${escapeHtml(formatDelta(calorieDelta, "kcal"))}</span>
                        </div>`;
    } else {
      calorieHtml = `
                        <div class="food-day-stat">
                          <strong>${plannedCalories} kcal</strong>
                        </div>`;
    }

    return `
                  <section class="food-day">
                    <header class="food-day-header">
                      <div class="food-day-info">
                        <span class="food-day-kicker">${escapeHtml(day.day)}</span>
                        <h4>${escapeHtml(day.title)}</h4>
                      </div>
                      <div class="food-day-stats">
                        ${proteinHtml}
                        ${calorieHtml}
                      </div>
                    </header>
                    <div class="food-meal-grid">${renderFoodMealCards(day.meals)}
                    </div>
                    ${snackHtml}
                  </section>`;
  }).join("");

  state.activeFoodWeek = foodWeek.id;
  root.innerHTML = `
${renderFoodPrep(foodWeek, activeIndex, state)}
                <div class="food-carousel">
                  <nav class="workout-carousel-nav" aria-label="Food week navigation">
                    <button class="workout-week-arrow" type="button" data-health-food-week-nav="prev" aria-label="Previous food week"${activeIndex === 0 ? " disabled" : ""}>&lt;</button>
                    <div class="workout-week-pills">${weekButtons}
                    </div>
                    <button class="workout-week-arrow" type="button" data-health-food-week-nav="next" aria-label="Next food week"${activeIndex === healthFoodPlans.length - 1 ? " disabled" : ""}>&gt;</button>
                  </nav>
                  <article class="food-week">
                    <header class="food-week-header">
                      <span class="food-week-kicker">${escapeHtml(weekMeta.label)} - ${escapeHtml(weekMeta.dates)}</span>
                      <h3>${escapeHtml(foodWeek.focus)}</h3>
                    </header>
                    <div class="food-day-list">${days}
                    </div>
                  </article>
                </div>`;
}

function renderWorkoutSetGrid(week, day, dayState) {
  const sets = dayState.sets || {};
  const headerCells = Array.from({ length: workoutSetCount }, (_, index) => `
                      <div class="workout-set-head-cell">
                        <span class="workout-set-head">Set ${index + 1}</span>
                        <div class="workout-set-head-sub">
                          <span>reps</span>
                          <span>kg</span>
                        </div>
                      </div>`).join("");

  const rows = day.items.map((item, exerciseIndex) => {
    const exerciseSets = sets[exerciseIndex] || [];
    const setCells = Array.from({ length: workoutSetCount }, (_, setIndex) => {
      const entry = exerciseSets[setIndex] || { reps: "", weight: "" };
      return `
                        <div class="workout-set-cell">
                          <input class="workout-set-input" type="text" inputmode="decimal" autocomplete="off" placeholder="reps" aria-label="${escapeHtml(week.label)} ${escapeHtml(day.title)} ${escapeHtml(item.label)} set ${setIndex + 1} reps" value="${escapeHtml(entry.reps)}" data-health-set-week="${escapeHtml(week.id)}" data-health-set-day="${escapeHtml(day.id)}" data-health-set-exercise="${exerciseIndex}" data-health-set-index="${setIndex}" data-health-set-field="reps">
                          <input class="workout-set-input" type="text" inputmode="decimal" autocomplete="off" placeholder="kg" aria-label="${escapeHtml(week.label)} ${escapeHtml(day.title)} ${escapeHtml(item.label)} set ${setIndex + 1} weight" value="${escapeHtml(entry.weight)}" data-health-set-week="${escapeHtml(week.id)}" data-health-set-day="${escapeHtml(day.id)}" data-health-set-exercise="${exerciseIndex}" data-health-set-index="${setIndex}" data-health-set-field="weight">
                        </div>`;
    }).join("");

    return `
                    <div class="workout-set-row" role="row">
                      <span class="workout-set-label">${escapeHtml(item.label)}</span>
                      ${setCells}
                    </div>`;
  }).join("");

  return `
                  <div class="workout-set-grid" role="table" aria-label="${escapeHtml(week.label)} ${escapeHtml(day.title)} sets">
                    <div class="workout-set-row workout-set-row--head" role="row">
                      <span class="workout-set-label-head">Exercise</span>
                      ${headerCells}
                    </div>
                    ${rows}
                  </div>`;
}

function renderHealthProgram(root, state) {
  const activeIndex = getActiveWorkoutWeekIndex(state);
  const week = healthWeeks[activeIndex];
  const weekState = state.workouts[week.id];
  const weekButtons = healthWeeks.map((navWeek, index) => `
                    <button class="workout-week-pill${index === activeIndex ? " is-selected" : ""}" type="button" data-health-week-select="${escapeHtml(navWeek.id)}" aria-label="${escapeHtml(navWeek.label)} ${escapeHtml(navWeek.dates)}" aria-current="${index === activeIndex ? "true" : "false"}">W${index + 1}</button>`).join("");
  const days = healthWorkoutDays.map((day) => {
    const dayState = weekState.days[day.id];
    const image = day.image ? `
                      <figure class="workout-day-media">
                        <img src="${escapeHtml(day.image)}" alt="${escapeHtml(day.imageAlt)}" loading="lazy">
                      </figure>` : "";

    return `
                  <section class="workout-day${day.image ? " has-media" : ""}">
                    <div class="workout-day-main">
${image}
                      <div class="workout-day-info">
                        <span class="workout-day-kicker">${escapeHtml(day.day)}</span>
                        <h4>${escapeHtml(day.title)}</h4>
                      </div>
                    </div>
                    <div class="workout-day-fields">
                      ${renderWorkoutSetGrid(week, day, dayState)}
                    </div>
                  </section>`;
  }).join("");

  state.activeWorkoutWeek = week.id;
  root.innerHTML = `
${renderWarmup()}
                <div class="workout-carousel">
                  <nav class="workout-carousel-nav" aria-label="Workout week navigation">
                    <button class="workout-week-arrow" type="button" data-health-week-nav="prev" aria-label="Previous week"${activeIndex === 0 ? " disabled" : ""}>&lt;</button>
                    <div class="workout-week-pills">${weekButtons}
                    </div>
                    <button class="workout-week-arrow" type="button" data-health-week-nav="next" aria-label="Next week"${activeIndex === healthWeeks.length - 1 ? " disabled" : ""}>&gt;</button>
                  </nav>
                <article class="workout-week">
                  <header class="workout-week-header">
                    <div>
                      <span class="workout-week-kicker">${escapeHtml(week.label)} · ${escapeHtml(week.dates)}</span>
                      <h3><span class="workout-week-focus">${escapeHtml(week.focus)}</span></h3>
                    </div>
                  </header>
                  <div class="workout-day-list">${days}
                  </div>
                </article>
                </div>`;
}

function setHealthPhotoError(root, message) {
  const error = root.querySelector("[data-health-photo-error]");

  if (!error) {
    return;
  }

  error.textContent = message;
  error.hidden = !message;
}

function resizeHealthPhoto(file) {
  const maxSize = 1100;
  const quality = 0.74;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("Could not load that image."));
      image.onload = () => {
        const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
        const scale = largestSide > maxSize ? maxSize / largestSide : 1;
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Could not prepare that image."));
          return;
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      image.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  });
}

function setupHealthTracker() {
  const profileRoot = document.querySelector("[data-health-profile]");
  const insightsRoot = document.querySelector("[data-health-insights]");
  const measurementRoot = document.querySelector("[data-health-measurements]");
  const photoRoot = document.querySelector("[data-health-photos]");
  const foodRoot = document.querySelector("[data-health-food]");
  const programRoot = document.querySelector("[data-health-program]");
  const modeButtons = document.querySelectorAll("[data-health-mode-button]");

  if (!profileRoot && !insightsRoot && !measurementRoot && !photoRoot && !foodRoot && !programRoot && !modeButtons.length) {
    return;
  }

  setupHealthModeNavigation();

  if (!profileRoot && !insightsRoot && !measurementRoot && !photoRoot && !foodRoot && !programRoot) {
    return;
  }

  const state = readHealthState();

  const refreshInsights = () => {
    if (insightsRoot) {
      renderHealthInsights(insightsRoot, state);
    }
    if (foodRoot) {
      renderHealthFood(foodRoot, state);
    }
  };

  if (profileRoot) {
    renderHealthProfile(profileRoot, state);

    const handleProfileChange = (event) => {
      const field = event.target;

      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement)) {
        return;
      }

      const key = field.dataset.healthProfileField;

      if (!key) {
        return;
      }

      if (key === "sex") {
        if (field instanceof HTMLInputElement && field.checked) {
          state.profile.sex = field.value;
          renderHealthProfile(profileRoot, state);
          saveHealthState(state);
          refreshInsights();
        }
        return;
      }

      if (key === "activity") {
        state.profile.activity = field.value;
        saveHealthState(state);
        refreshInsights();
        return;
      }

      state.profile[key] = field.value;
      saveHealthState(state);
      refreshInsights();
    };

    profileRoot.addEventListener("input", handleProfileChange);
    profileRoot.addEventListener("change", handleProfileChange);
  }

  if (measurementRoot) {
    renderHealthMeasurements(measurementRoot, state);

    measurementRoot.addEventListener("input", (event) => {
      const input = event.target;

      if (!(input instanceof HTMLInputElement) || !input.dataset.healthMeasurement || !input.dataset.healthCheckpoint) {
        return;
      }

      state.measurements[input.dataset.healthMeasurement][input.dataset.healthCheckpoint] = input.value;
      saveHealthState(state);
      refreshInsights();
    });
  }

  if (insightsRoot) {
    refreshInsights();
  }

  if (photoRoot) {
    renderHealthPhotos(photoRoot, state);

    photoRoot.addEventListener("change", async (event) => {
      const input = event.target;

      if (!(input instanceof HTMLInputElement) || !input.dataset.healthPhotoCheckpoint || !input.dataset.healthPhotoAngle) {
        return;
      }

      const file = input.files?.[0];

      if (!file) {
        return;
      }

      setHealthPhotoError(photoRoot, "");

      try {
        const checkpoint = input.dataset.healthPhotoCheckpoint;
        const angle = input.dataset.healthPhotoAngle;
        const previousValue = state.photos[checkpoint][angle];
        state.photos[checkpoint][angle] = await resizeHealthPhoto(file);

        if (!saveHealthState(state)) {
          state.photos[checkpoint][angle] = previousValue;
          setHealthPhotoError(photoRoot, "That photo is too large to save here.");
          return;
        }

        renderHealthPhotos(photoRoot, state);
      } catch (error) {
        setHealthPhotoError(photoRoot, error.message || "That photo could not be saved.");
      } finally {
        input.value = "";
      }
    });

    photoRoot.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const button = event.target.closest("[data-health-photo-remove]");

      if (!button) {
        return;
      }

      const checkpoint = button.dataset.healthPhotoCheckpoint;
      const angle = button.dataset.healthPhotoRemove;

      state.photos[checkpoint][angle] = "";
      saveHealthState(state);
      renderHealthPhotos(photoRoot, state);
    });
  }

  if (foodRoot) {
    renderHealthFood(foodRoot, state);

    foodRoot.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const copyButton = event.target.closest("[data-health-shopping-copy]");

      if (copyButton instanceof HTMLButtonElement) {
        const [weekId, journeyId] = (copyButton.dataset.healthShoppingCopy || "").split("|");
        const activeIndex = healthFoodPlans.findIndex((week) => week.id === weekId);
        const foodWeek = healthFoodPlans[activeIndex];

        if (foodWeek) {
          const journey = getFoodPrepJourneys(foodWeek, activeIndex, state).find((entry) => entry.id === journeyId);

          if (journey) {
            const text = buildFoodJourneyCopyText(journey);
            copyShoppingTextToClipboard(text, copyButton);
          }
        }

        return;
      }

      const navButton = event.target.closest("[data-health-food-week-nav]");
      const weekButton = event.target.closest("[data-health-food-week-select]");

      if (navButton instanceof HTMLButtonElement && !navButton.disabled) {
        const currentIndex = getActiveFoodWeekIndex(state);
        const direction = navButton.dataset.healthFoodWeekNav === "next" ? 1 : -1;
        setActiveFoodWeek(foodRoot, state, currentIndex + direction);
        return;
      }

      if (weekButton instanceof HTMLButtonElement) {
        const selectedIndex = healthFoodPlans.findIndex((week) => week.id === weekButton.dataset.healthFoodWeekSelect);

        if (selectedIndex >= 0) {
          setActiveFoodWeek(foodRoot, state, selectedIndex);
        }
      }
    });

    foodRoot.addEventListener("change", (event) => {
      const target = event.target;

      if (target instanceof HTMLSelectElement && target.dataset.healthSnackWeek && target.dataset.healthSnackDay) {
        const weekId = target.dataset.healthSnackWeek;
        const dayId = target.dataset.healthSnackDay;
        state.snacks[weekId] = state.snacks[weekId] || {};

        if (target.value === "none") {
          state.snacks[weekId][dayId] = null;
        } else if (validHealthSnackIds.has(target.value)) {
          state.snacks[weekId][dayId] = target.value;
        }

        saveHealthState(state);
        renderHealthFood(foodRoot, state);
        return;
      }

      if (!(target instanceof HTMLInputElement) || !target.dataset.healthShoppingWeek || !target.dataset.healthShoppingItem) {
        return;
      }

      const weekId = target.dataset.healthShoppingWeek;
      const itemKey = target.dataset.healthShoppingItem;

      state.shopping[weekId] = state.shopping[weekId] || {};

      if (target.checked) {
        state.shopping[weekId][itemKey] = true;
      } else {
        delete state.shopping[weekId][itemKey];
      }

      saveHealthState(state);
    });

  }

  if (programRoot) {
    renderHealthProgram(programRoot, state);

    programRoot.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const navButton = event.target.closest("[data-health-week-nav]");
      const weekButton = event.target.closest("[data-health-week-select]");

      if (navButton instanceof HTMLButtonElement && !navButton.disabled) {
        const currentIndex = getActiveWorkoutWeekIndex(state);
        const direction = navButton.dataset.healthWeekNav === "next" ? 1 : -1;
        setActiveWorkoutWeek(programRoot, state, currentIndex + direction);
        return;
      }

      if (weekButton instanceof HTMLButtonElement) {
        const selectedIndex = healthWeeks.findIndex((week) => week.id === weekButton.dataset.healthWeekSelect);

        if (selectedIndex >= 0) {
          setActiveWorkoutWeek(programRoot, state, selectedIndex);
        }
      }
    });

    programRoot.addEventListener("input", (event) => {
      const field = event.target;

      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
        return;
      }

      if (field.dataset.healthSetWeek && field.dataset.healthSetDay && field.dataset.healthSetField) {
        const weekId = field.dataset.healthSetWeek;
        const dayId = field.dataset.healthSetDay;
        const exerciseIndex = Number(field.dataset.healthSetExercise);
        const setIndex = Number(field.dataset.healthSetIndex);
        const fieldName = field.dataset.healthSetField;

        if (!Number.isInteger(exerciseIndex) || !Number.isInteger(setIndex) || !["reps", "weight"].includes(fieldName)) {
          return;
        }

        const dayState = state.workouts[weekId]?.days[dayId];

        if (!dayState) {
          return;
        }

        dayState.sets = dayState.sets || {};
        dayState.sets[exerciseIndex] = dayState.sets[exerciseIndex] || Array.from({ length: workoutSetCount }, () => ({ reps: "", weight: "" }));
        dayState.sets[exerciseIndex][setIndex] = dayState.sets[exerciseIndex][setIndex] || { reps: "", weight: "" };
        dayState.sets[exerciseIndex][setIndex][fieldName] = field.value;
        saveHealthState(state);
        return;
      }

      if (field.dataset.healthWeekTarget) {
        state.workouts[field.dataset.healthWeekTarget].target = field.value;
      } else if (field.dataset.healthWeekReview) {
        state.workouts[field.dataset.healthWeekReview].review = field.value;
      } else if (field.dataset.healthDayLog && field.dataset.healthWeek) {
        const dayState = state.workouts[field.dataset.healthWeek].days[field.dataset.healthDayLog];
        dayState.log = field.value;
        dayState.result = field.value;
        dayState.notes = "";
      } else if (field.dataset.healthDayResult && field.dataset.healthWeek) {
        state.workouts[field.dataset.healthWeek].days[field.dataset.healthDayResult].result = field.value;
      } else if (field.dataset.healthDayNotes && field.dataset.healthWeek) {
        state.workouts[field.dataset.healthWeek].days[field.dataset.healthDayNotes].notes = field.value;
      } else {
        return;
      }

      saveHealthState(state);
    });

  }
}

function normalizePathname(pathname) {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function getPathForView(view) {
  if (view === "health") {
    return "/yellow/health/";
  }

  return `/yellow/${view}/`;
}

function getRoutedViewFromUrl(url) {
  const hashView = url.hash.replace("#", "");

  if (validViews.has(hashView)) {
    return hashView;
  }

  return routePaths.get(normalizePathname(url.pathname)) ?? null;
}

function getViewFromUrl(url) {
  return getRoutedViewFromUrl(url) ?? "health";
}

function replaceRoute(view) {
  const url = new URL(window.location.href);
  url.pathname = getPathForView(view);
  url.hash = "";
  url.search = "";

  window.history.replaceState({ view }, "", url);
}

function getViewFromLocation() {
  const url = new URL(window.location.href);
  const view = getViewFromUrl(url);
  const hashView = url.hash.replace("#", "");
  const normalizedPath = normalizePathname(url.pathname);

  if ((validViews.has(hashView) && hashView) || routePaths.get(normalizedPath) !== view) {
    replaceRoute(view);
  }

  return view;
}

function updateRoute(view) {
  const url = new URL(window.location.href);
  url.pathname = getPathForView(view);
  url.hash = "";
  url.search = "";

  if (url.href !== window.location.href) {
    window.history.pushState({ view }, "", url);
  }
}

function getActivePanel() {
  return document.querySelector(".yellow-panel.is-active");
}

function setActiveView(view, { animate = true, updateUrl = false } = {}) {
  const nextView = validViews.has(view) ? view : "health";
  const dockView = nextView.startsWith("finance") ? "finance" : nextView;
  const previousPanel = getActivePanel();
  const shouldAnimateLeaving = animate && previousPanel && previousPanel.dataset.yellowPage !== nextView;

  if (updateUrl) {
    updateRoute(nextView);
  }

  body.dataset.view = nextView;
  dock.dataset.selected = dockView;
  window.scrollTo({ top: 0, behavior: "instant" });

  dockItems.forEach((item) => {
    const isSelected = item.dataset.yellowNav === dockView;
    item.classList.toggle("is-selected", isSelected);

    if (isSelected) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  panels.forEach((panel) => {
    const isSelected = panel.dataset.yellowPage === nextView;
    const isLeaving = shouldAnimateLeaving && panel === previousPanel;

    if (panel.leaveTimer) {
      clearTimeout(panel.leaveTimer);
      panel.leaveTimer = null;
    }

    panel.classList.toggle("is-leaving", isLeaving);
    panel.classList.toggle("is-active", isSelected);
    panel.setAttribute("aria-hidden", String(!isSelected));

    if (isLeaving) {
      panel.leaveTimer = setTimeout(() => {
        panel.classList.remove("is-leaving");
        panel.leaveTimer = null;
      }, viewTransitionDuration);
    }
  });
}

function isUnlocked() {
  try {
    return sessionStorage.getItem(unlockStorageKey) === "true";
  } catch {
    return false;
  }
}

function rememberUnlock() {
  try {
    sessionStorage.setItem(unlockStorageKey, "true");
  } catch {
    // If storage is blocked, the page still unlocks for this load.
  }
}

function unlockYellow() {
  rememberUnlock();
  body.classList.remove("is-locked");
  body.classList.add("is-unlocked");

  if (passwordInput) {
    passwordInput.value = "";
    passwordInput.blur();
  }

  setActiveView(getViewFromLocation(), { animate: true });
}

function rejectPassword() {
  if (!gateForm || !passwordInput) {
    return;
  }

  gateForm.classList.remove("is-wrong");
  void gateForm.offsetWidth;
  gateForm.classList.add("is-wrong");
  passwordInput.value = "";
  passwordInput.focus();
}

function checkPassword() {
  const entered = passwordInput?.value.trim().toLowerCase();

  if (entered === "black") {
    unlockYellow();
    return true;
  }

  return false;
}

function setupGate() {
  if (isUnlocked()) {
    unlockYellow();
    return;
  }

  setActiveView("health", { animate: false });

  requestAnimationFrame(() => {
    passwordInput?.focus();
  });

  passwordInput?.addEventListener("input", () => {
    checkPassword();
  });

  gateForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!checkPassword()) {
      rejectPassword();
    }
  });
}

function setupNavigation() {
  dockItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (body.classList.contains("is-locked")) {
        return;
      }

      setActiveView(item.dataset.yellowNav, { updateUrl: true });
    });
  });

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const link = event.target.closest("a[href]");

    if (!link || link.target || link.hasAttribute("download")) {
      return;
    }

    const url = new URL(link.href, window.location.href);

    if (url.origin !== window.location.origin) {
      return;
    }

    const view = getRoutedViewFromUrl(url);

    if (!view || body.classList.contains("is-locked")) {
      return;
    }

    event.preventDefault();
    setActiveView(view, { updateUrl: true });
  });

  window.addEventListener("popstate", () => {
    if (body.classList.contains("is-locked")) {
      setActiveView("health", { animate: false });
      return;
    }

    setActiveView(getViewFromLocation());
  });

  window.addEventListener("hashchange", () => {
    if (body.classList.contains("is-locked")) {
      setActiveView("health", { animate: false });
      return;
    }

    setActiveView(getViewFromLocation());
  });
}

function parseFinanceAmount(text) {
  if (!text.includes("€")) {
    return null;
  }

  const match = text.replace(/\s/g, "").match(/-?\d[\d.]*,\d{2}€/);

  if (!match) {
    return null;
  }

  const value = Number(match[0].replace("€", "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

function formatFinanceAmount(cents) {
  const sign = cents < 0 ? "-" : "";
  const absoluteCents = Math.abs(cents);
  const euros = Math.floor(absoluteCents / 100).toLocaleString("de-DE");
  const remainder = String(absoluteCents % 100).padStart(2, "0");

  return `${sign}${euros},${remainder}€`;
}

function updateFinanceTotal(total, cents) {
  const amount = total.querySelector("strong");
  const formatted = formatFinanceAmount(cents);

  if (amount && amount.textContent.trim() !== formatted) {
    amount.textContent = formatted;
  }
}

function updateFinanceFlowTotals(flow) {
  let groupCents = 0;
  let pageTotalCents = 0;
  let latestTotalCents = 0;

  flow.querySelectorAll(":scope > .finance-row").forEach((row) => {
    const entryAmount = row.querySelector(".finance-entry .finance-entry-amount");
    const total = row.querySelector(".finance-total");

    if (entryAmount) {
      const cents = parseFinanceAmount(entryAmount.textContent);

      if (cents !== null) {
        groupCents += cents;
      }

      return;
    }

    if (!total) {
      return;
    }

    const label = total.querySelector(".finance-total-label")?.textContent.trim().toLowerCase() || "";
    let cents = groupCents;

    if (label === "total") {
      cents = pageTotalCents + groupCents;
      pageTotalCents = cents;
      latestTotalCents = cents;
      groupCents = 0;
    } else if (label.startsWith("divided by")) {
      cents = Math.round((latestTotalCents || pageTotalCents) / 12);
    } else {
      pageTotalCents += groupCents;
      latestTotalCents = pageTotalCents;
      groupCents = 0;
    }

    updateFinanceTotal(total, cents);
  });
}

function setupFinanceTotals() {
  const flows = [...document.querySelectorAll(".finance-flow")];

  function updateTotals() {
    flows.forEach(updateFinanceFlowTotals);
  }

  updateTotals();

  const observer = new MutationObserver(updateTotals);
  flows.forEach((flow) => observer.observe(flow, {
    childList: true,
    characterData: true,
    subtree: true,
  }));
}

function getLetterFields() {
  return [...document.querySelectorAll("[data-letter-field]")];
}

function isCollapsibleLetterField(field) {
  return field.matches(".letter-body p[data-letter-field]");
}

function updateLetterFieldState(field) {
  field.classList.toggle("is-empty", isCollapsibleLetterField(field) && field.textContent.trim() === "");
}

function applyRandomLetterDraft() {
  const draft = letterDrafts[Math.floor(Math.random() * letterDrafts.length)];

  getLetterFields().forEach((field) => {
    const key = field.dataset.letterField;

    if (typeof draft[key] === "string") {
      field.textContent = draft[key];
    }

    updateLetterFieldState(field);
  });
}

function readLetterState() {
  try {
    const value = localStorage.getItem(letterStorageKey);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function saveLetterState() {
  const fields = getLetterFields();

  if (!fields.length) {
    return;
  }

  const state = fields.reduce((nextState, field) => {
    updateLetterFieldState(field);
    nextState[field.dataset.letterField] = field.textContent;
    return nextState;
  }, {});

  try {
    localStorage.setItem(letterStorageKey, JSON.stringify(state));
  } catch {
    // Editing still works if storage is unavailable.
  }
}

function restoreLetterState() {
  const state = readLetterState();

  if (!state) {
    return;
  }

  getLetterFields().forEach((field) => {
    const savedValue = state[field.dataset.letterField];

    if (typeof savedValue === "string") {
      field.textContent = savedValue;
    }

    updateLetterFieldState(field);
  });
}

function getCleanLetterClone() {
  const sheet = document.querySelector("[data-letter-sheet]");

  if (!sheet) {
    return null;
  }

  const clone = sheet.cloneNode(true);
  clone.removeAttribute("data-letter-sheet");
  clone.querySelectorAll("[contenteditable], [spellcheck], [data-letter-field]").forEach((field) => {
    field.removeAttribute("contenteditable");
    field.removeAttribute("spellcheck");
    field.removeAttribute("data-letter-field");
    field.removeAttribute("aria-label");
  });

  return clone;
}

function getVisibleStyles() {
  return [...document.styleSheets].map((sheet) => {
    try {
      return [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
    } catch {
      return "";
    }
  }).join("\n");
}

function downloadBlob(contents, filename, type) {
  const blob = new Blob([contents], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(link.href);
  }, 1000);
}

function getLetterDocumentHtml(clone) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rafael Polutta Letter</title>
  <style>
${getVisibleStyles()}
@page {
  size: A4;
  margin: 0;
}
html,
body {
  width: 210mm;
  height: 295.5mm;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #fff;
}
.letter-sheet {
  width: 210mm;
  height: 295.5mm;
  min-height: 0;
  margin: 0;
  padding: 29% 9.4% 8%;
  box-sizing: border-box;
  break-after: avoid;
  page-break-after: avoid;
  box-shadow: none;
}
.letter-field,
.letter-field:hover,
.letter-field:focus {
  background: transparent;
  box-shadow: none;
}
  </style>
</head>
<body>
${clone.outerHTML}
</body>
</html>`;
}

function downloadLetterHtml() {
  const clone = getCleanLetterClone();

  if (!clone) {
    return;
  }

  downloadBlob(getLetterDocumentHtml(clone), "rafael-polutta-letter.html", "text/html;charset=utf-8");
}

function loadHtml2Pdf() {
  if (window.html2pdf) {
    return Promise.resolve(window.html2pdf);
  }

  if (html2PdfLoader) {
    return html2PdfLoader;
  }

  html2PdfLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = html2PdfUrl;
    script.async = true;
    script.onload = () => resolve(window.html2pdf);
    script.onerror = () => reject(new Error("Unable to load PDF exporter."));
    document.head.append(script);
  });

  return html2PdfLoader;
}

async function downloadLetterPdf(button) {
  const clone = getCleanLetterClone();

  if (!clone) {
    return;
  }

  const previousLabel = button?.textContent;
  const exportRoot = document.createElement("div");
  exportRoot.className = "letter-export-root";
  exportRoot.append(clone);

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Saving";
  }

  document.body.append(exportRoot);

  try {
    await document.fonts?.ready;
    const html2pdf = await loadHtml2Pdf();
    await html2pdf().set({
      filename: "rafael-polutta-letter.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      },
      jsPDF: {
        format: "a4",
        orientation: "portrait",
        unit: "mm",
      },
      margin: 0,
    }).from(clone).save();
  } catch (error) {
    console.warn(error);
    downloadLetterHtml();
  } finally {
    exportRoot.remove();

    if (button) {
      button.disabled = false;
      button.textContent = previousLabel;
    }
  }
}

function printLetter() {
  const clone = getCleanLetterClone();

  if (!clone) {
    return;
  }

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  const frame = document.createElement("iframe");
  frame.setAttribute("title", "Printable letter");
  frame.style.position = "fixed";
  frame.style.left = "-120vw";
  frame.style.top = "0";
  frame.style.width = "210mm";
  frame.style.height = "297mm";
  frame.style.border = "0";
  frame.style.opacity = "0";

  document.body.append(frame);

  const frameDocument = frame.contentDocument;

  if (!frameDocument) {
    frame.remove();
    window.print();
    return;
  }

  frameDocument.open();
  frameDocument.write(getLetterDocumentHtml(clone));
  frameDocument.close();

  window.setTimeout(async () => {
    try {
      await frame.contentDocument?.fonts?.ready;
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      window.setTimeout(() => {
        frame.remove();
      }, 1000);
    }
  }, 120);
}

function setupLetterEditor() {
  const fields = getLetterFields();

  if (!fields.length) {
    return;
  }

  applyRandomLetterDraft();

  fields.forEach((field) => {
    updateLetterFieldState(field);

    field.addEventListener("input", () => {
      updateLetterFieldState(field);
      saveLetterState();
    });

    field.addEventListener("blur", () => {
      updateLetterFieldState(field);
      saveLetterState();
    });
  });

  document.querySelectorAll("[data-letter-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.letterAction;

      if (action === "print") {
        printLetter();
        return;
      }

      if (action === "download") {
        downloadLetterPdf(button);
      }
    });
  });
}

setupNavigation();
setupFinanceTotals();
applyRandomHealthTitle();
setupHealthTracker();
setupLetterEditor();
setupGate();
