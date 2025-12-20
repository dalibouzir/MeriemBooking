# Crawl Summary Report - BEFORE
**Date:** December 20, 2025  
**Site:** https://www.fittrahmoms.com/

## Endpoints Status

| Path | Status | Content-Type | Title | Canonical |
|------|--------|--------------|-------|-----------|
| / | 200 | text/html | Fittrah Moms \| فطرة الأمهات | https://www.fittrahmoms.com |
| /products | 200 | text/html | المكتبة \| ملفات ومواد تعليمية مجانية | https://www.fittrahmoms.com/products |
| /booking | 200 | text/html | احجزي جلستك \| جلسة إرشاد فردية | https://www.fittrahmoms.com/booking |
| /train-program | 200 | text/html | Fittrah Moms \| فطرة الأمهات | ⚠️ https://www.fittrahmoms.com (wrong) |
| /faq | 200 | text/html | الأسئلة الشائعة \| فطرة الأمهات | ⚠️ https://www.fittrahmoms.com (wrong) |
| /privacy | 200 | text/html | سياسة الخصوصية | https://www.fittrahmoms.com/privacy |
| /policy | 200 | text/html | الشروط والأحكام | https://www.fittrahmoms.com/policy |
| /sitemap.xml | 200 | application/xml | N/A | N/A |
| /robots.txt | 200 | text/plain | N/A | N/A |

## Issues Found

### Critical
1. **robots.txt blocks /_next/**
   - `Disallow: /_next/` prevents search engines from rendering JavaScript
   - This breaks client-side rendering for crawlers

### Major
2. **/train-program missing page-specific metadata**
   - Uses root layout canonical instead of page-specific
   - Missing unique meta description

3. **/faq missing proper canonical**
   - Uses root layout canonical instead of page-specific
   - Has title but missing description

### Minor
4. **Non-www to www redirect uses 307 instead of 308**
   - Currently: https://fittrahmoms.com → https://www.fittrahmoms.com (307 Temporary)
   - Should be: 308 Permanent for SEO

## Sitemap Analysis
- ✅ Valid XML structure
- ✅ Contains 7 URLs
- ✅ Correct canonical host (www.fittrahmoms.com)
- ✅ Includes priority and changefreq attributes

## Broken Links
None detected.
