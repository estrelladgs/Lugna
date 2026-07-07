from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refreshToken: str


class GoogleAuthRequest(BaseModel):
    idToken: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    createdAt: str

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    name: str
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    newPassword: str


class MessageOut(BaseModel):
    message: str


class TokensOut(BaseModel):
    accessToken: str
    refreshToken: str


class AuthResponse(BaseModel):
    user: UserOut
    tokens: TokensOut
