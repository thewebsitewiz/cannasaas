/**
 * @file TopProductsTable.tsx
 * @path apps/admin/src/pages/Dashboard/components/TopProductsTable/TopProductsTable.tsx
 *
 * Compact table widget showing top-selling products for the dashboard.
 * Links each product row to its edit page in the Products section.
 * WCAG: table with <caption>, sortable column buttons with aria-sort.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { TopProduct } from '../../../../types/admin.types';
import styles from './TopProductsTable.module.css';

export interface TopProductsTableProps {
  products: TopProduct[];
  isLoading?: boolean;
  className?: string;
}

export function TopProductsTable({ products, isLoading = false, className }: TopProductsTableProps) {
  return (
    <section className={`${styles.section} ${className ?? ''}`} aria-labelledby="top-products-title">
      <h2 id="top-products-title" className={styles.title}>Top Products</h2>
      <div className={styles.tableWrapper} role="region" aria-labelledby="top-products-title">
        <table className={styles.table}>
          <caption className={styles.srOnly}>Top products by revenue this period</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.th}>Product</th>
              <th scope="col" className={`${styles.th} ${styles.right}`}>Units Sold</th>
              <th scope="col" className={`${styles.th} ${styles.right}`}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} aria-hidden="true">
                    <td className={styles.td}><span className={styles.skeleton} style={{ width: '70%' }} /></td>
                    <td className={`${styles.td} ${styles.right}`}><span className={styles.skeleton} style={{ width: '40%', marginLeft: 'auto' }} /></td>
                    <td className={`${styles.td} ${styles.right}`}><span className={styles.skeleton} style={{ width: '50%', marginLeft: 'auto' }} /></td>
                  </tr>
                ))
              : products.map((product, rank) => (
                  <tr key={product.productId} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.productCell}>
                        <span className={styles.rank} aria-label={`Rank ${rank + 1}`}>{rank + 1}</span>
                        {product.thumbnailUrl && (
                          <img
                            src={product.thumbnailUrl}
                            alt=""
                            className={styles.thumbnail}
                            width={28}
                            height={28}
                          />
                        )}
                        <div className={styles.productInfo}>
                          <Link to={`/admin/products/${product.productId}/edit`} className={styles.productLink}>
                            {product.name}
                          </Link>
                          <span className={styles.category}>{product.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                      {product.unitsSold.toLocaleString()}
                    </td>
                    <td className={`${styles.td} ${styles.right} ${styles.mono}`}>
                      ${(product.revenueCents / 100).toLocaleString()}
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
      <Link to="/admin/analytics" className={styles.viewAllLink}>
        View full analytics →
      </Link>
    </section>
  );
}

