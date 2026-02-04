import { betterAuth } from "better-auth";
import {mongodbAdapter} from "better-auth/adapters/mongodb";
import {connectToDatabase} from "@/database/mongoose";
import {nextCookies} from "better-auth/next-js";


let authInstance: ReturnType<typeof betterAuth> | null = null;


export const getAuth = async () => {
    if(authInstance) {
        return authInstance;
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection;

    if (!db) {
        throw new Error("MongoDB connection not found!");
    }

    authInstance = betterAuth({
        database: mongodbAdapter(db as any),
       secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
        },
        plugins: [nextCookies()],

    });

    return authInstance;
};

// Build-safe auth export
// During build, return a mock that will work for static generation
// At runtime, it will properly initialize
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                     process.env.NEXT_PHASE === 'phase-development-build' ||
                     !process.env.MONGODB_URI;

if (isBuildPhase) {
    console.log('🔧 Build phase detected - using mock auth');
}

export const auth = isBuildPhase 
    ? ({
        api: {
            getSession: async () => null,
            signUpEmail: async () => ({ user: null }),
            signInEmail: async () => ({ user: null }),
            signOut: async () => {},
        }
    } as unknown as ReturnType<typeof betterAuth>)
    : await getAuth();
