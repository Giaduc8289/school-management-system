import { expect, test } from '@playwright/test';

const testStaffCredentials = {
  email: 'ci-admin@example.test',
  password: 'ci-only-e2e-password',
};

function isAccessTokenResponse(
  value: unknown,
): value is { accessToken: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'accessToken' in value &&
    typeof value.accessToken === 'string'
  );
}

test('staff can create and update a student from the browser UI', async ({
  page,
}) => {
  const studentId = `student-ui-${Date.now()}`;
  const studentCode = `STU-2026-${Date.now().toString().slice(-4)}`;
  const loginResponse = await page.request.post(
    'http://127.0.0.1:3000/auth/login',
    {
      data: testStaffCredentials,
    },
  );
  expect(loginResponse.ok()).toBe(true);
  const loginPayload: unknown = await loginResponse.json();
  expect(isAccessTokenResponse(loginPayload)).toBe(true);
  if (!isAccessTokenResponse(loginPayload)) {
    throw new Error('The test account did not receive an access token.');
  }

  await page.route('**/students**', async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        authorization: `Bearer ${loginPayload.accessToken}`,
      },
    });
  });

  await page.goto('/');

  await page.getByLabel(/^id$/i).fill(studentId);
  await page.getByLabel(/^code$/i).fill(studentCode);
  await page.getByLabel(/full name/i).fill('Synthetic Student One');
  await page.getByLabel(/^email$/i).fill(`${studentId}@example.com`);
  await page.getByLabel(/date of birth/i).fill('2012-05-15');
  await page.getByRole('button', { name: /create student/i }).click();
  await expect(page.getByRole('status')).toContainText(
    /student created successfully/i,
  );

  const studentRow = page.getByRole('row').filter({ hasText: studentId });
  await expect(studentRow).toBeVisible();
  await studentRow.getByRole('button', { name: /edit/i }).click();
  await page.getByLabel(/full name/i).fill('Synthetic Student Two');
  await page.getByLabel(/^email$/i).fill(`${studentId}.updated@example.com`);
  await page.getByRole('button', { name: /save changes/i }).click();

  await expect(page.getByRole('status')).toContainText(
    /student updated successfully/i,
  );
  await expect(studentRow).toContainText('Synthetic Student Two');
  await expect(studentRow).toContainText(`${studentId}.updated@example.com`);
});
