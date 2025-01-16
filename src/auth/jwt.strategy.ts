import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),  // Extract token from Authorization header
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,  // Ensure this is the same secret key used by Rails to sign the JWT
    });
  }

  async validate(payload: any) {
    // You can add additional logic to validate the user if needed.
    return { userId: payload.user_id, email: payload.email };
  }
}
