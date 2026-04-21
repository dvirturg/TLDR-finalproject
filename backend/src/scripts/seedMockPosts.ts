import dotenv from "dotenv";
import mongoose from "mongoose";
import ChatMessage from "../models/chatModel";
import Comment from "../models/commentModel";
import Post from "../models/postModel";
import User from "../models/userModel";

dotenv.config({ path: ".env.dev" });

type SeedUser = {
  username: string;
  email: string;
  password: string;
  profileUrl: string;
};

type SeedPost = {
  key: string;
  text: string;
  imageUrl: string;
  author: string;
  likes: string[];
};

type SeedComment = {
  text: string;
  author: string;
  postKey: string;
};

type SeedChatMessage = {
  sender: string;
  recipient: string;
  content: string;
  read: boolean;
  createdAt: Date;
};

const USER_COUNT = 100;
const POST_COUNT = 20;
const COMMENT_COUNT = 300;
const CHAT_MESSAGE_COUNT = 400;
const DEFAULT_PASSWORD = "Password123!";

// Topics are now distributed by category for 20 posts
const postTopics = [
  // 6 F1
  "F1 2026 regulation reset",
  "F1 Monaco qualifying drama",
  "F1 Ferrari's tire strategy",
  "F1 McLaren's consistency",
  "F1 Red Bull's recovery",
  "F1 rookie debuts",
  // 4 Coding
  "TypeScript generics",
  "Node.js async patterns",
  "React state management",
  "MongoDB schema design",
  // 4 Chef Restaurants
  "Chef's Table: Paris",
  "Tokyo's Michelin secrets",
  "NYC fusion cuisine trends",
  "Farm-to-table revolution",
  // 6 Daily Routines
  "Morning coffee rituals",
  "Commuting stories",
  "Lunch break hacks",
  "Evening workouts",
  "Grocery shopping tips",
  "Weekend relaxation",
];
/*
const postOpeners = [
  "Exploring",
  "Reviewing",
  "Discussing",
  "Highlighting",
  "Sharing thoughts on",
  "Deep dive:",
  "Quick tip:",
  "Personal take:",
  "Latest update:",
  "Behind the scenes:",
];
*/
const commentOpeners = [
  "This looks solid.",
  "Nice improvement here.",
  "The UI feels better already.",
  "This should help manual testing.",
  "Good baseline for the next pass.",
  "Worth checking in the feed as well.",
  "The populated author data is working now.",
  "This should make the demo environment much more realistic.",
];

const chatOpeners = [
  "Hey, did you review",
  "Can you check",
  "I pushed an update for",
  "Let's sync on",
  "I found a bug in",
  "Can you help test",
  "The latest build includes",
  "I just seeded data for",
];

const seedUsers: SeedUser[] = Array.from({ length: USER_COUNT }, (_, index) => {
  const number = index + 1;
  const handle = `DemoUser${String(number).padStart(3, "0")}`;

  return {
    username: handle,
    email: `demo${String(number).padStart(3, "0")}@tldr.dev`,
    password: DEFAULT_PASSWORD,
    profileUrl: `/public/uploads/profiles/demo-${String(number).padStart(3, "0")}.png`,
  };
});

const buildLikes = (authorIndex: number, postIndex: number) => {
  const likeCount = (postIndex % 4) + 1;
  const likedUsernames: string[] = [];

  for (let offset = 1; likedUsernames.length < likeCount; offset += 1) {
    const userIndex = (authorIndex + postIndex + offset) % USER_COUNT;
    if (userIndex === authorIndex) {
      continue;
    }

    const username = seedUsers[userIndex]!.username;
    if (!likedUsernames.includes(username)) {
      likedUsernames.push(username);
    }
  }

  return likedUsernames;
};

