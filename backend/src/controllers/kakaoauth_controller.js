import passport from "passport";
import { Strategy as KakaoStrategy } from "passport-kakao";
import User from "../schemas/user_db.js";
import { randomUUID } from "crypto";
import { signAccessToken } from "../service/auth_service.js";

const KAKAO_SCOPES = ["profile_nickname", "account_email", "talk_calendar", "talk_calendar_task", "talk_message"];

passport.use(
  new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      callbackURL: process.env.KAKAO_REDIRECT_URI,
      passReqToCallback: true,
      scope: KAKAO_SCOPES,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile._json?.kakao_account?.email;
        let user = await User.findOne({ providerId: profile.id });

        if (!user && email) {
          user = await User.findOne({ email });
        }

        const tokenExpiryDelay = 6 * 60 * 60 * 1000; 

        if (!user) {
          if (req.user) {
            req.user.kakaoAccessToken = accessToken;
            if (refreshToken) {
              req.user.kakaoRefreshToken = refreshToken;
            }
            req.user.kakaoTokenExpiry = new Date(Date.now() + tokenExpiryDelay);
            await req.user.save();
            return done(null, req.user);
          } else {
            user = await User.create({
              userID: `user_${randomUUID()}`,
              name: profile.displayName || profile.username || "Kakao User",
              email,
              password: undefined,
              provider: "kakao",
              providerId: profile.id,
              kakaoAccessToken: accessToken,
              kakaoRefreshToken: refreshToken || null,
              kakaoTokenExpiry: new Date(Date.now() + tokenExpiryDelay),
            });
          }
        } else {
          user.kakaoAccessToken = accessToken;
          if (refreshToken) {
            user.kakaoRefreshToken = refreshToken;
          }
          user.kakaoTokenExpiry = new Date(Date.now() + tokenExpiryDelay);
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export const kakaoAuth = async (req, res, next) => {
  const isLinkMode = req.query.link === 'true';
  const baseCallbackURL = process.env.KAKAO_REDIRECT_URI;
  const currentCallbackURL = isLinkMode ? `${baseCallbackURL}?link=true` : baseCallbackURL;

  if (isLinkMode) {
    const authMiddleware = (await import("../middleware/auth_middle.js")).authMiddleware;
    authMiddleware(req, res, (err) => {
      if (err || !req.user) {
        return res.status(401).json({ message: "연동을 위해 로그인이 필요합니다." });
      }
      
      passport.authenticate("kakao", {
        scope: KAKAO_SCOPES,
        callbackURL: currentCallbackURL,
        authType: "reauthenticate",
      })(req, res, next);
    });
  } else {
    passport.authenticate("kakao", {
      scope: KAKAO_SCOPES,
      callbackURL: currentCallbackURL,
      authType: "reauthenticate",
    })(req, res, next);
  }
};

export const kakaoAuthCallback = (req, res, next) => {
  const isLinkMode = req.query.link === 'true';
  const baseCallbackURL = process.env.KAKAO_REDIRECT_URI;
  const currentCallbackURL = isLinkMode ? `${baseCallbackURL}?link=true` : baseCallbackURL;

  passport.authenticate("kakao", {
    failureRedirect: "/api/auth/login",
    session: false,
    callbackURL: currentCallbackURL,
    scope: KAKAO_SCOPES, 
  })(req, res, next);
};

export const kakaoAuthSuccess = (req, res) => {
  if (!req.user) {
    return res.redirect("/api/auth/login");
  }

  const isLinkMode = req.query.link === 'true';
  const isApiRequest = (req.headers['user-agent'] && req.headers['user-agent'].includes('Swagger')) ||
                       req.query.response_type === 'json';

  if (isLinkMode) {
    if (isApiRequest) {
      return res.json({
        success: true,
        message: "카카오 계정 및 톡캘린더 연동 성공",
        user: {
          id: req.user._id,
          email: req.user.email,
          name: req.user.name
        }
      });
    } else {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      return res.redirect(`${clientUrl}/auth/link/kakao/success`);
    }
  } else {
    const token = signAccessToken(req.user);
    if (isApiRequest) {
      return res.json({
        success: true,
        message: "카카오 로그인 성공",
        token: token,
        user: {
          id: req.user._id,
          email: req.user.email,
          name: req.user.name
        }
      });
    } else {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      return res.redirect(`${clientUrl}/auth/kakao/success?token=${token}`);
    }
  }
};