import React from 'react';

export default function Avatar({ src, fallback, size = 'md', className = '' }) {
  const isImage = src && (src.startsWith('http') || src.startsWith('/'));
  
  let sizeClass = 'avatar';
  if (size === 'sm') sizeClass = 'avatar avatar-sm';
  if (size === 'lg') sizeClass = 'avatar avatar-lg';
  
  // Custom font size based on avatar size
  const fontSize = size === 'sm' ? '12px' : size === 'lg' ? '32px' : '18px';

  if (isImage) {
    return (
      <img 
        src={src} 
        alt="Avatar" 
        className={`${sizeClass} ${className}`} 
        style={{ objectFit: 'cover' }}
      />
    );
  }

  const text = (fallback || src || 'U').substring(0, 2).toUpperCase();
  
  return (
    <div 
      className={`${sizeClass} ${className}`} 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontWeight: 'bold',
        fontSize: fontSize,
        background: 'var(--border-color)',
        color: 'var(--text-primary)',
        flexShrink: 0
      }}
    >
      {text}
    </div>
  );
}
