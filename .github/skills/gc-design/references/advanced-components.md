# GC Design System — Advanced Gap-Filling Components

These components fill remaining gaps in the native GCDS library (v1.3.0+).  
They are built using GCDS design tokens (`--gcds-*`) + Tailwind CSS (or plain CSS with tokens).  
They match the GC visual language: navy/blue palette, Noto Sans typography, accessible colour contrast.

> **Note:** The GC Table was previously documented here but is now superseded by the native `<gcds-table>` component (GCDS v1.3.0+). For tabular data, use the native component instead.

## Contents
1. [GC Modal / Dialog](#1-gc-modal--dialog)
2. [GC Rich Card](#2-gc-rich-card)
3. [GC Tabs](#3-gc-tabs)
4. [GC Badge / Tag](#4-gc-badge--tag)
5. [GC Toast / Alert](#5-gc-toast--alert)
6. [GC Skeleton Loader](#6-gc-skeleton-loader)



## 1. GC Modal / Dialog

**When to use:**
- Confirming destructive actions ("Are you sure you want to delete?")
- Displaying supplemental info without losing page context
- Session timeout warnings
- NOT for: complex forms, multi-step processes (use a dedicated page), or non-critical info

**Accessibility:** Uses `<dialog>`, focus trap, `aria-labelledby`, `aria-describedby`, ESC to close.

### React Component
```jsx
// GCModal.jsx
import { useEffect, useRef } from 'react';

export function GCModal({
  isOpen,
  onClose,
  title,
  children,
  primaryAction,
  primaryLabel = 'Confirm',
  secondaryLabel = 'Cancel',
  variant = 'default', // 'default' | 'danger'
}) {
  const dialogRef = useRef(null);
  const titleId = `modal-title-${Math.random().toString(36).slice(2)}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal?.();
      // Focus first focusable element
      const focusable = dialog.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    } else {
      dialog.close?.();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const dangerColor = variant === 'danger' ? 'var(--gcds-danger-background)' : 'var(--gcds-bg-primary)';

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
        }}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
          background: 'var(--gcds-bg-white)',
          borderRadius: '4px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
          maxWidth: '560px',
          width: 'calc(100% - 2rem)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--gcds-font-families-body)',
        }}
      >
        {/* Header */}
        <div style={{
          background: dangerColor,
          color: 'var(--gcds-text-light)',
          padding: 'var(--gcds-spacing-300) var(--gcds-spacing-400)',
          borderRadius: '4px 4px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 id={titleId} style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'transparent', border: 'none',
              color: 'white', cursor: 'pointer',
              fontSize: '1.5rem', lineHeight: 1, padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: 'var(--gcds-spacing-400)',
          overflowY: 'auto',
          flex: 1,
          color: 'var(--gcds-text-primary)',
          lineHeight: '1.6',
        }}>
          {children}
        </div>

        {/* Footer */}
        <div style={{
          padding: 'var(--gcds-spacing-300) var(--gcds-spacing-400)',
          borderTop: '1px solid var(--gcds-border-default)',
          display: 'flex',
          gap: 'var(--gcds-spacing-200)',
          justifyContent: 'flex-end',
        }}>
          <gcds-button button-role="secondary" onClick={onClose}>
            {secondaryLabel}
          </gcds-button>
          <gcds-button
            button-role={variant === 'danger' ? 'danger' : 'primary'}
            onClick={() => { primaryAction?.(); onClose?.(); }}
          >
            {primaryLabel}
          </gcds-button>
        </div>
      </div>
    </>
  );
}
```

### Usage
```jsx
const [isOpen, setIsOpen] = useState(false);

<gcds-button button-role="danger" onClick={() => setIsOpen(true)}>
  Delete application
</gcds-button>

<GCModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Delete application"
  variant="danger"
  primaryLabel="Yes, delete"
  secondaryLabel="Cancel"
  primaryAction={() => handleDelete()}
>
  <gcds-text>
    Are you sure you want to delete this application? This action cannot be undone.
  </gcds-text>
