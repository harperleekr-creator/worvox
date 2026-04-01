/**
 * Standardized Error Handler for WorVox API
 * 
 * Provides consistent error responses across all API endpoints
 */

export interface StandardErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface StandardSuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  timestamp: string;
}

/**
 * Standard Error Codes
 */
export const ErrorCodes = {
  // Authentication & Authorization
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
  
  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  VALIDATION_MISSING_FIELD: 'VALIDATION_MISSING_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  
  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Business Logic
  USAGE_LIMIT_EXCEEDED: 'USAGE_LIMIT_EXCEEDED',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  
  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  OPENAI_API_ERROR: 'OPENAI_API_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // Generic
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
} as const;

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any
): StandardErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string
): StandardSuccessResponse<T> {
  return {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
    timestamp: new Date().toISOString()
  };
}

/**
 * Common error responses (pre-built for convenience)
 */
export const CommonErrors = {
  authRequired: () => createErrorResponse(
    ErrorCodes.AUTH_REQUIRED,
    '로그인이 필요합니다.'
  ),
  
  invalidCredentials: () => createErrorResponse(
    ErrorCodes.AUTH_INVALID_CREDENTIALS,
    '이메일 또는 비밀번호가 올바르지 않습니다.'
  ),
  
  userNotFound: () => createErrorResponse(
    ErrorCodes.RESOURCE_NOT_FOUND,
    '사용자를 찾을 수 없습니다.'
  ),
  
  emailExists: (email: string) => createErrorResponse(
    ErrorCodes.RESOURCE_ALREADY_EXISTS,
    '이미 사용 중인 이메일입니다.',
    { email }
  ),
  
  missingField: (field: string) => createErrorResponse(
    ErrorCodes.VALIDATION_MISSING_FIELD,
    `필수 항목이 누락되었습니다: ${field}`,
    { field }
  ),
  
  usageLimitExceeded: (feature: string, limit: number) => createErrorResponse(
    ErrorCodes.USAGE_LIMIT_EXCEEDED,
    `${feature} 사용 한도를 초과했습니다. (${limit}회)`,
    { feature, limit }
  ),
  
  subscriptionRequired: (feature: string) => createErrorResponse(
    ErrorCodes.SUBSCRIPTION_REQUIRED,
    `${feature}는 프리미엄 구독이 필요합니다.`,
    { feature }
  ),
  
  databaseError: (operation: string) => createErrorResponse(
    ErrorCodes.DATABASE_ERROR,
    '데이터베이스 오류가 발생했습니다.',
    { operation }
  ),
  
  internalError: () => createErrorResponse(
    ErrorCodes.INTERNAL_SERVER_ERROR,
    '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  ),
};

/**
 * HTTP Status Code mapping
 */
export function getHTTPStatus(errorCode: string): number {
  const statusMap: Record<string, number> = {
    // 400 Bad Request
    [ErrorCodes.VALIDATION_FAILED]: 400,
    [ErrorCodes.VALIDATION_MISSING_FIELD]: 400,
    [ErrorCodes.VALIDATION_INVALID_FORMAT]: 400,
    [ErrorCodes.BAD_REQUEST]: 400,
    
    // 401 Unauthorized
    [ErrorCodes.AUTH_REQUIRED]: 401,
    [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 401,
    [ErrorCodes.AUTH_TOKEN_EXPIRED]: 401,
    
    // 403 Forbidden
    [ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS]: 403,
    [ErrorCodes.SUBSCRIPTION_REQUIRED]: 403,
    [ErrorCodes.SUBSCRIPTION_EXPIRED]: 403,
    
    // 404 Not Found
    [ErrorCodes.RESOURCE_NOT_FOUND]: 404,
    
    // 409 Conflict
    [ErrorCodes.RESOURCE_ALREADY_EXISTS]: 409,
    [ErrorCodes.RESOURCE_CONFLICT]: 409,
    
    // 429 Too Many Requests
    [ErrorCodes.USAGE_LIMIT_EXCEEDED]: 429,
    
    // 500 Internal Server Error
    [ErrorCodes.DATABASE_ERROR]: 500,
    [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 500,
    [ErrorCodes.OPENAI_API_ERROR]: 500,
    [ErrorCodes.INTERNAL_SERVER_ERROR]: 500,
    
    // 405 Method Not Allowed
    [ErrorCodes.METHOD_NOT_ALLOWED]: 405,
  };
  
  return statusMap[errorCode] || 500;
}
