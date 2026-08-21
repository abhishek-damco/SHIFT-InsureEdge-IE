import React from 'react';

interface PaginationBarProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

const buttonBase: React.CSSProperties = {
  minWidth: 32,
  height: 32,
  padding: '0 10px',
  border: '1px solid #dfe5ec',
  borderRadius: 4,
  background: '#fff',
  color: '#334155',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  lineHeight: 1,
};

function Chevron({ direction }: { direction: 'first' | 'prev' | 'next' | 'last' }) {
  const flip = direction === 'next' || direction === 'last';
  const double = direction === 'first' || direction === 'last';
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: flip ? 'rotate(180deg)' : undefined }}>
      {double && <path d="m11 17-5-5 5-5" />}
      <path d="m18 17-5-5 5-5" />
    </svg>
  );
}

function pageWindow(page: number, totalPages: number) {
  if (totalPages <= 6) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 'ellipsis' as const, totalPages];
  if (page >= totalPages - 3) return [1, 'ellipsis' as const, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, 'ellipsis' as const, page - 1, page, page + 1, 'ellipsis' as const, totalPages];
}

export default function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const disabledPrev = currentPage <= 1;
  const disabledNext = currentPage >= totalPages;

  const goTo = (nextPage: number) => {
    const clamped = Math.min(Math.max(nextPage, 1), totalPages);
    if (clamped !== currentPage) onPageChange(clamped);
  };

  return (
    <div style={{ borderTop: '4px solid #0B5AA0', background: '#fff' }}>
      <div style={{ height: 2, background: '#eef2f6' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '10px 16px', fontSize: 13, color: '#111827' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
          <span>Showing</span>
          <select
            value={pageSize}
            onChange={event => onPageSizeChange(Number(event.target.value))}
            style={{ height: 32, minWidth: 56, border: '1px solid #d4dbe5', borderRadius: 3, background: '#f8fafc', padding: '0 8px', fontSize: 13 }}
          >
            {pageSizeOptions.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
          <span>records from</span>
          <span>{total}</span>
          <span>Results</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button aria-label="First page" onClick={() => goTo(1)} disabled={disabledPrev} style={{ ...buttonBase, color: disabledPrev ? '#b8c2cc' : '#334155', background: disabledPrev ? '#f8fafc' : '#fff', cursor: disabledPrev ? 'default' : 'pointer' }}><Chevron direction="first" /></button>
          <button aria-label="Previous page" onClick={() => goTo(currentPage - 1)} disabled={disabledPrev} style={{ ...buttonBase, color: disabledPrev ? '#b8c2cc' : '#334155', background: disabledPrev ? '#f8fafc' : '#fff', cursor: disabledPrev ? 'default' : 'pointer' }}><Chevron direction="prev" /></button>
          {pageWindow(currentPage, totalPages).map((item, index) => item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} style={{ minWidth: 18, textAlign: 'center', color: '#111827' }}>...</span>
          ) : (
            <button key={item} onClick={() => goTo(item)} style={{ ...buttonBase, background: item === currentPage ? '#0B5AA0' : '#fff', borderColor: item === currentPage ? '#0B5AA0' : '#dfe5ec', color: item === currentPage ? '#fff' : '#111827', fontWeight: item === currentPage ? 700 : 500, cursor: 'pointer' }}>{item}</button>
          ))}
          <button aria-label="Next page" onClick={() => goTo(currentPage + 1)} disabled={disabledNext} style={{ ...buttonBase, color: disabledNext ? '#b8c2cc' : '#334155', background: disabledNext ? '#f8fafc' : '#fff', cursor: disabledNext ? 'default' : 'pointer' }}><Chevron direction="next" /></button>
          <button aria-label="Last page" onClick={() => goTo(totalPages)} disabled={disabledNext} style={{ ...buttonBase, color: disabledNext ? '#b8c2cc' : '#334155', background: disabledNext ? '#f8fafc' : '#fff', cursor: disabledNext ? 'default' : 'pointer' }}><Chevron direction="last" /></button>
        </div>
      </div>
    </div>
  );
}
