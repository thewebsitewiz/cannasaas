interface BrandingParams {
  dispensaryName: string;
  logoUrl?: string;
  primaryColor: string;
}

function brandedHeader(branding: BrandingParams): string {
  return `<tr><td style="background:${branding.primaryColor};padding:24px;text-align:center;">
    ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="${branding.dispensaryName}" height="40"/>` : `<h1 style="color:#fff;margin:0;font-size:24px;">${branding.dispensaryName}</h1>`}
  </td></tr>`;
}

function brandedFooter(branding: BrandingParams): string {
  return `<tr><td style="padding:24px;background:#f9f9f9;text-align:center;color:#999;font-size:12px;">
    &copy; ${new Date().getFullYear()} ${branding.dispensaryName}. All rights reserved.
  </td></tr>`;
}

function wrap(branding: BrandingParams, body: string): string {
  return `<!DOCTYPE html>
  <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 0;">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
    ${brandedHeader(branding)}
    <tr><td style="padding:32px;">${body}</td></tr>
    ${brandedFooter(branding)}
  </table></td></tr></table></body></html>`;
}

export function orderConfirmationEmail(data: {
  dispensaryName: string;
  logoUrl?: string;
  primaryColor: string;
  orderId: string;
  orderTotal: string;
  items: { name: string; qty: number; price: string }[];
  estimatedTime: string;
  orderType: string;
}): string {
  const itemsHtml = data.items.map(item => `<tr style="border-bottom:1px solid #f0f0f0;">
    <td style="padding:12px 0;">${item.name}</td>
    <td style="text-align:center;padding:12px 8px;">${item.qty}</td>
    <td style="text-align:right;padding:12px 0;">$${item.price}</td>
  </tr>`).join('');

  return wrap(data, `
    <h2 style="margin:0 0 16px;">Order Confirmed!</h2>
    <p style="color:#666;margin:0 0 24px;">Order #${data.orderId.slice(0, 8).toUpperCase()} &mdash; ${data.orderType}</p>
    <table width="100%" style="border-collapse:collapse;">
      <tr style="border-bottom:1px solid #eee;">
        <th style="text-align:left;padding:8px 0;color:#888;font-size:12px;">ITEM</th>
        <th style="text-align:center;padding:8px;color:#888;font-size:12px;">QTY</th>
        <th style="text-align:right;padding:8px 0;color:#888;font-size:12px;">PRICE</th>
      </tr>
      ${itemsHtml}
      <tr><td colspan="2" style="padding:16px 0;font-weight:bold;">Total</td>
        <td style="text-align:right;padding:16px 0;font-weight:bold;">$${data.orderTotal}</td></tr>
    </table>
    <div style="margin-top:24px;padding:16px;background:#f9f9f9;border-radius:6px;">
      <p style="margin:0;font-size:14px;color:#666;">Estimated ${data.orderType === 'delivery' ? 'delivery' : 'pickup'}: <strong>${data.estimatedTime}</strong></p>
    </div>
  `);
}

export function deliveryUpdateEmail(data: BrandingParams & {
  orderId: string;
  status: string;
  estimatedTime: string;
  driverName?: string;
}): string {
  return wrap(data, `
    <h2 style="margin:0 0 16px;">Delivery Update</h2>
    <p style="color:#666;margin:0 0 16px;">Order #${data.orderId.slice(0, 8).toUpperCase()}</p>
    <div style="padding:20px;background:#f0fdf4;border-radius:8px;text-align:center;">
      <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#166534;">${data.status}</p>
      <p style="margin:0;color:#666;">Estimated arrival: <strong>${data.estimatedTime}</strong></p>
      ${data.driverName ? `<p style="margin:8px 0 0;color:#888;font-size:14px;">Driver: ${data.driverName}</p>` : ''}
    </div>
  `);
}

export function welcomeEmail(data: BrandingParams & {
  customerName: string;
  signUpBonus?: string;
}): string {
  return wrap(data, `
    <h2 style="margin:0 0 16px;">Welcome, ${data.customerName}!</h2>
    <p style="color:#666;margin:0 0 24px;">Thanks for joining ${data.dispensaryName}. We're excited to have you.</p>
    ${data.signUpBonus ? `<div style="padding:20px;background:${data.primaryColor}10;border-radius:8px;text-align:center;border:1px solid ${data.primaryColor}30;">
      <p style="margin:0;font-size:16px;font-weight:bold;color:${data.primaryColor};">Your sign-up bonus: ${data.signUpBonus}</p>
    </div>` : ''}
    <p style="color:#666;margin:24px 0 0;">Browse our menu and place your first order today.</p>
  `);
}

export function loyaltyMilestoneEmail(data: BrandingParams & {
  customerName: string;
  milestone: string;
  currentPoints: number;
  tierName: string;
  reward?: string;
}): string {
  return wrap(data, `
    <h2 style="margin:0 0 16px;">Congratulations, ${data.customerName}!</h2>
    <p style="color:#666;margin:0 0 24px;">You've reached a new milestone in our loyalty program.</p>
    <div style="padding:24px;background:#fefce8;border-radius:8px;text-align:center;">
      <p style="margin:0 0 8px;font-size:14px;color:#854d0e;">MILESTONE REACHED</p>
      <p style="margin:0 0 12px;font-size:22px;font-weight:bold;color:#713f12;">${data.milestone}</p>
      <p style="margin:0;color:#666;">Tier: <strong>${data.tierName}</strong> &bull; Points: <strong>${data.currentPoints}</strong></p>
    </div>
    ${data.reward ? `<p style="margin:24px 0 0;text-align:center;font-size:16px;color:${data.primaryColor};font-weight:bold;">Reward unlocked: ${data.reward}</p>` : ''}
  `);
}

export function backInStockEmail(data: BrandingParams & {
  customerName: string;
  productName: string;
  productImage?: string;
  productPrice: string;
  productUrl: string;
}): string {
  return wrap(data, `
    <h2 style="margin:0 0 16px;">Back in Stock!</h2>
    <p style="color:#666;margin:0 0 24px;">Hey ${data.customerName}, great news &mdash; a product you were watching is available again.</p>
    <div style="padding:20px;border:1px solid #e5e7eb;border-radius:8px;">
      ${data.productImage ? `<img src="${data.productImage}" alt="${data.productName}" style="width:100%;max-height:200px;object-fit:cover;border-radius:6px;margin-bottom:16px;"/>` : ''}
      <h3 style="margin:0 0 8px;">${data.productName}</h3>
      <p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:${data.primaryColor};">$${data.productPrice}</p>
      <a href="${data.productUrl}" style="display:inline-block;padding:12px 24px;background:${data.primaryColor};color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Shop Now</a>
    </div>
  `);
}

export function weeklyDigestEmail(data: BrandingParams & {
  customerName: string;
  newProducts: number;
  activeDeals: number;
  pointsBalance: number;
  featuredItems: { name: string; price: string }[];
}): string {
  const featured = data.featuredItems.map(item =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">${item.name}</td><td style="text-align:right;padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:bold;">$${item.price}</td></tr>`
  ).join('');

  return wrap(data, `
    <h2 style="margin:0 0 16px;">Your Weekly Update</h2>
    <p style="color:#666;margin:0 0 24px;">Hi ${data.customerName}, here's what's new at ${data.dispensaryName}.</p>
    <div style="display:flex;gap:16px;margin-bottom:24px;">
      <div style="flex:1;padding:16px;background:#f0fdf4;border-radius:8px;text-align:center;">
        <p style="margin:0;font-size:24px;font-weight:bold;color:#166534;">${data.newProducts}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#666;">New Products</p>
      </div>
      <div style="flex:1;padding:16px;background:#eff6ff;border-radius:8px;text-align:center;">
        <p style="margin:0;font-size:24px;font-weight:bold;color:#1e40af;">${data.activeDeals}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#666;">Active Deals</p>
      </div>
      <div style="flex:1;padding:16px;background:#fefce8;border-radius:8px;text-align:center;">
        <p style="margin:0;font-size:24px;font-weight:bold;color:#854d0e;">${data.pointsBalance}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#666;">Your Points</p>
      </div>
    </div>
    ${data.featuredItems.length > 0 ? `
    <h3 style="margin:0 0 12px;">Featured This Week</h3>
    <table width="100%" style="border-collapse:collapse;">${featured}</table>` : ''}
  `);
}
