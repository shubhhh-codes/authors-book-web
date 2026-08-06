import { ContactFormSchema, parseRequestBody, errorResponse, successResponse, getSafeErrorMessage } from '@/lib/validations';

export async function POST(request: Request): Promise<Response> {
  try {
    const { name, email, phone, message } = await parseRequestBody(request, ContactFormSchema);

    console.log('[Contact Submission]', { name, email, phone, timestamp: new Date().toISOString() });

    return successResponse({
      success: true,
      message: 'Thank you for reaching out! We will get back to you within 24 hours.',
    });
  } catch (error) {
    console.error('Contact API error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
