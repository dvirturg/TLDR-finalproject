"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const postModel_1 = __importDefault(require("../models/postModel"));
dotenv_1.default.config({ path: ".env.dev" });
const mockAuthors = [
    new mongoose_1.default.Types.ObjectId(),
    new mongoose_1.default.Types.ObjectId(),
    new mongoose_1.default.Types.ObjectId(),
];
const mockPosts = [
    {
        text: "Just shipped the first version of the TL;DR backend.",
        imageUrl: "",
        author: mockAuthors[0],
        likes: [mockAuthors[1]],
    },
    {
        text: "Testing image upload flow with a seeded post.",
        imageUrl: "/public/uploads/posts/mock-sunrise.jpg",
        author: mockAuthors[1],
        likes: [mockAuthors[0], mockAuthors[2]],
    },
    {
        text: "Mongoose connection is stable, next step is cleaning the listeners.",
        imageUrl: "",
        author: mockAuthors[2],
        likes: [],
    },
    {
        text: "Swagger for posts is now wired up and ready for manual review.",
        imageUrl: "/public/uploads/posts/mock-swagger-board.jpg",
        author: mockAuthors[0],
        likes: [mockAuthors[2]],
    },
    {
        text: "This mock post exists so frontend timelines have enough volume to render properly.",
        imageUrl: "",
        author: mockAuthors[1],
        likes: [mockAuthors[0]],
    },
];
const seedMockPosts = async () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error("MONGO_URI is not defined");
    }
    await mongoose_1.default.connect(mongoUri);
    try {
        await postModel_1.default.deleteMany({});
        const insertedPosts = await postModel_1.default.insertMany(mockPosts);
        console.log(`Inserted ${insertedPosts.length} mock posts`);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
};
seedMockPosts().catch((error) => {
    console.error("Failed to seed mock posts:", error);
    process.exit(1);
});