const seedPosts: SeedPost[] = [
  // 6 F1
  {
    key: "f1-2026-regulation-reset",
    text: "Exploring the impact of the 2026 F1 regulation reset. Will the new power units and aero rules shake up the grid?",
    imageUrl: "/public/uploads/posts/f1-2026-regs.jpg",
    author: seedUsers[0].username,
    likes: buildLikes(0, 0),
  },
  {
    key: "f1-monaco-qualifying",
    text: "Reviewing Monaco qualifying drama—traffic, tension, and a surprise pole sitter!",
    imageUrl: "",
    author: seedUsers[1].username,
    likes: buildLikes(1, 1),
  },
  {
    key: "f1-ferrari-tires",
    text: "Discussing Ferrari's tire strategy and how it changed the race outcome.",
    imageUrl: "",
    author: seedUsers[2].username,
    likes: buildLikes(2, 2),
  },
  {
    key: "f1-mclaren-consistency",
    text: "Highlighting McLaren's consistent points finishes in the 2026 season.",
    imageUrl: "",
    author: seedUsers[3].username,
    likes: buildLikes(3, 3),
  },
  {
    key: "f1-redbull-recovery",
    text: "Sharing thoughts on Red Bull's impressive recovery drives this year.",
    imageUrl: "/public/uploads/posts/f1-2026-redbull.jpg",
    author: seedUsers[4].username,
    likes: buildLikes(4, 4),
  },
  {
    key: "f1-rookie-debuts",
    text: "Deep dive: Rookie debuts in F1—who impressed and who struggled?",
    imageUrl: "",
    author: seedUsers[5].username,
    likes: buildLikes(5, 5),
  },
  // 4 Coding
  {
    key: "ts-generics",
    text: "Quick tip: Using TypeScript generics to write reusable code.",
    imageUrl: "",
    author: seedUsers[6].username,
    likes: buildLikes(6, 6),
  },
  {
    key: "nodejs-async-patterns",
    text: "Personal take: Node.js async patterns for scalable backend services.",
    imageUrl: "",
    author: seedUsers[7].username,
    likes: buildLikes(7, 7),
  },
  {
    key: "react-state-management",
    text: "Latest update: Best practices for state management in React apps.",
    imageUrl: "",
    author: seedUsers[8].username,
    likes: buildLikes(8, 8),
  },
  {
    key: "mongodb-schema-design",
    text: "Behind the scenes: Designing flexible schemas in MongoDB.",
    imageUrl: "",
    author: seedUsers[9].username,
    likes: buildLikes(9, 9),
  },
  // 4 Chef Restaurants
  {
    key: "chefs-table-paris",
    text: "Exploring Chef's Table in Paris—culinary artistry at its finest.",
    imageUrl: "/public/uploads/posts/chefs-paris.jpg",
    author: seedUsers[10].username,
    likes: buildLikes(10, 10),
  },
  {
    key: "tokyo-michelin-secrets",
    text: "Reviewing Tokyo's Michelin secrets: what makes these restaurants world-class?",
    imageUrl: "",
    author: seedUsers[11].username,
    likes: buildLikes(11, 11),
  },
  {
    key: "nyc-fusion-cuisine",
    text: "Discussing NYC's fusion cuisine trends and the chefs behind them.",
    imageUrl: "",
    author: seedUsers[12].username,
    likes: buildLikes(12, 12),
  },
  {
    key: "farm-to-table-revolution",
    text: "Highlighting the farm-to-table revolution in modern restaurants.",
    imageUrl: "",
    author: seedUsers[13].username,
    likes: buildLikes(13, 13),
  },
  // 6 Daily Routines
  {
    key: "morning-coffee-rituals",
    text: "Sharing thoughts on morning coffee rituals and their importance.",
    imageUrl: "",
    author: seedUsers[14].username,
    likes: buildLikes(14, 14),
  },
  {
    key: "commuting-stories",
    text: "Deep dive: Commuting stories from around the city.",
    imageUrl: "",
    author: seedUsers[15].username,
    likes: buildLikes(15, 15),
  },
  {
    key: "lunch-break-hacks",
    text: "Quick tip: Lunch break hacks for busy professionals.",
    imageUrl: "",
    author: seedUsers[16].username,
    likes: buildLikes(16, 16),
  },
  {
    key: "evening-workouts",
    text: "Personal take: Evening workouts and staying motivated.",
    imageUrl: "",
    author: seedUsers[17].username,
    likes: buildLikes(17, 17),
  },
  {
    key: "grocery-shopping-tips",
    text: "Latest update: Grocery shopping tips for saving time and money.",
    imageUrl: "",
    author: seedUsers[18].username,
    likes: buildLikes(18, 18),
  },
  {
    key: "weekend-relaxation",
    text: "Behind the scenes: Weekend relaxation routines for a balanced life.",
    imageUrl: "",
    author: seedUsers[19].username,
    likes: buildLikes(19, 19),
  },
];