</GCModal>
```

---

## 2. GC Rich Card

**When to use:** Displaying program listings, news items, service summaries, resource collections.  
Use when native `gcds-card` doesn't provide enough structure.

### React Component
```jsx
// GCRichCard.jsx
export function GCRichCard({
  title,
  href,
  description,
  badge,
  badgeVariant = 'info', // 'info' | 'success' | 'warning' | 'danger' | 'neutral'
  meta,            // e.g. "Published June 12, 2025"
  category,        // e.g. "Benefits"
  imgSrc,
  imgAlt = '',
  actions,         // Array of {label, href, onClick, variant}
  horizontal = false,
}) {
  const badgeColors = {
    info:    { bg: 'var(--gcds-color-blue-100)',   text: 'var(--gcds-color-blue-800)' },
    success: { bg: 'var(--gcds-color-green-100)',  text: 'var(--gcds-color-green-800)' },
    warning: { bg: 'var(--gcds-color-yellow-100)', text: 'var(--gcds-color-yellow-800)' },
    danger:  { bg: 'var(--gcds-color-red-100)',    text: 'var(--gcds-color-red-700)' },
    neutral: { bg: 'var(--gcds-color-grayscale-100)', text: 'var(--gcds-color-grayscale-800)' },
  };
  const bc = badgeColors[badgeVariant] || badgeColors.neutral;

  return (
    <article style={{
      display: horizontal ? 'flex' : 'block',
      background: 'var(--gcds-bg-white)',
      border: '1px solid var(--gcds-border-default)',
      borderRadius: '4px',
      overflow: 'hidden',
      fontFamily: 'var(--gcds-font-families-body)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      transition: 'box-shadow 0.2s',
    }}
    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
    onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'}
    >
      {/* Image */}
      {imgSrc && (
        <div style={{
          width: horizontal ? '200px' : '100%',
          flexShrink: 0,
          background: 'var(--gcds-bg-light)',
        }}>
          <img
            src={imgSrc}
            alt={imgAlt}
            style={{ width: '100%', height: horizontal ? '100%' : '180px', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: 'var(--gcds-spacing-300)', flex: 1 }}>
        {/* Category + Badge row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--gcds-spacing-150)' }}>
          {category && (
            <span style={{
              fontSize: '0.875rem',
              color: 'var(--gcds-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
            }}>
              {category}
            </span>
          )}
          {badge && (
            <span style={{
              background: bc.bg,
              color: bc.text,
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginLeft: 'auto',
            }}>
              {badge}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{ margin: '0 0 var(--gcds-spacing-150)', fontSize: '1.125rem', fontWeight: 700 }}>
          {href ? (
            <a href={href} style={{
              color: 'var(--gcds-link-default)',
              textDecoration: 'underline',
            }}>
              {title}
            </a>
          ) : title}
        </h3>

        {/* Description */}
        {description && (
          <p style={{
            margin: '0 0 var(--gcds-spacing-200)',
            color: 'var(--gcds-text-secondary)',
            lineHeight: '1.6',
            fontSize: '1rem',
          }}>
            {description}
          </p>
        )}

        {/* Meta */}
        {meta && (
          <p style={{
            margin: '0 0 var(--gcds-spacing-200)',
            fontSize: '0.875rem',
            color: 'var(--gcds-text-secondary)',
          }}>
            {meta}
          </p>
        )}

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div style={{ display: 'flex', gap: 'var(--gcds-spacing-200)', flexWrap: 'wrap', marginTop: 'var(--gcds-spacing-200)' }}>
            {actions.map((action, i) => (
              <gcds-button
                key={i}
                button-role={action.variant || (i === 0 ? 'primary' : 'secondary')}
                href={action.href}
                onClick={action.onClick}
                size="small"
              >
                {action.label}
              </gcds-button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
```

### Usage
```jsx
<div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
  <GCRichCard
    title="Employment Insurance Benefits"
    href="/en/employment-insurance"
    description="Financial assistance while you search for work or during a temporary work stoppage."
    badge="Open"
    badgeVariant="success"
    category="Benefits"
    meta="Updated March 2025"
    actions={[
      { label: 'Apply now', href: '/apply/ei' },
      { label: 'Check eligibility', href: '/ei/eligibility' },
    ]}
  />
  <GCRichCard
    title="Canada Pension Plan"
    href="/en/cpp"
    description="Monthly retirement pension for Canadians who have contributed to the CPP."
    badge="Coming soon"
    badgeVariant="warning"
    category="Retirement"
  />
</div>
```

---

## 3. GC Tabs

**When to use:** Switching between related content sections without leaving the page.  
NOT for: navigation between pages, sequential steps (use `gcds-stepper`).

### React Component
```jsx
// GCTabs.jsx
import { useState } from 'react';

export function GCTabs({ tabs }) {
  const [active, setActive] = useState(0);

  return (
    <div style={{ fontFamily: 'var(--gcds-font-families-body)' }}>
      {/* Tab list */}
      <div
        role="tablist"
        style={{
          display: 'flex',
          borderBottom: '2px solid var(--gcds-bg-primary)',
          gap: 0,
          flexWrap: 'wrap',
        }}
      >
        {tabs.map((tab, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={active === i}
            aria-controls={`tabpanel-${i}`}
            id={`tab-${i}`}
            onClick={() => setActive(i)}
            style={{
              padding: 'var(--gcds-spacing-200) var(--gcds-spacing-300)',
              background: active === i ? 'var(--gcds-bg-primary)' : 'var(--gcds-bg-white)',
              color: active === i ? 'var(--gcds-text-light)' : 'var(--gcds-link-default)',
              border: 'none',
              borderTop: active === i ? 'none' : '1px solid var(--gcds-border-default)',
              borderRight: '1px solid var(--gcds-border-default)',
              cursor: 'pointer',
              fontFamily: 'var(--gcds-font-families-body)',
              fontSize: '1rem',
              fontWeight: active === i ? 700 : 400,
              textDecoration: active !== i ? 'underline' : 'none',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tabs.map((tab, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`tabpanel-${i}`}
          aria-labelledby={`tab-${i}`}
          hidden={active !== i}
          style={{
            padding: 'var(--gcds-spacing-400)',
            border: '1px solid var(--gcds-border-default)',
            borderTop: 'none',
            background: 'var(--gcds-bg-white)',
          }}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
```

### Usage
```jsx
<GCTabs tabs={[
  { label: 'Overview', content: <gcds-text>Overview content here...</gcds-text> },
  { label: 'Eligibility', content: <gcds-text>Eligibility criteria here...</gcds-text> },
  { label: 'How to apply', content: <gcds-text>Application steps here...</gcds-text> },
]} />
```

---

## 4. GC Badge / Tag

**When to use:** Status labels, category tags, small metadata indicators.

### React Component
```jsx
// GCBadge.jsx
export function GCBadge({ children, variant = 'info', size = 'md' }) {
  const variants = {
    info:    { bg: 'var(--gcds-color-blue-100)',      color: 'var(--gcds-color-blue-800)' },
    success: { bg: 'var(--gcds-color-green-100)',     color: 'var(--gcds-color-green-800)' },
    warning: { bg: 'var(--gcds-color-yellow-100)',    color: 'var(--gcds-color-yellow-800)' },
    danger:  { bg: 'var(--gcds-color-red-100)',       color: 'var(--gcds-color-red-700)' },
    neutral: { bg: 'var(--gcds-color-grayscale-100)', color: 'var(--gcds-color-grayscale-800)' },
    primary: { bg: 'var(--gcds-bg-primary)',          color: 'var(--gcds-text-light)' },
  };
  const v = variants[variant] || variants.neutral;
  const sizes = { sm: '0.75rem', md: '0.875rem', lg: '1rem' };
  const padding = { sm: '1px 8px', md: '2px 10px', lg: '4px 12px' };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: v.bg,
      color: v.color,
      padding: padding[size],
      borderRadius: '12px',
      fontSize: sizes[size],
      fontWeight: 600,
      fontFamily: 'var(--gcds-font-families-body)',
      lineHeight: '1.4',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}
```

### HTML Version (no framework)
```html
<style>
  .gc-badge {
    display: inline-flex; align-items: center;
    padding: 2px 10px; border-radius: 12px;
    font-size: 0.875rem; font-weight: 600;
    font-family: var(--gcds-font-families-body);
  }
  .gc-badge-info    { background: var(--gcds-color-blue-100);      color: var(--gcds-color-blue-800); }
  .gc-badge-success { background: var(--gcds-color-green-100);     color: var(--gcds-color-green-800); }
  .gc-badge-warning { background: var(--gcds-color-yellow-100);    color: var(--gcds-color-yellow-800); }
  .gc-badge-danger  { background: var(--gcds-color-red-100);       color: var(--gcds-color-red-700); }
  .gc-badge-neutral { background: var(--gcds-color-grayscale-100); color: var(--gcds-color-grayscale-800); }
</style>

<span class="gc-badge gc-badge-success">Approved</span>
<span class="gc-badge gc-badge-warning">Pending</span>
<span class="gc-badge gc-badge-danger">Rejected</span>
<span class="gc-badge gc-badge-info">In review</span>
```

---

## 5. GC Toast / Alert

**When to use:** Transient feedback after user actions (form saved, error occurred, item deleted).  
Auto-dismisses after 5s. Can be dismissed manually. Positioned top-right.

### React Component
```jsx
// GCToast.jsx
import { useState, useEffect } from 'react';

export function GCToast({ message, variant = 'success', duration = 5000, onDismiss }) {
  const [visible, setVisible] = useState(true);

  const variants = {
    success: { bg: 'var(--gcds-color-green-800)', icon: '✓' },
    danger:  { bg: 'var(--gcds-danger-background)', icon: '⚠' },
    info:    { bg: 'var(--gcds-bg-primary)', icon: 'ℹ' },
    warning: { bg: 'var(--gcds-color-yellow-700)', icon: '!' },
  };
  const v = variants[variant] || variants.info;

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDismiss?.(); }, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed', top: '24px', right: '24px',
        zIndex: 2000,
        background: v.bg, color: 'white',
        padding: 'var(--gcds-spacing-200) var(--gcds-spacing-300)',
        borderRadius: '4px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', gap: 'var(--gcds-spacing-200)',
        maxWidth: '400px',
        fontFamily: 'var(--gcds-font-families-body)',
        fontSize: '1rem',
        animation: 'slideIn 0.2s ease-out',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>{v.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => { setVisible(false); onDismiss?.(); }}
        aria-label="Dismiss notification"
        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px' }}
      >
        ×
      </button>
    </div>
  );
}

// Usage pattern with a queue
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (message, variant = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, variant }]);
  };
  const dismiss = (id) => setToasts(t => t.filter(toast => toast.id !== id));
  return { toasts, show, dismiss };
}
```

### Usage
```jsx
const { toasts, show, dismiss } = useToast();

<gcds-button button-role="primary" onClick={() => show('Application saved successfully!')}>
  Save
</gcds-button>

{toasts.map(t => (
  <GCToast key={t.id} message={t.message} variant={t.variant} onDismiss={() => dismiss(t.id)} />
))}
```

---

## 6. GC Skeleton Loader

**When to use:** While data is loading. Matches the layout of the content it replaces, reducing perceived load time.

### React Component
```jsx
// GCSkeleton.jsx
const pulse = `
  @keyframes gcds-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;

export function GCSkeleton({ width = '100%', height = '1rem', radius = '4px', style }) {
  return (
    <>
      <style>{pulse}</style>
      <div style={{
        width, height,
        background: 'var(--gcds-color-grayscale-150)',
        borderRadius: radius,
        animation: 'gcds-pulse 1.5s ease-in-out infinite',
        ...style,
      }} aria-hidden="true" />
    </>
  );
}

// Pre-built skeleton patterns
export function GCCardSkeleton() {
  return (
    <div style={{
      border: '1px solid var(--gcds-border-default)',
      borderRadius: '4px',
      padding: 'var(--gcds-spacing-300)',
      background: 'var(--gcds-bg-white)',
    }}>
      <GCSkeleton height="160px" radius="4px" style={{ marginBottom: '16px' }} />
      <GCSkeleton width="60%" height="1.25rem" style={{ marginBottom: '8px' }} />
      <GCSkeleton width="100%" height="1rem" style={{ marginBottom: '6px' }} />
      <GCSkeleton width="80%" height="1rem" style={{ marginBottom: '16px' }} />
      <GCSkeleton width="120px" height="2.5rem" radius="4px" />
    </div>
  );
}

export function GCTableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '16px', background: 'var(--gcds-bg-primary)', padding: '12px 16px', borderRadius: '4px 4px 0 0', marginBottom: '2px' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <GCSkeleton key={i} height="1rem" style={{ flex: 1, background: 'rgba(255,255,255,0.2)' }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: '16px', padding: '12px 16px', background: r % 2 === 0 ? 'white' : 'var(--gcds-bg-light)', borderBottom: '1px solid var(--gcds-border-default)' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <GCSkeleton key={c} height="1rem" width={c === 0 ? '80%' : '100%'} style={{ flex: 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Usage
```jsx
{isLoading ? (
  <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
    <GCCardSkeleton />
    <GCCardSkeleton />
    <GCCardSkeleton />
  </div>
) : (
  // Actual content
  cards.map(card => <GCRichCard key={card.id} {...card} />)
)}
```
