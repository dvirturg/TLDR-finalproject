import dotenv from "dotenv";
import mongoose from "mongoose";
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

const USER_COUNT = 100;
const POST_COUNT = 200;
const COMMENT_COUNT = 300;
const DEFAULT_PASSWORD = "Password123!";

const postTopics = [
  "backend auth flow",
  "frontend feed polish",
  "comment interactions",
  "profile page refresh",
  "search relevance tuning",
  "image upload testing",
  "notifications cleanup",
  "recommendation engine",
  "swagger review",
  "socket message delivery",
];

const postOpeners = [
  "Wrapped up",
  "Investigating",
  "Improved",
  "Shipping",
  "Refining",
  "Reworking",
  "Testing",
  "Documenting",
  "Validating",
  "Polishing",
];

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

const seedPosts: SeedPost[] = Array.from({ length: POST_COUNT }, (_, index) => {
  const number = index + 1;
  const author = seedUsers[index % USER_COUNT]!.username;
  const topic = postTopics[index % postTopics.length]!;
  const opener = postOpeners[index % postOpeners.length]!;
  const hasImage = index % 5 === 0;

  return {
    key: `post-${String(number).padStart(3, "0")}`,
    text: `${opener} the ${topic} work in sprint ${Math.floor(index / 10) + 1}. Seeded post ${number} exists to keep the feed, profile pages, and recommendation views busy during development.`,
    imageUrl: hasImage ? `/public/uploads/posts/demo-${String(number).padStart(3, "0")}.jpg` : "",
    author,
    likes: buildLikes(index % USER_COUNT, index),
  };
});

const seedComments: SeedComment[] = Array.from({ length: COMMENT_COUNT }, (_, index) => {
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

const seedMockPosts = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined");
  }

  await mongoose.connect(mongoUri);

  try {
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
      seedPosts.map((post) =>
        Post.create({
          text: post.text,
          imageUrl: post.imageUrl,
          author: usersByUsername.get(post.author)!._id,
          likes: post.likes.map((username) => usersByUsername.get(username)!._id),
        }),
      ),
    );

    const postsByKey = new Map(
      seedPosts.map((post, index) => [post.key, insertedPosts[index]]),
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

    console.log(
      `Seeded ${insertedUsers.length} users, ${insertedPosts.length} posts, and ${insertedComments.length} comments.`,
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
