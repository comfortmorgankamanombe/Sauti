// Sauti: Voice-First Offline CS Tutor, full-page version.
// Everything here is static content bundled with the extension. No network
// calls, no API keys, nothing that can rate-limit or go down mid-demo.
// Follows the real Ministry of Primary and Secondary Education Computer
// Science syllabus (Forms 1-6, 2015-2022) "spiral approach": one topic
// thread, Algorithm Design and Data Structures, shown at increasing
// depth across Form 3, 4, 5 and 6, exactly as the Ministry's own Teacher's
// Guide describes the curriculum being taught. Form 3 and Form 6 are broken
// down into their exact official sub-topics, each with its own explanation,
// practical activity and practice questions, matching the syllabus's own
// scope and sequence chart rather than one merged summary per level.
//
// Sauti (Swahili, "voice") is voice-first: screen-reader support plus a
// built-in offline read-aloud mode (see voice.js), so blind and low-vision
// students can use it too.

(function () {
  // ---------- Content data, sourced from the real syllabus ----------
  const LEVELS = {
    f3: {
      label: "🌱 Just Starting Out",
      topics: [
        {
          key: "tools",
          topicRef: "6.7 Algorithm Design and Problem Solving (Form 3): Algorithm Tools",
          title: "Algorithm Tools: Flowcharts and Pseudocode",
          explanation:
            "An algorithm's logic can be written down using two standard tools, and Form 3 " +
            "expects you to recognise and use both.\n\n" +
            "FLOWCHARTS use standard shapes: an OVAL for Start/End, a RECTANGLE for a process " +
            "step (an action), a DIAMOND for a decision (a yes/no question), and a " +
            "PARALLELOGRAM for input/output.\n\n" +
            "PSEUDOCODE writes the same logic as structured, plain-English-like statements " +
            "(INPUT, OUTPUT, IF...THEN, WHILE...ENDWHILE) without following any one real " +
            "programming language's exact syntax.\n\n" +
            "Both describe the same algorithm. The tool you pick just changes how it looks on paper.",
          practical: "flowchart",
          qa: [
            {
              q: "Name the four basic flowchart symbols covered at this level and what each represents.",
              a: "Oval: Start/End. Rectangle: a process (an action or step). Diamond: a decision (a yes/no question). Parallelogram: input or output.",
            },
            {
              q: "What is pseudocode?",
              a: "A way of writing an algorithm's logic as structured, plain-English-like statements, without following the exact syntax rules of any one real programming language.",
            },
          ],
        },
        {
          key: "interpret",
          topicRef: "6.7 Algorithm Design and Problem Solving (Form 3): Interpreting and Testing Algorithms",
          title: "Interpreting and Testing Algorithms",
          explanation:
            "Interpreting an algorithm means tracing through it line by line, keeping track of " +
            "what each variable holds at each step. This is done using a trace table.\n\n" +
            "Testing an algorithm means checking it gives the right answer for NORMAL data " +
            "(typical, expected values), BOUNDARY/EXTREME data (the edges of what's allowed), " +
            "and INVALID data (values that should be rejected), not just one example that " +
            "happens to work.",
          practical: "trace",
          qa: [
            {
              q: "What is the purpose of a trace table?",
              a: "To track the value of each variable at every step of an algorithm as it runs, so you can work out what the algorithm actually does and check it is correct.",
            },
            {
              q: "Name the three types of data an algorithm should be tested with.",
              a: "Normal data, extreme/boundary data, and invalid/abnormal data.",
            },
            {
              q: "An algorithm only accepts whole numbers from 1 to 10. Give an example of normal, boundary, and invalid test data for it.",
              a: "Normal: 5 (a typical valid number). Boundary: 1 or 10 (the very edges of the valid range). Invalid: 0, 11, or a non-number like 'abc' (outside the range, or the wrong type entirely).",
            },
          ],
        },
      ],
    },
    f4: {
      label: "🧩 Building Algorithms",
      topics: [
        {
          key: "design",
          topicRef: "6.7 Algorithm Design and Problem Solving (Form 4): Algorithm Design",
          title: "Algorithm Design",
          explanation:
            "At Form 4 you move from reading algorithms to DESIGNING your own. A well-designed " +
            "algorithm is built from three basic control structures:\n\n" +
            "SEQUENCE: steps run one after another, in order.\n" +
            "SELECTION: a decision point (IF...THEN...ELSE) chooses between paths.\n" +
            "ITERATION: a loop (WHILE, FOR) repeats a set of steps.\n\n" +
            "Designing the algorithm before writing any code makes the logic clear, easier to " +
            "test, and far less likely to contain errors once it becomes a real program.",
          practical: "design",
          qa: [
            {
              q: "Name the three basic control structures used in algorithm design.",
              a: "Sequence, Selection, and Iteration (repetition).",
            },
            {
              q: "Why design an algorithm before writing the program code?",
              a: "It clarifies the logic first, makes the solution easier to test and debug, and reduces errors. Fixing a design on paper is far cheaper than fixing a finished program.",
            },
          ],
        },
      ],
    },
    f5: {
      label: "📊 Standard Algorithms",
      topics: [
        {
          key: "standard",
          topicRef: "7.6 Algorithm Design and Data Structures (Form 5)",
          title: "Pseudocode Structures, Standard Algorithms, Data Structures",
          explanation:
            "A-Level Form 5 applies the same control structures to real STANDARD ALGORITHMS " +
            "you're expected to know by name:\n\n" +
            "SORTING: Bubble sort (repeatedly swaps neighbouring out-of-order items) and " +
            "Quick sort (splits the list around a pivot and sorts each half).\n" +
            "SEARCHING: Linear search (checks every item in order) and Binary search " +
            "(repeatedly halves a sorted list to find a target, far faster on large sorted data).\n\n" +
            "You also start working with both dynamic (binary tree) and static (array) data structures.",
          practical: "bubblesort",
          qa: [
            {
              q: "Why is bubble sort generally less efficient than quick sort on large datasets?",
              a: "Bubble sort compares and swaps neighbouring items repeatedly (roughly O(n²) comparisons), while quick sort splits the list around a pivot and sorts each half separately, needing far fewer comparisons on average (roughly O(n log n)).",
            },
            {
              q: "What must be true about a list before you can binary search it?",
              a: "The list must already be sorted. Binary search works by repeatedly halving the search range, which only gives a correct answer if the data is in order.",
            },
          ],
        },
      ],
    },
    f6: {
      label: "🚀 Advanced Topics",
      topics: [
        {
          key: "arrays",
          topicRef: "7.6 Algorithm Design and Data Structures (Form 6): Binary Trees and Array Operations",
          title: "Binary Trees and Array Operations",
          explanation:
            "At Form 6 you perform real operations on both static and dynamic data structures.\n\n" +
            "ARRAY OPERATIONS: inserting a value shifts every item from that position onwards " +
            "one place to the right to make room. Deleting a value shifts every item after it " +
            "one place to the left to close the gap. Searching checks items one at a time (or, " +
            "if sorted, can use binary search).\n\n" +
            "BINARY TREES: each node has at most two children (left and right). In a binary " +
            "search tree, a new value is compared to the current node at each step: smaller " +
            "goes left, larger goes right, until an empty spot is found.",
          practical: "arrayops",
          qa: [
            {
              q: "What happens to the other elements in an array when you insert a new item in the middle of it?",
              a: "All elements from that position onwards must shift one place to the right to make room, since array positions must stay contiguous with no gaps.",
            },
            {
              q: "In a binary search tree, how do you decide whether to insert a new value to the left or right of a node?",
              a: "Compare the new value to the current node: if it is smaller, go left; if it is larger, go right; repeat at each node visited until you reach an empty spot.",
            },
          ],
        },
        {
          key: "primitives",
          topicRef: "7.6 Algorithm Design and Data Structures (Form 6): Primitive Data Types",
          title: "Primitive Data Types",
          explanation:
            "Every variable is built from one of four primitive data types:\n\n" +
            "INTEGER: a whole number, positive or negative, with no decimal point (e.g. 42).\n" +
            "FLOATING POINT (real): a number with a decimal point, used when fractional " +
            "precision matters (e.g. 74.5).\n" +
            "CHARACTER: a single letter, digit, or symbol (e.g. 'A').\n" +
            "BOOLEAN: only two possible values, TRUE or FALSE.\n\n" +
            "Choosing the right primitive type matters: using an integer where you need decimal " +
            "precision loses information; using a character where you need to do arithmetic " +
            "causes errors.",
          practical: "datatypes",
          qa: [
            {
              q: "List the four primitive data types named in the syllabus.",
              a: "Integer, Floating point, Character, and Boolean.",
            },
            {
              q: "Which primitive data type would you use to store a student's exact average mark, such as 74.5?",
              a: "Floating point (real), because it needs to store a decimal/fractional value, not just a whole number.",
            },
          ],
        },
        {
          key: "recursion",
          topicRef: "7.6 Algorithm Design and Data Structures (Form 6): Recursion",
          title: "Recursion",
          explanation:
            "RECURSION is when a function calls itself to solve a problem by breaking it into " +
            "smaller versions of the same problem.\n\n" +
            "Every recursive function needs two things: a BASE CASE that stops the recursion, " +
            "and a RECURSIVE CASE that moves the problem closer to that base case. Miss the " +
            "base case and the function calls itself forever.",
          practical: "recursion",
          qa: [
            {
              q: "What two parts must every recursive function have?",
              a: "A base case (a condition where the function stops calling itself and returns a direct answer) and a recursive case (where it calls itself again with a smaller version of the problem).",
            },
            {
              q: "What happens if a recursive function is missing its base case?",
              a: "It keeps calling itself forever (infinite recursion), which eventually crashes the program by running out of stack memory.",
            },
          ],
        },
      ],
    },
  };

  // Flat corpus of every question/answer pair across every level and topic,
  // used by ask.js to answer typed questions with the on-device QnA model.
  // Built here so the real syllabus content only ever lives in one place.
  const corpus = [];
  Object.keys(LEVELS).forEach((levelKey) => {
    LEVELS[levelKey].topics.forEach((topic) => {
      topic.qa.forEach((item) => {
        corpus.push({
          q: item.q,
          a: item.a,
          level: LEVELS[levelKey].label,
          topic: topic.title,
          topicRef: topic.topicRef,
        });
      });
    });
  });
  // A few "about the tool" entries so broad questions a user is likely to
  // ask (which aren't syllabus practice questions) get a correct, honest
  // answer instead of accidentally matching an unrelated syllabus entry.
  corpus.push(
    {
      q: "What is computer science?",
      a: "Computer Science is the study of how to solve problems using algorithms and data structures, and how to turn that logic into working programs. Sauti focuses specifically on the Algorithm Design and Data Structures thread of the Zimbabwean Form 3 to 6 syllabus.",
      level: "About Sauti",
      topic: "What This Tool Is",
      topicRef: "About",
    },
    {
      q: "What does this app do?",
      a: "Sauti teaches the Algorithm Design and Data Structures thread of the Zimbabwean Computer Science syllabus, Form 3 through Form 6, completely offline and by voice. Every topic has a plain explanation, a hands-on practical widget, and practice questions with answers, all readable by any screen reader and all speakable through Sauti's own built-in Read Aloud mode.",
      level: "About Sauti",
      topic: "What This Tool Is",
      topicRef: "About",
    },
    {
      q: "Who made this?",
      a: "Sauti was built by Comfort Kamanombe, a software engineering student at Bindura University of Science Education, Zimbabwe. It is voice-first so blind and low-vision students can use it too.",
      level: "About Sauti",
      topic: "What This Tool Is",
      topicRef: "About",
    },
    {
      q: "Does this need the internet to work?",
      a: "No. Sauti has zero network calls anywhere in its code, no account, no server, no API key. That includes Read Aloud: it only ever uses your device's own built-in offline voice, never a cloud voice. It works identically with no internet connection at all or full Wi-Fi.",
      level: "About Sauti",
      topic: "What This Tool Is",
      topicRef: "About",
    },
    {
      q: "Is this accessible to blind or low-vision students?",
      a: "Yes, that is the core design goal, not an add-on. Every screen in Sauti is marked up so an existing screen reader (NVDA, JAWS, VoiceOver, TalkBack) announces it correctly. Sauti also has its own built-in offline Read Aloud mode, toggled from the speaker icon in the header, for students without a screen reader already installed.",
      level: "About Sauti",
      topic: "What This Tool Is",
      topicRef: "About",
    }
  );

  // Added from real, worked, verified answers to ZIMSEC 6023/2 (Nov 2024),
  // Section B/C: Primitive Data Types, Leap Year, OOP, Standard Algorithms,
  // File Handling, and Entity-Relationship Diagrams. Each was checked
  // against the actual worked solution (including real program output
  // where shown) before being added here, not invented.
  corpus.push(
    {
      q: "What is the most appropriate data type for a variable holding a value like 13.5, such as MyAverage?",
      a: "Float (a real/floating point number, since it holds a decimal value).",
      level: "🚀 Advanced Topics",
      topic: "Primitive Data Types",
      topicRef: "6023/2 Section B",
    },
    {
      q: "What is the most appropriate data type for a variable holding True or False, such as ProjectCompleted?",
      a: "Boolean.",
      level: "🚀 Advanced Topics",
      topic: "Primitive Data Types",
      topicRef: "6023/2 Section B",
    },
    {
      q: "What is the most appropriate data type for a variable holding text like \"Home Economics\", such as Subject?",
      a: "String.",
      level: "🚀 Advanced Topics",
      topic: "Primitive Data Types",
      topicRef: "6023/2 Section B",
    },
    {
      q: "What is the most appropriate data type for a variable holding a whole number like 270, such as MyMark?",
      a: "Integer.",
      level: "🚀 Advanced Topics",
      topic: "Primitive Data Types",
      topicRef: "6023/2 Section B",
    },
    {
      q: "Produce a program code that prompts the user to enter a year and checks whether it is a leap year or not.",
      a: "VB.NET: Dim year As Integer. Console.WriteLine(\"Enter year: \"). year = Integer.Parse(Console.ReadLine). If year Mod 4 = 0 And year Mod 100 <> 0 Then Console.WriteLine(year & \" is a leap year\") Else Console.Write(year & \" is not a leap year\") End If. Tested with real output: 2024 correctly shown as a leap year, 2026 correctly shown as not a leap year. Note: this version does not separately handle the century-divisible-by-400 exception (e.g. 2000), which a stricter marking scheme may require.",
      level: "🚀 Advanced Topics",
      topic: "Algorithm Design",
      topicRef: "6023/2 Section B",
    },
    {
      q: "Draw a complete class diagram showing appropriate properties and methods for Student, Daystudent and Nightstudent.",
      a: "Superclass Student: Name (String), DOB (Date), GetName(), GetDOB(). Subclass Daystudent (inherits Student): Address (String), Telephone (String), GetAddress(), GetTelephone(). Subclass Nightstudent (inherits Student): NumOfSubj (Integer), TotalFee (Real), FeePaid (Boolean), GetNumOfSubj(), GetTotalFee(), GetFeePaid().",
      level: "🚀 Advanced Topics",
      topic: "Object-Oriented Programming",
      topicRef: "6023/2 Section B",
    },
    {
      q: "Produce the program code for the class definition: superclass Student, subclass Daystudent.",
      a: "VB.NET: Public Class Student. Private name As String. Private DateOfBirth As Date. Public Sub New(ByVal n As String, ByVal dob As Date). name = n. DateOfBirth = dob. End Sub. Public Function GetName() As String. Return name. End Function. Public Function GetDateOfBirth() As String. Return DateOfBirth. End Function. End Class.",
      level: "🚀 Advanced Topics",
      topic: "Object-Oriented Programming",
      topicRef: "6023/2 Section B",
    },
    {
      q: "Using the rule abc = a cubed + b cubed + c cubed, produce a program code to find all Armstrong numbers in the range 0 to 600.",
      a: "VB.NET: Dim a, b, c As Integer. For num = 0 To 600. a = num \\ 100. b = (num \\ 10) Mod 10. c = num Mod 10. If (a*a*a + b*b*b + c*c*c) = num Then Console.WriteLine(num & \" is Armstrong\") End If. Next. Here a is the hundreds digit, b the tens digit and c the units digit; from 0 to 600 this prints 0, 1, 153, 370 and 371.",
      level: "🚀 Advanced Topics",
      topic: "Standard Algorithms",
      topicRef: "6023/2 Section B",
    },
    {
      q: "Write the meaning of each statement from line 1 to line 6 in the given VB.NET StreamWriter program code.",
      a: "1) Declares a variable ObjStreamWriter of type StreamWriter. 2) This is where the program starts executing. 3) Creates a new StreamWriter object and creates a file called Results.txt in the E: drive for writing. 4) Writes the text \"Results are ready\" into the file. 5) Writes a second line \"From the Advanced Level\" into the file. 6) Closes the file stream and saves all data to disk.",
      level: "🚀 Advanced Topics",
      topic: "File Handling",
      topicRef: "6023/2 Section B",
    },
    {
      q: "Draw an ERD showing the relationship between Person and Passport Number.",
      a: "Person --1---Assigned---1-- Passport Number (a one-to-one relationship: each person is assigned exactly one passport number).",
      level: "🚀 Advanced Topics",
      topic: "Entity-Relationship Diagrams",
      topicRef: "6023/2 Section C",
    },
    {
      q: "Draw an ERD showing the relationship between Book and Author.",
      a: "Book --N---Has---1-- Author (many-to-one: many books can have the same author).",
      level: "🚀 Advanced Topics",
      topic: "Entity-Relationship Diagrams",
      topicRef: "6023/2 Section C",
    },
    {
      q: "Draw an ERD showing the relationship between Country and President.",
      a: "Country --1---Rules---1-- President (a one-to-one relationship: each country has one president).",
      level: "🚀 Advanced Topics",
      topic: "Entity-Relationship Diagrams",
      topicRef: "6023/2 Section C",
    }
  );

  // Short definitions of the core terms in each topic, so the plain
  // "what is X?" questions students ask most often get a direct answer.
  // Written to agree with the topic explanations above.
  const DEFINITIONS = [
    ["🌱 Just Starting Out", "Algorithm Tools: Flowcharts and Pseudocode", [
      ["What is an algorithm?", "An algorithm is a finite set of clear, step-by-step instructions for solving a problem or completing a task."],
      ["What is a flowchart?", "A flowchart is a diagram that shows the steps of an algorithm using standard symbols joined by arrows: an oval for start and end, a rectangle for a process, a diamond for a decision, and a parallelogram for input and output."],
      ["What does a diamond shape mean in a flowchart?", "A diamond is the decision symbol. It holds a yes/no question, and the flow follows a different arrow depending on the answer."],
      ["What is pseudocode?", "Pseudocode is a way of writing an algorithm in structured, English-like statements such as INPUT, IF ... THEN, WHILE and OUTPUT, without following the exact rules of any one programming language."],
    ]],
    ["🌱 Just Starting Out", "Interpreting and Testing Algorithms", [
      ["What is a trace table?", "A trace table records the value of each variable, step by step, as an algorithm runs, so you can follow what it does and check that it is correct."],
      ["What are normal, boundary and invalid test data?", "Normal data is typical valid input the algorithm should accept. Boundary (extreme) data sits at the very edges of the valid range. Invalid (abnormal) data is outside the range or the wrong type and should be rejected."],
    ]],
    ["🧩 Building Algorithms", "Algorithm Design", [
      ["What are sequence, selection and iteration?", "They are the three basic control structures. Sequence runs steps one after another. Selection chooses between paths using a condition, such as IF ... THEN ... ELSE. Iteration repeats steps using a loop, such as FOR, WHILE or REPEAT ... UNTIL."],
      ["What is iteration or a loop?", "Iteration means repeating a set of steps. A count-controlled loop (FOR) repeats a fixed number of times; a condition-controlled loop (WHILE or REPEAT ... UNTIL) repeats until a condition changes."],
      ["What is selection in an algorithm?", "Selection is when an algorithm chooses which steps to run based on a condition, using IF ... THEN ... ELSE or CASE statements."],
      ["What is a variable?", "A variable is a named storage location in memory whose value can change while the program runs."],
    ]],
    ["📊 Standard Algorithms", "Pseudocode Structures, Standard Algorithms, Data Structures", [
      ["How does linear search work?", "Linear search checks each item in a list one at a time, from the start, until it finds the target or reaches the end. It works on unsorted lists but is slow on large ones."],
      ["How does binary search work?", "Binary search works on a sorted list. It checks the middle item: if that is the target it stops, otherwise it discards the half that cannot contain the target and repeats on the other half, so the search range halves at every step."],
      ["How does bubble sort work?", "Bubble sort goes through the list comparing each pair of neighbouring items and swaps them if they are in the wrong order. It repeats these passes until a full pass makes no swaps, which means the list is sorted."],
      ["How does quick sort work?", "Quick sort picks a pivot item, splits the list into items smaller than the pivot and items larger than it, then sorts each part the same way until every part is sorted."],
      ["What is a data structure?", "A data structure is a way of organising and storing data so it can be used efficiently. Static structures such as arrays have a fixed size; dynamic structures such as linked lists and binary trees can grow and shrink while the program runs."],
    ]],
    ["🚀 Advanced Topics", "Binary Trees and Array Operations", [
      ["What is an array?", "An array is a static data structure that stores a fixed number of items of the same data type under one name, in consecutive positions reached by an index."],
      ["What is a binary tree?", "A binary tree is a dynamic data structure made of nodes, where each node holds a value and has at most two children, a left child and a right child. The top node is called the root."],
      ["What is a stack?", "A stack is a last in, first out (LIFO) data structure: items are added (pushed) and removed (popped) only at the top."],
      ["What is a queue?", "A queue is a first in, first out (FIFO) data structure: items join at the rear and leave from the front."],
      ["What is a linked list?", "A linked list is a dynamic data structure in which each node stores a value and a pointer to the next node, so the items do not need to sit next to each other in memory."],
    ]],
    ["🚀 Advanced Topics", "Primitive Data Types", [
      ["What is a data type?", "A data type tells the computer what kind of value a variable holds and what can be done with it. The primitive types are integer, floating point (real), character and Boolean."],
      ["What is a Boolean?", "A Boolean is a data type with only two possible values, TRUE or FALSE, used for conditions and flags."],
    ]],
    ["🚀 Advanced Topics", "Recursion", [
      ["What is recursion?", "Recursion is when a function calls itself to solve a problem by breaking it into smaller versions of the same problem, until it reaches a base case it can answer directly."],
      ["What is a base case?", "The base case is the condition in a recursive function that stops the recursion and returns an answer directly, without calling the function again."],
    ]],
  ];
  DEFINITIONS.forEach(([level, topic, items]) => {
    items.forEach(([q, a]) => corpus.push({ q, a, level, topic, topicRef: "Key definitions" }));
  });

  window.__zvCorpus = corpus;

  const TOPIC_ICONS = {
    flowchart: "🔀",
    trace: "🧮",
    design: "🧩",
    bubblesort: "📊",
    arrayops: "📦",
    datatypes: "🏷️",
    recursion: "🌀",
  };

  const levelSelect = document.querySelector("#zv-level");
  const topicsBar = document.querySelector("#zv-topics");
  const body = document.querySelector("#zv-body");
  const themeToggle = document.querySelector("#zv-theme-toggle");

  // ---------- Dark mode, remembered per browser ----------
  // Wrapped in try/catch: localStorage can throw in private windows or with
  // site data blocked, and this is only a convenience, never load-bearing.
  let dark = false;
  try { dark = localStorage.getItem("zv-dark") === "1"; } catch (e) {}
  function applyTheme() {
    document.documentElement.classList.toggle("zv-dark", dark);
    themeToggle.textContent = dark ? "☀" : "🌙";
  }
  applyTheme();
  themeToggle.addEventListener("click", () => {
    dark = !dark;
    applyTheme();
    try { localStorage.setItem("zv-dark", dark ? "1" : "0"); } catch (e) {}
  });

  levelSelect.addEventListener("change", () => renderLevel(levelSelect.value));
  renderLevel("f3");

  function renderLevel(levelKey) {
    const level = LEVELS[levelKey];
    topicsBar.innerHTML = "";

    if (level.topics.length > 1) {
      level.topics.forEach((topic, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "zv-topic-btn";
        const icon = document.createElement("span");
        icon.className = "zv-topic-icon";
        icon.textContent = TOPIC_ICONS[topic.practical] || "📘";
        const label = document.createElement("span");
        label.textContent = topic.title;
        btn.appendChild(icon);
        btn.appendChild(label);
        btn.dataset.index = i;
        btn.addEventListener("click", () => {
          topicsBar.querySelectorAll(".zv-topic-btn").forEach((b) => b.classList.remove("zv-topic-active"));
          btn.classList.add("zv-topic-active");
          renderTopic(levelKey, i);
        });
        topicsBar.appendChild(btn);
      });
      topicsBar.children[0].classList.add("zv-topic-active");
    }

    renderTopic(levelKey, 0);
  }

  function renderTopic(levelKey, topicIndex) {
    const topic = LEVELS[levelKey].topics[topicIndex];
    body.innerHTML = "";

    const ref = document.createElement("div");
    ref.className = "zv-ref";
    ref.textContent = topic.topicRef;
    body.appendChild(ref);

    const title = document.createElement("h1");
    title.className = "zv-title";
    title.textContent = topic.title;
    body.appendChild(title);

    const explanation = document.createElement("div");
    explanation.className = "zv-explanation";
    topic.explanation.split("\n\n").forEach((para) => {
      const p = document.createElement("p");
      p.textContent = para;
      explanation.appendChild(p);
    });
    body.appendChild(explanation);

    const practicalHeading = document.createElement("h2");
    practicalHeading.className = "zv-subheading";
    practicalHeading.textContent = "Practical";
    body.appendChild(practicalHeading);

    const practicalContainer = document.createElement("div");
    practicalContainer.className = "zv-practical";
    body.appendChild(practicalContainer);
    renderPractical(topic.practical, practicalContainer);

    const qaHeading = document.createElement("h2");
    qaHeading.className = "zv-subheading";
    qaHeading.textContent = "Practice Questions";
    body.appendChild(qaHeading);

    topic.qa.forEach((item, i) => {
      const qaBox = document.createElement("div");
      qaBox.className = "zv-qa";
      const q = document.createElement("div");
      q.className = "zv-q";
      q.textContent = `Q${i + 1}. ${item.q}`;
      const revealBtn = document.createElement("button");
      revealBtn.type = "button";
      revealBtn.className = "zv-btn zv-btn-small";
      revealBtn.textContent = "Show answer";
      const a = document.createElement("div");
      a.className = "zv-a";
      a.hidden = true;
      a.textContent = item.a;
      revealBtn.addEventListener("click", () => {
        a.hidden = !a.hidden;
        revealBtn.textContent = a.hidden ? "Show answer" : "Hide answer";
      });
      qaBox.appendChild(q);
      qaBox.appendChild(revealBtn);
      qaBox.appendChild(a);
      body.appendChild(qaBox);
    });
  }

  // ---------- Practical widgets ----------
  function renderPractical(type, container) {
    if (type === "flowchart") return renderFlowchart(container);
    if (type === "trace") return renderTrace(container);
    if (type === "design") return renderDesign(container);
    if (type === "bubblesort") return renderBubbleSort(container);
    if (type === "arrayops") return renderArrayOps(container);
    if (type === "datatypes") return renderDataTypes(container);
    if (type === "recursion") return renderRecursion(container);
  }

  // Draws an actual flowchart symbol as inline SVG (oval, rectangle,
  // diamond, parallelogram) rather than a plain text label, so the widget
  // shows the real shapes instead of describing them.
  function makeShapeSVG(kind) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", "84");
    svg.setAttribute("height", "50");
    svg.setAttribute("viewBox", "0 0 84 50");
    const shape = document.createElementNS(
      NS,
      kind === "oval" ? "ellipse" : kind === "diamond" || kind === "parallelogram" ? "polygon" : "rect"
    );
    shape.setAttribute("fill", "#eaf0ff");
    shape.setAttribute("stroke", "#1a3c8f");
    shape.setAttribute("stroke-width", "2.5");
    if (kind === "oval") {
      shape.setAttribute("cx", "42"); shape.setAttribute("cy", "25");
      shape.setAttribute("rx", "38"); shape.setAttribute("ry", "21");
    } else if (kind === "rectangle") {
      shape.setAttribute("x", "6"); shape.setAttribute("y", "6");
      shape.setAttribute("width", "72"); shape.setAttribute("height", "38");
      shape.setAttribute("rx", "3");
    } else if (kind === "diamond") {
      shape.setAttribute("points", "42,3 81,25 42,47 3,25");
    } else if (kind === "parallelogram") {
      shape.setAttribute("points", "20,6 81,6 64,44 3,44");
    }
    svg.appendChild(shape);
    return svg;
  }

  // Form 3, Algorithm Tools: identify flowchart symbols
  function renderFlowchart(container) {
    const shapes = ["oval", "rectangle", "diamond", "parallelogram"];
    const labels = { oval: "Oval", rectangle: "Rectangle", diamond: "Diamond", parallelogram: "Parallelogram" };
    const questions = [
      { q: "Which flowchart shape represents a DECISION (a yes/no question)?", correct: "diamond" },
      { q: "Which flowchart shape represents INPUT or OUTPUT?", correct: "parallelogram" },
    ];

    questions.forEach((item) => {
      const wrap = document.createElement("div");
      wrap.className = "zv-option";
      const q = document.createElement("p");
      q.className = "zv-hint";
      q.textContent = item.q;
      wrap.appendChild(q);

      const btnRow = document.createElement("div");
      btnRow.className = "zv-shape-row";
      const status = document.createElement("div");
      status.className = "zv-hint";

      shapes.forEach((kind) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "zv-shape-btn";
        btn.appendChild(makeShapeSVG(kind));
        const label = document.createElement("span");
        label.className = "zv-shape-label";
        label.textContent = labels[kind];
        btn.appendChild(label);
        btn.addEventListener("click", () => {
          const isCorrect = kind === item.correct;
          btnRow.querySelectorAll(".zv-shape-btn").forEach((b) => b.classList.remove("zv-shape-correct", "zv-shape-incorrect"));
          btn.classList.add(isCorrect ? "zv-shape-correct" : "zv-shape-incorrect");
          status.textContent = isCorrect
            ? `Correct. The ${labels[kind]} shape is used for this.`
            : `Not quite. The correct answer is ${labels[item.correct]}.`;
          status.style.color = isCorrect ? "#0e6b52" : "#b3261e";
        });
        btnRow.appendChild(btn);
      });

      wrap.appendChild(btnRow);
      wrap.appendChild(status);
      container.appendChild(wrap);
    });
  }

  // Form 3, Interpreting and Testing: trace table plus a testing classification check
  function renderTrace(container) {
    const algoText = document.createElement("pre");
    algoText.className = "zv-code";
    algoText.textContent =
      "total = 0\n" +
      "count = 1\n" +
      "WHILE count <= 4\n" +
      "    total = total + count\n" +
      "    count = count + 1\n" +
      "ENDWHILE\n" +
      "OUTPUT total";
    container.appendChild(algoText);

    const note = document.createElement("p");
    note.className = "zv-hint";
    note.textContent = "Trace this algorithm yourself, then press Reveal to check your trace table.";
    container.appendChild(note);

    const revealBtn = document.createElement("button");
    revealBtn.type = "button";
    revealBtn.className = "zv-btn";
    revealBtn.textContent = "Reveal trace table";
    container.appendChild(revealBtn);

    const table = document.createElement("table");
    table.className = "zv-table";
    table.hidden = true;
    const rows = [
      ["count", "total"],
      ["1", "1"],
      ["2", "3"],
      ["3", "6"],
      ["4", "10"],
      ["5 (loop ends)", "10 (output)"],
    ];
    rows.forEach((row, i) => {
      const tr = document.createElement("tr");
      row.forEach((cell) => {
        const td = document.createElement(i === 0 ? "th" : "td");
        td.textContent = cell;
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    container.appendChild(table);

    revealBtn.addEventListener("click", () => {
      table.hidden = !table.hidden;
      revealBtn.textContent = table.hidden ? "Reveal trace table" : "Hide trace table";
    });

    const testHeading = document.createElement("p");
    testHeading.className = "zv-hint";
    testHeading.style.marginTop = "12px";
    testHeading.textContent = "Now classify a test value: this loop is meant to run for count = 1 up to 4. What kind of test data is count = 0?";
    container.appendChild(testHeading);

    const testRow = document.createElement("div");
    testRow.className = "zv-choice-row";
    const testStatus = document.createElement("div");
    testStatus.className = "zv-hint";
    ["Normal", "Boundary", "Invalid"].forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "zv-btn zv-btn-small zv-btn-choice";
      btn.textContent = opt;
      btn.addEventListener("click", () => {
        const isCorrect = opt === "Invalid";
        testStatus.textContent = isCorrect
          ? "Correct. 0 is outside the loop's intended range (1 to 4), so it's invalid data."
          : "Not quite. Think about whether 0 is inside the range 1 to 4 at all.";
        testStatus.style.color = isCorrect ? "#0e6b52" : "#b3261e";
      });
      testRow.appendChild(btn);
    });
    container.appendChild(testRow);
    container.appendChild(testStatus);
  }

  // Form 4: pick the correct pseudocode for "largest of three numbers"
  function renderDesign(container) {
    const prompt = document.createElement("p");
    prompt.className = "zv-hint";
    prompt.textContent = "Problem: design an algorithm to find the largest of three numbers a, b, c. Which pseudocode below is correct?";
    container.appendChild(prompt);

    const options = [
      {
        text: "IF a > b AND a > c THEN\n    largest = a\nELSE IF b > c THEN\n    largest = b\nELSE\n    largest = c\nENDIF",
        correct: true,
      },
      {
        text: "largest = a\nlargest = b\nlargest = c\nOUTPUT largest",
        correct: false,
      },
      {
        text: "WHILE a > b > c\n    largest = a\nENDWHILE",
        correct: false,
      },
    ];

    const status = document.createElement("div");
    status.className = "zv-hint";

    options.forEach((opt) => {
      const wrap = document.createElement("div");
      wrap.className = "zv-option";
      const pre = document.createElement("pre");
      pre.className = "zv-code";
      pre.textContent = opt.text;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "zv-btn zv-btn-small";
      btn.textContent = "Choose this one";
      btn.addEventListener("click", () => {
        btn.classList.add(opt.correct ? "zv-flash-correct" : "zv-flash-incorrect");
        status.textContent = opt.correct
          ? "Correct. This uses selection (IF/ELSE IF/ELSE) to compare all three numbers properly."
          : "Not quite. Trace it through with real numbers and see where it goes wrong, then try another option.";
        status.style.color = opt.correct ? "#0e6b52" : "#b3261e";
      });
      wrap.appendChild(pre);
      wrap.appendChild(btn);
      container.appendChild(wrap);
    });

    container.appendChild(status);
  }

  // Form 5: step through bubble sort on a small array
  function renderBubbleSort(container) {
    let arr = [5, 2, 8, 1, 4];
    let i = 0, j = 0, n = arr.length;
    let done = false;

    const note = document.createElement("p");
    note.className = "zv-hint";
    note.textContent = "Press Step to watch bubble sort compare and swap neighbouring items, one comparison at a time.";
    container.appendChild(note);

    const display = document.createElement("div");
    display.className = "zv-array";
    container.appendChild(display);

    const status = document.createElement("div");
    status.className = "zv-hint";
    container.appendChild(status);

    const btnRow = document.createElement("div");
    const stepBtn = document.createElement("button");
    stepBtn.type = "button";
    stepBtn.className = "zv-btn zv-btn-small";
    stepBtn.textContent = "Step";
    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "zv-btn zv-btn-small";
    resetBtn.textContent = "Reset";
    btnRow.appendChild(stepBtn);
    btnRow.appendChild(resetBtn);
    container.appendChild(btnRow);

    function draw(highlight, swapped) {
      display.innerHTML = "";
      arr.forEach((v, idx) => {
        const box = document.createElement("span");
        box.className = "zv-array-item";
        box.style.height = 30 + v * 10 + "px";
        if (highlight && (idx === highlight[0] || idx === highlight[1])) {
          box.classList.add("zv-array-compare");
        }
        if (swapped && (idx === swapped[0] || idx === swapped[1])) {
          box.classList.add("zv-array-swap");
        }
        box.textContent = v;
        display.appendChild(box);
      });
    }

    function step() {
      if (done) { status.textContent = "Sorted! Press Reset to run again."; return; }
      if (i >= n - 1) { done = true; draw(null); status.textContent = "Sorted! Press Reset to run again."; return; }
      if (arr[j] > arr[j + 1]) {
        const tmp = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = tmp;
        status.textContent = `Swapped positions ${j} and ${j + 1} (${arr[j + 1]} > ${arr[j]} was out of order).`;
        draw([j, j + 1], [j, j + 1]);
        j += 1;
        if (j >= n - 1 - i) { j = 0; i += 1; }
        return;
      } else {
        status.textContent = `Compared positions ${j} and ${j + 1}, already in order, no swap.`;
      }
      draw([j, j + 1]);
      j += 1;
      if (j >= n - 1 - i) { j = 0; i += 1; }
    }

    stepBtn.addEventListener("click", step);
    resetBtn.addEventListener("click", () => {
      arr = [5, 2, 8, 1, 4]; i = 0; j = 0; done = false;
      draw(null);
      status.textContent = "Reset. Press Step to begin.";
    });

    draw(null);
    status.textContent = "Press Step to begin.";
  }

  // Form 6, Binary Trees and Array Operations: insert/delete/search on a fixed array
  function renderArrayOps(container) {
    let arr = [3, 7, 2];

    const note = document.createElement("p");
    note.className = "zv-hint";
    note.textContent = "Starting array: [3, 7, 2]. Press an operation to see what happens to the array.";
    container.appendChild(note);

    const display = document.createElement("div");
    display.className = "zv-array";
    container.appendChild(display);

    const status = document.createElement("div");
    status.className = "zv-hint";
    container.appendChild(status);

    const btnRow = document.createElement("div");
    const insertBtn = document.createElement("button");
    insertBtn.type = "button";
    insertBtn.className = "zv-btn zv-btn-small";
    insertBtn.textContent = "Insert 9 at index 1";
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "zv-btn zv-btn-small";
    deleteBtn.textContent = "Delete index 0";
    const searchBtn = document.createElement("button");
    searchBtn.type = "button";
    searchBtn.className = "zv-btn zv-btn-small";
    searchBtn.textContent = "Search for 7";
    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "zv-btn zv-btn-small";
    resetBtn.textContent = "Reset";
    btnRow.appendChild(insertBtn);
    btnRow.appendChild(deleteBtn);
    btnRow.appendChild(searchBtn);
    btnRow.appendChild(resetBtn);
    container.appendChild(btnRow);

    function draw(highlight) {
      display.innerHTML = "";
      arr.forEach((v, idx) => {
        const box = document.createElement("span");
        box.className = "zv-array-item zv-array-swap";
        box.style.height = 30 + v * 10 + "px";
        if (highlight && highlight.includes(idx)) box.classList.add("zv-array-compare");
        box.textContent = v;
        display.appendChild(box);
      });
    }

    insertBtn.addEventListener("click", () => {
      arr.splice(1, 0, 9);
      draw([1], [1]);
      status.textContent = "Inserted 9 at index 1. Everything from index 1 onwards shifted one place right to make room.";
    });
    deleteBtn.addEventListener("click", () => {
      if (arr.length === 0) { status.textContent = "Array is empty."; return; }
      arr.splice(0, 1);
      draw([0]);
      status.textContent = "Deleted index 0. Everything after it shifted one place left to close the gap.";
    });
    searchBtn.addEventListener("click", () => {
      const idx = arr.indexOf(7);
      if (idx === -1) {
        status.textContent = "7 is not in the array (it may already have been deleted).";
        draw(null);
      } else {
        status.textContent = `Found 7 at index ${idx}, after checking each position in order (linear search).`;
        draw([idx]);
      }
    });
    resetBtn.addEventListener("click", () => {
      arr = [3, 7, 2];
      draw(null);
      status.textContent = "Reset to the starting array.";
    });

    draw(null);
    status.textContent = "Try an operation above.";
  }

  // Form 6, Primitive Data Types: classify example values
  function renderDataTypes(container) {
    const questions = [
      { value: "42", correct: "Integer" },
      { value: "74.5", correct: "Floating point" },
      { value: "'A'", correct: "Character" },
      { value: "TRUE", correct: "Boolean" },
    ];
    const TYPE_ICON = { "Integer": "🔢", "Floating point": "➖", "Character": "🔤", "Boolean": "✅" };
    const types = ["Integer", "Floating point", "Character", "Boolean"];

    questions.forEach((item) => {
      const wrap = document.createElement("div");
      wrap.className = "zv-option";
      const q = document.createElement("p");
      q.className = "zv-hint";
      q.textContent = `What primitive data type is ${item.value}?`;
      wrap.appendChild(q);

      const btnRow = document.createElement("div");
      btnRow.className = "zv-choice-row";
      const status = document.createElement("div");
      status.className = "zv-hint";

      types.forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "zv-btn zv-btn-small zv-btn-choice";
        btn.textContent = `${TYPE_ICON[opt]} ${opt}`;
        btn.addEventListener("click", () => {
          const isCorrect = opt === item.correct;
          btn.classList.add(isCorrect ? "zv-flash-correct" : "zv-flash-incorrect");
          status.textContent = isCorrect
            ? `Correct. ${item.value} has type ${item.correct}.`
            : `Not quite. The correct answer is ${item.correct}.`;
          status.style.color = isCorrect ? "#0e6b52" : "#b3261e";
        });
        btnRow.appendChild(btn);
      });

      wrap.appendChild(btnRow);
      wrap.appendChild(status);
      container.appendChild(wrap);
    });
  }

  // Form 6, Recursion: call stack visualizer for factorial(4)
  function renderRecursion(container) {
    const note = document.createElement("p");
    note.className = "zv-hint";
    note.textContent = "factorial(4) calls factorial(3), which calls factorial(2)... down to the base case, then multiplies back up. Press Step to watch the call stack.";
    container.appendChild(note);

    const code = document.createElement("pre");
    code.className = "zv-code";
    code.textContent =
      "FUNCTION factorial(n)\n" +
      "    IF n <= 1 THEN\n" +
      "        RETURN 1          // base case\n" +
      "    ELSE\n" +
      "        RETURN n * factorial(n - 1)   // recursive case\n" +
      "    ENDIF\n" +
      "ENDFUNCTION";
    container.appendChild(code);

    const stackDisplay = document.createElement("div");
    stackDisplay.className = "zv-stack";
    container.appendChild(stackDisplay);

    const status = document.createElement("div");
    status.className = "zv-hint";
    container.appendChild(status);

    const btnRow = document.createElement("div");
    const stepBtn = document.createElement("button");
    stepBtn.type = "button";
    stepBtn.className = "zv-btn zv-btn-small";
    stepBtn.textContent = "Step";
    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "zv-btn zv-btn-small";
    resetBtn.textContent = "Reset";
    btnRow.appendChild(stepBtn);
    btnRow.appendChild(resetBtn);
    container.appendChild(btnRow);

    // Precomputed sequence of steps for factorial(4): calling down, then returning up.
    const steps = [
      { stack: [4], msg: "Call factorial(4). Not base case, so it calls factorial(3)." },
      { stack: [4, 3], msg: "Call factorial(3). Not base case, so it calls factorial(2)." },
      { stack: [4, 3, 2], msg: "Call factorial(2). Not base case, so it calls factorial(1)." },
      { stack: [4, 3, 2, 1], msg: "Call factorial(1). This IS the base case, so it returns 1." },
      { stack: [4, 3, 2], returning: "factorial(2) = 2 * 1 = 2", msg: "factorial(2) returns 2 * factorial(1) = 2." },
      { stack: [4, 3], returning: "factorial(3) = 3 * 2 = 6", msg: "factorial(3) returns 3 * factorial(2) = 6." },
      { stack: [4], returning: "factorial(4) = 4 * 6 = 24", msg: "factorial(4) returns 4 * factorial(3) = 24." },
      { stack: [], returning: "Final answer: 24", msg: "Done. factorial(4) = 24." },
    ];
    let idx = -1;

    function draw() {
      stackDisplay.innerHTML = "";
      if (idx < 0) return;
      steps[idx].stack.forEach((n) => {
        const frame = document.createElement("div");
        frame.className = "zv-stack-frame";
        frame.textContent = `factorial(${n})`;
        stackDisplay.appendChild(frame);
      });
      if (steps[idx].returning) {
        const ret = document.createElement("div");
        ret.className = "zv-stack-return";
        ret.textContent = steps[idx].returning;
        stackDisplay.appendChild(ret);
      }
    }

    stepBtn.addEventListener("click", () => {
      if (idx >= steps.length - 1) { status.textContent = "Done. Press Reset to run again."; return; }
      idx += 1;
      draw();
      status.textContent = steps[idx].msg;
    });
    resetBtn.addEventListener("click", () => {
      idx = -1;
      draw();
      status.textContent = "Press Step to begin.";
    });

    status.textContent = "Press Step to begin.";
  }
})();