const f1SeedPosts: SeedPost[] = [
  {
    key: "f1-2025-preseason-testing",
    text: "F1 2025 preseason testing looked tighter than expected. Ferrari's long-run pace and McLaren's balance suggest the title fight could start immediately in Melbourne.",
    imageUrl: "/public/uploads/posts/f1-2025-testing.jpg",
    author: "DemoUser005",
    likes: ["DemoUser011", "DemoUser018", "DemoUser024", "DemoUser030"],
  },
  {
    key: "f1-2025-australia",
    text: "The opening race of the 2025 F1 season set the tone fast: strategy mattered more than outright pace, and the undercut window was brutal.",
    imageUrl: "",
    author: "DemoUser011",
    likes: ["DemoUser005", "DemoUser019", "DemoUser027"],
  },
  {
    key: "f1-2025-ferrari-upgrades",
    text: "Ferrari's 2025 mid-season floor upgrade finally seems to stabilize high-speed corners. If tire wear stays controlled, they are in every Sunday fight.",
    imageUrl: "",
    author: "DemoUser018",
    likes: ["DemoUser005", "DemoUser011", "DemoUser026", "DemoUser033"],
  },
  {
    key: "f1-2025-mclaren-consistency",
    text: "McLaren's biggest strength in 2025 might be consistency rather than peak speed. They keep scoring even on weekends where qualifying is messy.",
    imageUrl: "",
    author: "DemoUser024",
    likes: ["DemoUser018", "DemoUser030", "DemoUser041"],
  },
  {
    key: "f1-2025-redbull-recovery",
    text: "Red Bull still has the fastest recovery pace in dirty air, but 2025 doesn't feel like the untouchable era anymore.",
    imageUrl: "/public/uploads/posts/f1-2025-redbull.jpg",
    author: "DemoUser030",
    likes: ["DemoUser005", "DemoUser011", "DemoUser018"],
  },
  {
    key: "f1-2025-monaco-qualifying",
    text: "Monaco 2025 proved again that one lap can decide everything. The margins were microscopic, and traffic management in Q3 was almost more important than setup.",
    imageUrl: "",
    author: "DemoUser041",
    likes: ["DemoUser024", "DemoUser044", "DemoUser052"],
  },
  {
    key: "f1-2025-sprint-format",
    text: "The 2025 sprint weekends are still divisive, but they absolutely change parc ferme compromises and make teams less willing to gamble on setup.",
    imageUrl: "",
    author: "DemoUser044",
    likes: ["DemoUser030", "DemoUser041", "DemoUser055"],
  },
  {
    key: "f1-2025-title-picture",
    text: "By the second half of the 2025 F1 season, the title picture feels like a genuine three-team fight instead of a one-car procession.",
    imageUrl: "/public/uploads/posts/f1-2025-title-fight.jpg",
    author: "DemoUser052",
    likes: ["DemoUser005", "DemoUser018", "DemoUser024", "DemoUser041"],
  },
  {
    key: "f1-2026-regulation-reset",
    text: "The 2026 regulation reset might be the biggest competitive shake-up in years. New power unit rules and aero balance should completely reorder the grid.",
    imageUrl: "/public/uploads/posts/f1-2026-regs.jpg",
    author: "DemoUser061",
    likes: ["DemoUser068", "DemoUser072", "DemoUser079", "DemoUser083"],
  },
  {
    key: "f1-2026-power-units",
    text: "F1 2026 will be won as much in the engine shop as in CFD. Whoever nails drivability on the new power units gets a huge head start.",
    imageUrl: "",
    author: "DemoUser068",
    likes: ["DemoUser061", "DemoUser072", "DemoUser087"],
  },
  {
    key: "f1-2026-aero-balance",
    text: "The most interesting part of 2026 so far is how teams are talking about active aero tradeoffs. Straight-line efficiency versus braking stability could define the car philosophy.",
    imageUrl: "",
    author: "DemoUser072",
    likes: ["DemoUser061", "DemoUser068", "DemoUser079"],
  },
  {
    key: "f1-2026-rookies",
    text: "A regulation reset in 2026 could be the perfect moment for rookies to land early, before the established references fully understand the new machinery.",
    imageUrl: "",
    author: "DemoUser079",
    likes: ["DemoUser072", "DemoUser083", "DemoUser088"],
  },
  {
    key: "f1-2026-design-philosophies",
    text: "I expect two very different 2026 design philosophies at launch: one chasing maximum efficiency, the other leaning into predictable tire loading over a stint.",
    imageUrl: "/public/uploads/posts/f1-2026-design.jpg",
    author: "DemoUser083",
    likes: ["DemoUser061", "DemoUser068", "DemoUser079", "DemoUser090"],
  },
  {
    key: "f1-2026-team-order",
    text: "Predicting the 2026 pecking order now is risky, but the teams with the strongest simulation tools should adapt fastest once real track data arrives.",
    imageUrl: "",
    author: "DemoUser087",
    likes: ["DemoUser068", "DemoUser072", "DemoUser083"],
  },
  {
    key: "f1-2026-first-race-expectations",
    text: "The first race of the 2026 F1 season will probably look chaotic: cooling compromises, software learning, and wild setup swings between Friday and Sunday.",
    imageUrl: "/public/uploads/posts/f1-2026-opening-race.jpg",
    author: "DemoUser090",
    likes: ["DemoUser061", "DemoUser079", "DemoUser087", "DemoUser095"],
  },
];

