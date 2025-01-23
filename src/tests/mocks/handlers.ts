import { http, HttpResponse } from 'msw';

type SignUpRequestBody = {
  username: string;
  email: string;
  password: string;
  passwordRepeat: string;
};

export const handlers = [
  http.post('/api/1.0/users', async ({ request }) => {
    // Explicitly cast the parsed body to the expected type
    const body = (await request.json()) as SignUpRequestBody;

    const { username, email, password, passwordRepeat } = body;

    // Simulate validation errors
    if (!username) {
      return HttpResponse.json(
        { message: 'Username is required' },
        { status: 400 }
      );
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return HttpResponse.json(
        { message: 'Invalid email address' },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return HttpResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    if (password !== passwordRepeat) {
      return HttpResponse.json(
        { message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // If no validation errors, return success
    return HttpResponse.json({ message: 'Signup successful' }, { status: 200 });
  }),
];