import { http, HttpResponse } from 'msw';

export const handlers = [
  // API 핸들러 예시
  http.get('/api/user/profile', () => {
    return HttpResponse.json({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        fullName: 'Test User',
      },
    });
  }),
];