const generatedComments: SeedComment[] = Array.from({ length: COMMENT_COUNT }, (_, index) => {
  const number = index + 1;
  const postKey = seedPosts[index % POST_COUNT]!.key;
  const author = seedUsers[(index * 7 + 3) % USER_COUNT]!.username;
  const opener = commentOpeners[index % commentOpeners.length]!;

  return {
    text: `${opener} Seeded comment ${number} keeps the thread active for ${postKey}.`,
    author,
    postKey,
  };
});

const f1SeedComments: SeedComment[] = [
  {
    text: "Ferrari looked especially convincing on the C3 and C4 compounds in those longer runs.",
    author: "DemoUser019",
    postKey: "f1-2025-preseason-testing",
  },
  {
    text: "Melbourne strategy is always deceptive because the safety car risk changes everything.",
    author: "DemoUser027",
    postKey: "f1-2025-australia",
  },
  {
    text: "That floor seems to have fixed the bounce in medium-speed transitions too.",
    author: "DemoUser033",
    postKey: "f1-2025-ferrari-upgrades",
  },
  {
    text: "McLaren may not top every session, but they rarely throw away points now.",
    author: "DemoUser030",
    postKey: "f1-2025-mclaren-consistency",
  },
  {
    text: "The big difference is they can no longer rescue every weekend with pure pace.",
    author: "DemoUser044",
    postKey: "f1-2025-redbull-recovery",
  },
  {
    text: "Monaco qualifying is basically a season of pressure compressed into one hour.",
    author: "DemoUser052",
    postKey: "f1-2025-monaco-qualifying",
  },
  {
    text: "Sprint weekends also make teams much more conservative with ride height changes.",
    author: "DemoUser055",
    postKey: "f1-2025-sprint-format",
  },
  {
    text: "A real three-team fight would make the last quarter of 2025 incredible.",
    author: "DemoUser041",
    postKey: "f1-2025-title-picture",
  },
  {
    text: "The power unit side of 2026 is what makes predictions so hard right now.",
    author: "DemoUser083",
    postKey: "f1-2026-regulation-reset",
  },
  {
    text: "Drivability out of slow corners could separate the field before outright horsepower does.",
    author: "DemoUser087",
    postKey: "f1-2026-power-units",
  },
  {
    text: "Active aero will be fascinating if teams end up with genuinely different stability compromises.",
    author: "DemoUser090",
    postKey: "f1-2026-aero-balance",
  },
  {
    text: "A reset season is one of the few times rookies can close the gap quickly.",
    author: "DemoUser095",
    postKey: "f1-2026-rookies",
  },
  {
    text: "The simulation departments are going to matter more than ever in those first races.",
    author: "DemoUser068",
    postKey: "f1-2026-team-order",
  },
  {
    text: "The opening weekend in a new regulation era is always half engineering experiment, half race.",
    author: "DemoUser072",
    postKey: "f1-2026-first-race-expectations",
  },
];

const seedComments: SeedComment[] = [...generatedComments, ...f1SeedComments];

