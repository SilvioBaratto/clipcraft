import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiStandardResponses() {
  return applyDecorators(
    ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function ApiContentGenerationResponses() {
  return applyDecorators(
    ApiResponse({ status: 201, description: 'Content generated successfully' }),
    ApiResponse({ status: 400, description: 'Bad Request - Invalid generation parameters' }),
    ApiResponse({ status: 500, description: 'Internal Server Error - AI generation failed' }),
  );
}
