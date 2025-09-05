'use client'
import { useRouter, usePathname } from 'next/navigation';
import styles from '@/styles/layout/header.module.css';

interface LanguageSwitcherProps {
  currentLocale: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLocale }) => {
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string): void => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    router.push(newPath);
  };

  return (
    <>
      {currentLocale === 'ar' ? (
        <li className={styles.nav__item} onClick={() => switchLanguage('en')}>
          <p>English</p>
        </li>
      ) : (
        <li className={styles.nav__item} onClick={() => switchLanguage('ar')}>
          <p>العربية</p>
        </li>
      )}
    </>
  );
};

export default LanguageSwitcher;