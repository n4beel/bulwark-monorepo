import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    // GitHub OAuth fields
    @Prop({ sparse: true, unique: true })
    githubId?: number; // GitHub user ID

    @Prop()
    githubUsername?: string; // GitHub login

    // Google OAuth fields
    @Prop({ sparse: true, unique: true })
    googleId?: string; // Google user ID

    @Prop()
    googleEmail?: string; // Google email

    // Common fields
    @Prop()
    email?: string;

    @Prop()
    name?: string;

    @Prop()
    avatarUrl?: string;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create compound index to ensure at least one OAuth provider is connected
UserSchema.index(
    { githubId: 1 },
    { unique: true, sparse: true }
);

UserSchema.index(
    { googleId: 1 },
    { unique: true, sparse: true }
);

