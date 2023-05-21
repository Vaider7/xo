use axum::{
    http::StatusCode,
    response::{IntoResponse, Response}, Json,
};
use sea_orm::error::DbErr;
use validator::ValidationErrors;

pub enum AppError {
    Unauthorized,
    Internal,
    DBError,
    ValidationError(String),
    CustomError(StatusCode, Json<serde_json::Value>),
}

impl From<DbErr> for AppError {
    fn from(_value: DbErr) -> Self {
        AppError::DBError
    }
}

impl From<ValidationErrors> for AppError {
    fn from(_value: ValidationErrors) -> Self {
        AppError::ValidationError("Invalid payload".to_string())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        if let AppError::CustomError(status_code, value) = self {
            return (status_code, value).into_response();
        }
        
        let response = match self {
            AppError::DBError => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal Server Error".to_string(),
            ),
            AppError::ValidationError(error_message) => (StatusCode::BAD_REQUEST, error_message),
            AppError::CustomError(_, _) => unreachable!(),
            AppError::Internal => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized".to_string()),
        };
        response.into_response()
    }
}
