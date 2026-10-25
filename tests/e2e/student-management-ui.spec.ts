import { expect, test } from '@playwright/test';

test('staff can create and update a student from the browser UI', async ({
  page,
}) => {
  const studentId = `student-ui-${Date.now()}`;
  const studentCode = `STU-2026-${Date.now().toString().slice(-4)}`;

  await page.goto(process.env.FRONTEND_URL ?? 'http://localhost:5173');

  await page.getByLabel(/^id$/i).fill(studentId);
  await page.getByLabel(/^code$/i).fill(studentCode);
  await page.getByLabel(/full name/i).fill('Nguyen Van An');
  await page.getByLabel(/^email$/i).fill(`${studentId}@example.com`);
  await page.getByLabel(/date of birth/i).fill('2012-05-15');
  await page.getByRole('button', { name: /create student/i }).click();
  await expect(page.getByRole('status')).toContainText(
    /student created successfully/i,
  );

  const studentRow = page.getByRole('row').filter({ hasText: studentId });
  await expect(studentRow).toBeVisible();
  await studentRow.getByRole('button', { name: /edit/i }).click();
  await page.getByLabel(/full name/i).fill('Nguyen Thi Binh');
  await page.getByLabel(/^email$/i).fill(`${studentId}.updated@example.com`);
  await page.getByRole('button', { name: /save changes/i }).click();

  await expect(page.getByRole('status')).toContainText(
    /student updated successfully/i,
  );
  await expect(studentRow).toContainText('Nguyen Thi Binh');
  await expect(studentRow).toContainText(`${studentId}.updated@example.com`);
});
