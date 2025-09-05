"use client";
import React from "react";
import styles from "../../styles/layout/header.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "../common/LanguageSwitcher/LanguageSwitcher";
import { Dictionary } from "../../types";
import { useSession } from "../../hooks/useSession";

interface HeaderProps {
    dictionary: Dictionary;
    locale: string;
}

const Header: React.FC<HeaderProps> = ({ dictionary, locale }) => {
    const t = dictionary.header;
    const router = useRouter();
    const { session, isAuthenticated, logout } = useSession();

    console.log(session);

    const handleSignOut = (): void => {
        logout(`/${locale}/`);
    };

    return (
        <>
            <header className={`${styles.header}`}>
                <Link href={`/${locale}`}>
                    <p className={styles.logo__text}>La Jolie</p>
                </Link>
                <nav className={`${styles.main__nav}`}>
                    <ul>
                        <li>
                            <Link href={`/${locale}/Wishlist`}>{t.Wishlist}</Link>
                        </li>
                        <li>
                            <Link href={`/${locale}/Cart`}>{t.Cart}</Link>
                        </li>
                        {session ? (
                            <li onClick={handleSignOut}>
                                {t.Profile}
                            </li>
                        ) : (
                            <li>
                                <Link href={`/${locale}/signin`}>{t.Login}</Link>
                            </li>
                        )}
                        <LanguageSwitcher currentLocale={locale} />
                    </ul>
                </nav>
                <div className={`${styles.search}`}>
                    <input
                        type="text"
                        className={`${styles.search__input}`}
                        placeholder={t.Searchforproducts}
                    />
                    <button className={`${styles.search__button}`}>
                        <svg
                            className={`${styles.search__icon}`}
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                        >
                            <g>
                                <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path>
                            </g>
                        </svg>
                    </button>
                </div>
            </header>
        </>
    );
};

export default Header;