import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { User, IUser } from '../models/User';

// Twitter OAuth configuration - only configure if credentials are provided
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: process.env.TWITTER_CALLBACK_URL || 'http://localhost:3001/api/auth/twitter/callback',
    includeEmail: true
  }, async (token: string, tokenSecret: string, profile: any, done: any) => {
  try {
    // Check if user already exists with Twitter ID
    let user = await User.findOne({ twitterId: profile.id });
    
    if (user) {
      // Update existing user's last login
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }

    // Check if user exists with same email
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        // Link Twitter account to existing user
        user.twitterId = profile.id;
        user.twitterUsername = profile.username;
        user.lastLogin = new Date();
        if (!user.emailVerified && email) {
          user.emailVerified = true; // Twitter provides verified emails
        }
        await user.save();
        return done(null, user);
      }
    }

    // Create new user
    const newUser = new User({
      twitterId: profile.id,
      twitterUsername: profile.username,
      email: email ? email.toLowerCase() : `twitter_${profile.id}@temp.seek.com`,
      firstName: profile.displayName ? profile.displayName.split(' ')[0] : profile.username,
      lastName: profile.displayName ? profile.displayName.split(' ').slice(1).join(' ') || 'User' : 'User',
      emailVerified: Boolean(email), // Twitter emails are pre-verified
      role: 'user',
      lastLogin: new Date()
    });

    await newUser.save();
    done(null, newUser);

  } catch (error) {
    console.error('Twitter OAuth error:', error);
    done(error, null);
  }
}));
} else {
  console.log('Twitter OAuth not configured - skipping Twitter strategy setup');
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;