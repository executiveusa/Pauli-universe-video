import React from 'react';
import styles from './StudioLayout.module.css';

interface StudioLayoutProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  footer?: React.ReactNode;
  showSidebar?: boolean;
}

export const StudioLayout: React.FC<StudioLayoutProps> = ({
  header,
  sidebar,
  main,
  footer,
  showSidebar = true,
}) => {
  return (
    <div className={styles.container}>
      {header && <header className={styles.header}>{header}</header>}

      <div className={styles.wrapper}>
        {showSidebar && sidebar && <aside className={styles.sidebar}>{sidebar}</aside>}
        <main className={styles.main}>{main}</main>
      </div>

      {footer && <footer className={styles.footer}>{footer}</footer>}
    </div>
  );
};

export const StudioHeader: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className={styles.headerContent}>
    <h1 className={styles.logo}>🎬 Cinema Studio™</h1>
    {children}
  </div>
);

export const StudioSidebar: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className={styles.sidebarContent}>{children}</div>
);

export const StudioFooter: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className={styles.footerContent}>{children}</div>
);
