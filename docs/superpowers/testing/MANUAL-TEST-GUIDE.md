# Quick Manual Testing Guide - Public Links Feature

**Dev Server**: http://localhost:5174 (RUNNING)
**Test Account**: Your authenticated account
**Test Location**: Supermaxi Mall del Sol
**Test Public URL**: http://localhost:5174/p/demo-mall-del-sol-2026

---

## Quick 5-Minute Test Flow

### 1. ShareLocationModal (2 minutes)
1. Login to app → Navigate to "Supermaxi Mall del Sol"
2. Click "Compartir" button
3. ✓ Modal opens with link and QR code
4. Click "Copiar" → ✓ Shows "Copiado" confirmation
5. Click "Generar Código QR" → ✓ Downloads PNG file
6. Click "Vista Completa" → ✓ Opens new tab

### 2. Public Page - Valid Token (2 minutes)
1. Open new incognito window
2. Visit: http://localhost:5174/p/demo-mall-del-sol-2026
3. ✓ Location name and address display
4. ✓ See sections: "Permisos Vigentes (3)" and "Permisos por Vencer (1)"
5. ✓ Each permit card shows type, issuer, dates, status badge
6. ✓ Footer shows timestamp and "Verificado por EnRegla"

### 3. Public Page - Invalid Token (30 seconds)
1. Visit: http://localhost:5174/p/invalid-token-123
2. ✓ Error page shows "Link No Válido"

### 4. Analytics (30 seconds)
1. Refresh public page 2-3 times
2. Check database view_count incremented

### 5. Responsive (1 minute)
1. Resize browser to mobile (375px)
2. ✓ Modal and public page stack vertically
3. Resize to tablet (768px)
4. ✓ Permit cards show in 2-column grid

---

## SQL Queries for Verification

### Check View Analytics
```sql
SELECT 
  token,
  view_count,
  last_viewed_at,
  is_active
FROM public_links 
WHERE token = 'demo-mall-del-sol-2026';
```

### Expected Results After Testing
- view_count should increase with each visit
- last_viewed_at should update to recent timestamp

---

## Known Limitations in Test Data

1. **No Documents**: Test permits have no documents attached
   - "Ver documento" button won't appear
   - To test: Upload a PDF to any permit in the test location

2. **Limited Statuses**: Only vigente and por_vencer in test data
   - No vencidos or pendientes sections will show
   - This is normal and matches the test data

---

## What Good Looks Like

### ShareLocationModal
- Clean, centered modal with gray overlay
- QR code displays clearly
- Preview shows location info and permit counts
- Buttons are responsive and show feedback
- Modal scrolls if content overflows

### PublicVerificationPage
- Clean header with EnRegla branding
- Location name prominent at top
- Permits grouped by status with counts
- Cards show colored status badges
- Professional footer with timestamp
- No authentication required
- Mobile-friendly layout

---

## Quick Troubleshooting

### Modal doesn't open
- Check browser console for errors
- Verify location has ID: 550e8400-e29b-41d4-a716-446655440002

### Public page shows error
- Verify token is correct: demo-mall-del-sol-2026
- Check dev server is running
- Look at network tab for API errors

### QR code doesn't download
- Check browser allows downloads
- Try different browser if blocked

### View count doesn't increment
- Check browser console for errors
- Verify network request to getPublicLinkData succeeds
- May need to refresh database query

---

## Report Results

After testing, update the test results document:
- Check off completed items
- Note any bugs or issues found
- Capture screenshots of any problems
- Update final status (DONE / DONE_WITH_CONCERNS / BLOCKED)