const generatedChatMessages: SeedChatMessage[] = Array.from({ length: CHAT_MESSAGE_COUNT }, (_, index) => {
  const senderIndex = index % USER_COUNT;
  const recipientIndex = (senderIndex + (index % 9) + 1) % USER_COUNT;
  const sender = seedUsers[senderIndex]!.username;
  const recipient = seedUsers[recipientIndex]!.username;
  const opener = chatOpeners[index % chatOpeners.length]!;
  const topic = postTopics[(index * 3) % postTopics.length]!;
  const createdAt = new Date(Date.now() - (CHAT_MESSAGE_COUNT - index) * 60_000);

  return {
    sender,
    recipient,
    content: `${opener} the ${topic}? Seeded chat message ${index + 1} keeps conversation history available in development.`,
    read: index % 3 !== 0,
    createdAt,
  };
});

const f1SeedChatMessages: SeedChatMessage[] = [
  {
    sender: "DemoUser005",
    recipient: "DemoUser018",
    content: "Did you see the Ferrari long-run numbers from the 2025 test? They looked properly quick.",
    read: true,
    createdAt: new Date(Date.now() - 45 * 60_000),
  },
  {
    sender: "DemoUser018",
    recipient: "DemoUser005",
    content: "Yes, but I still want to see how they behave in traffic before calling them title favorites.",
    read: true,
    createdAt: new Date(Date.now() - 44 * 60_000),
  },
  {
    sender: "DemoUser061",
    recipient: "DemoUser072",
    content: "The 2026 regulation reset is going to make preseason predictions completely chaotic.",
    read: false,
    createdAt: new Date(Date.now() - 30 * 60_000),
  },
  {
    sender: "DemoUser072",
    recipient: "DemoUser083",
    content: "I’m more curious about active aero tradeoffs than the raw power unit ranking for 2026.",
    read: false,
    createdAt: new Date(Date.now() - 28 * 60_000),
  },
  {
    sender: "DemoUser090",
    recipient: "DemoUser095",
    content: "Opening race weekend in 2026 is going to be pure setup experimentation.",
    read: true,
    createdAt: new Date(Date.now() - 15 * 60_000),
  },
];

const seedChatMessages: SeedChatMessage[] = [...generatedChatMessages, ...f1SeedChatMessages];

const seedMockPosts = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined");
  }

  await mongoose.connect(mongoUri);

  try {
    await ChatMessage.deleteMany({});
    await Comment.deleteMany({});
    await Post.deleteMany({});
    await User.deleteMany({});

    const insertedUsers = await Promise.all(
      seedUsers.map((user) =>
        User.create({
          ...user,
          authProvider: "local",
        }),
      ),
    );

    const usersByUsername = new Map(
      insertedUsers.map((user) => [user.username, user]),
    );

    const insertedPosts = await Promise.all(
      [...seedPosts, ...f1SeedPosts].map((post) =>
        Post.create({
          text: post.text,
          imageUrl: post.imageUrl,
          author: usersByUsername.get(post.author)!._id,
          likes: post.likes.map((username) => usersByUsername.get(username)!._id),
        }),
      ),
    );

    const postsByKey = new Map(
      [...seedPosts, ...f1SeedPosts].map((post, index) => [post.key, insertedPosts[index]]),
    );

    const insertedComments = await Promise.all(
      seedComments.map((comment) =>
        Comment.create({
          text: comment.text,
          author: usersByUsername.get(comment.author)!._id,
          postId: postsByKey.get(comment.postKey)!._id,
        }),
      ),
    );

    const insertedChatMessages = await Promise.all(
      seedChatMessages.map((chat) =>
        ChatMessage.create({
          sender: usersByUsername.get(chat.sender)!._id,
          recipient: usersByUsername.get(chat.recipient)!._id,
          content: chat.content,
          read: chat.read,
          createdAt: chat.createdAt,
          updatedAt: chat.createdAt,
        }),
      ),
    );

    console.log(
      `Seeded ${insertedUsers.length} users, ${insertedPosts.length} posts, ${insertedComments.length} comments, and ${insertedChatMessages.length} chat messages.`,
    );
    console.log(`All demo users share the password: ${DEFAULT_PASSWORD}`);
    console.log("Sample demo logins:");
    for (const user of seedUsers.slice(0, 10)) {
      console.log(`- ${user.email} / ${user.password}`);
    }
  } finally {
    await mongoose.disconnect();
  }
};

seedMockPosts().catch((error) => {
  console.error("Failed to seed demo data:", error);
  process.exit(1);
});