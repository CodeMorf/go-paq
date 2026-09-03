import { test, expect } from '@playwright/test';

test('las superficies públicas cargan el build SPA', async ({ page }) => {
  for (const path of ['/', '/servicios', '/rastreo', '/cotizar', '/sucursales', '/nosotros', '/contacto', '/super-admin/login', '/portal/login', '/sucursal/login', '/driver/login']) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Error en la Aplicación');
  }
});

test('el portal de cliente no desborda en viewport móvil', async ({ page }) => {
  await page.goto('/portal/login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByAltText(/GoPaq/).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Portal de clientes' })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth + 1);
});

test('el login de administrador no ofrece acceso demo ni selector cruzado', async ({ page }) => {
  await page.goto('/super-admin/login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Centro administrativo' })).toBeVisible();
  await expect(page.getByText('Acceso de prueba')).toHaveCount(0);
  await expect(page.getByText('Cambiar área')).toHaveCount(0);
});
