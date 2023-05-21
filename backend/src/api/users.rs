use std::{str::FromStr, fmt::Debug};

use crate::{
    entities::user::{self as user_entity, Entity as User},
    error::AppError, utils::make_app_error, SocketConnectionType,
};
use axum::{
    extract::{State, FromRequestParts, ws::Message},
    Json, http::request::Parts, headers::{authorization::Bearer, Authorization}, TypedHeader, RequestPartsExt
};
use futures::SinkExt;
use sea_orm::{prelude::*, ActiveValue::Set, sea_query::token};
use serde::{Deserialize, Serialize};
use validator::Validate;

use argon2::{
    password_hash::{PasswordHasher, SaltString},
    Argon2, PasswordHash, PasswordVerifier,
};

use rand_core::OsRng;
use once_cell::sync::Lazy;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};

use super::actions::ServerAction;

static KEYS: Lazy<Keys> = Lazy::new(|| {
    let secret = std::env::var("JWT_SECRET").unwrap_or("some very secret key to encrypt".to_string());
    Keys::new(secret.as_bytes())
});

pub struct Keys {
    pub encoding: EncodingKey,
    pub decoding: DecodingKey,
}

impl Keys {
    fn new(secret: &[u8]) -> Self {
        Self {
            encoding: EncodingKey::from_secret(secret),
            decoding: DecodingKey::from_secret(secret),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: i32,
    exp: usize,
}


#[derive(Deserialize, Validate)]
pub struct CreateUser {
    #[validate(length(min = 3), length(max = 20))]
    login: String,

    #[validate(length(min = 6), length(max = 20))]
    password: String,

    #[validate(length(min = 3), length(max = 20))]
    firstname: String,

    #[validate(length(min = 3), length(max = 20))]
    lastname: String,

    #[validate(length(min = 3), length(max = 20))]
    patronymic: String,
}

enum UsersError {
    LoginBusy,
    UserNotFound,
    PasswordIncorrect
}

#[derive(Serialize)]
#[serde(rename_all(serialize = "camelCase"))]
pub struct TokenResponse {
    access_token: String,
    token_type: String
}

pub async fn create_user(
    State(db): State<DatabaseConnection>,
    Json(user): Json<CreateUser>,
) -> Result<Json<TokenResponse>, AppError> {
    user.validate()?;

    let existed_user = User::find()
        .filter(user_entity::Column::Login.contains(&user.login))
        .one(&db)
        .await?;

    if existed_user.is_some() {
        return Err(make_app_error(UsersError::LoginBusy as i32));
    }

    let password = user.password.as_bytes();
    let salt = SaltString::generate(&mut OsRng);

    let argon2 = Argon2::default();

    let password_hash = argon2.hash_password(password, &salt).expect("Hashing password").to_string();

    let new_user = user_entity::ActiveModel {
        login: Set(user.login),
        password: Set(password_hash),
        firstname: Set(user.firstname),
        lastname: Set(user.lastname),
        patronymic: Set(user.patronymic),
        is_playing: Set(false),
        ..Default::default()
    };

    let new_user = User::insert(new_user).exec(&db).await?;

    let claims = Claims {
        sub: new_user.last_insert_id,
        exp: 2000000000, // May 2033
    };

    let token = encode(&Header::default(), &claims, &KEYS.encoding)
        .map_err(|_| AppError::Internal)?;

    let response = TokenResponse {
        access_token: token,
        token_type: "Bearer".to_string()
    };

    Ok(Json(response))
}


#[derive(Deserialize)]
pub struct LoginUser {
    login: String,
    password: String
}

pub async fn login(State(db): State<DatabaseConnection>, login_user: Json<LoginUser>) -> Result<Json<TokenResponse>, AppError> {
    let found_user = User::find().filter(user_entity::Column::Login.contains(&login_user.login)).one(&db).await?;
    if let Some(user) = found_user {
        let argon2 = Argon2::default();

        let parsed_hash = PasswordHash::new(&user.password).unwrap();

        if argon2.verify_password(login_user.password.as_bytes(), &parsed_hash).is_err() {
            return Err(make_app_error(UsersError::PasswordIncorrect as i32))
        }

        let claims = Claims {
            sub: user.id,
            exp: 2000000000, // May 2033
        };

        let token = encode(&Header::default(), &claims, &KEYS.encoding)
            .map_err(|_| AppError::Internal)?;

        let response = TokenResponse {
            access_token: token,
            token_type: "Bearer".to_string()
        };

        Ok(Json(response))

                
    } else {
        Err(make_app_error(UsersError::UserNotFound as i32))
    }
    
}



#[axum::async_trait]
impl<S> FromRequestParts<S> for Claims
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        // Extract the token from the authorization header
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| AppError::Unauthorized)?;
        // Decode the user data
        let token_data = decode::<Claims>(bearer.token(), &KEYS.decoding, &Validation::default())
            .map_err(|_| AppError::Unauthorized)?;

        Ok(token_data.claims)
    }
}

pub async fn send_uuid(mut token: String, uuid: String, connections: SocketConnectionType)  {
    token.remove_matches("Bearer ");
    let token = decode::<Claims>(&token, &KEYS.decoding, &Validation::default());

    if let Ok(token) = token {
        let uuid = uuid::Uuid::from_str(&uuid);

        if let Ok(uuid) = uuid {
            for mut conn in connections.lock().await.iter_mut() {
                if conn.uuid == uuid {
                    conn.user_id = Some(token.claims.sub);
                    conn.socket.send(Message::Text(serde_json::to_string(&ServerAction::ConfirmAuth {}).unwrap()));
                }            
            } 
        }
    } else {
        tracing::warn!("Error decoding token")
    }
}