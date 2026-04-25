from pydantic import BaseModel


class CustomerFeatures(BaseModel):
    income_range: str
    hh_size: int
    children: int


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class BasketItems(BaseModel):
    commodities: list[str]

