import dotenv from "dotenv";
dotenv.config(); // подгружаем .env

interface Config {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenSecret: string;
  refreshTokenExpiresIn: string;
  port: number;
}

const config: Config = {
  jwtSecret: process.env.JWT_SECRET || "default_jwt_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  refreshTokenSecret:
    process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  port: Number(process.env.PORT) || 3000,
};

export default config;
