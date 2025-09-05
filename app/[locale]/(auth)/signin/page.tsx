"use client";
import { useState, useCallback, FormEvent, ChangeEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import authimg from "@/assets/auth.jpg";
import styles from "@/styles/auth/auth.module.css";
import Link from "next/link";
import Image from "next/image";
import SubmitButton from "@/components/ui/SubmitButton";
import { useParams } from "next/navigation";
import { useDictionary } from "@/hooks/useDirection";

interface FormData {
  mobile: string;
  password: string;
}

interface PageParams {
  locale: string;
}

export default function LoginForm(): JSX.Element {
  const params = useParams<PageParams>();
  const { dictionary, loading: dictLoading, t, locale } = useDictionary();
  console.log(dictionary);

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({ mobile: "", password: "" });
  const langCode = locale === 'en' ? '2' : '1';
  const { login, loading, error, clearError } = useAuth();

  const togglePasswordVisibility = useCallback((): void => {
    setShowPassword(prev => !prev);
  }, []);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  }, [error, clearError]);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (loading) return;

    const { mobile, password } = formData;
    if (!mobile || !password) {
      return;
    }

    await login(mobile, password, langCode);
  }, [formData, loading, login, langCode]);

  return (
    <section className={styles.signup__sec}>
      <div className={styles.signin__body}>
        <div>
          <Image
            alt="Authentication"
            src={authimg}
            className={styles.auth__img}
            priority
          />
        </div>

        <div>
          <h2 className={styles.signup__title}>
            {t('auth.welcomeBack')}
          </h2>

          <p className={styles.auth__para}>
            {t('auth.dontHaveAccount') || "Don't have an account?"} {" "}
            <Link href={`/${locale}/signup`}>
              {t('auth.signUpNow') || 'Signup'}
            </Link>
          </p>

          <form onSubmit={handleSubmit} className={styles.login__body}>
            <div className={styles.Login__container}>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                placeholder={t('auth.enterPhone') || 'Mobile'}
                className={styles.custom__input}
                required
                disabled={loading}
              />
            </div>

            <div className={styles.password__body}>
              <div className={styles.Login__container}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={t('auth.enterPassword') || "Password"}
                  className={styles.custom__input}
                  required
                  disabled={loading}
                />
              </div>
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={styles.pass__body}
                disabled={loading}
                style={{
                  background: "none",
                  border: "none",
                  padding: "4px 8px",
                  cursor: "pointer",
                }}
              >
                {showPassword ? (t('auth.Hide') || "Hide") : (t('auth.Show') || "Show")}
              </button>
            </div>

            {error && (
              <div className={styles.error__message}>
                {error}
              </div>
            )}

            <SubmitButton text={t('auth.Getstarted') || 'Login'} loading={loading} />
          </form>
        </div>
      </div>
    </section>
  );
}