"use client";
import { useState, useCallback, FormEvent, ChangeEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import authimg from "@/assets/auth.jpg";
import styles from "@/styles/auth/auth.module.css";
import Link from "next/link";
import Image from "next/image";
import OtpInput from "react-otp-input";
import SubmitButton from "@/components/ui/SubmitButton";
import { useDictionary } from "@/hooks/useDirection";

interface FormData {
  mobile: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
}

interface UserData {
  userId: string;
  token: string;
  firstName: string;
  lastName: string;
  lastMobileDigit: string;
}

interface PersonalData {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
}

const SignupForm: React.FC = () => {
  const router = useRouter();
  const { signup, verifyOTP, setPassword, setPersonalInfo, loading, error, clearError } = useAuth();
  const { dictionary, loading: dictLoading, t, locale } = useDictionary();
  const langCode = locale === 'en' ? '2' : '1';

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [otp, setOtp] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");
  const [userData, setUserData] = useState<UserData>({} as UserData);
  const [formData, setFormData] = useState<FormData>({
    mobile: "",
    password: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: "1"
  });

  const handleNext = useCallback((): void => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const togglePasswordVisibility = useCallback((): void => {
    setShowPassword(prev => !prev);
  }, []);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  }, [error, clearError]);

  // Step 1: Mobile signup
  const handleMobileSubmit = useCallback(async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (loading) return;

    const result = await signup(formData.mobile, langCode);
    if (result.success) {
      setUserId(result.userId || "");
      handleNext();
    }
  }, [formData.mobile, loading, signup, handleNext, langCode]);

  // Step 2: OTP verification
  const handleOtpSubmit = useCallback(async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (loading) return;

    const result = await verifyOTP(userId, otp, langCode);
    if (result.success) {
      handleNext();
    }
  }, [userId, otp, loading, verifyOTP, handleNext, langCode]);

  // Step 3: Password setting
  const handlePasswordSubmit = useCallback(async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (loading) return;

    const result = await setPassword(userId, formData.password, langCode);
    if (result.success && result.userData) {
      setUserData(result.userData);
      handleNext();
    }
  }, [userId, formData.password, loading, setPassword, handleNext, langCode]);

  // Step 4: Personal info
  const handlePersonalInfoSubmit = useCallback(async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (loading) return;

    const personalData: PersonalData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      birthDate: formData.birthDate,
      gender: formData.gender
    };

    const result = await setPersonalInfo(userData.token, personalData, langCode);
    if (result.success) {
      await signIn("credentials", {
        redirect: false,
        id: userData.userId,
        mobile: userData.lastMobileDigit,
        token: userData.token,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
      router.push("/");
    }
  }, [formData, userData, loading, setPersonalInfo, router, langCode]);

  const renderSteps = (): JSX.Element[] => {
    return [0, 1, 2, 3].map((step, index) => {
      let className = styles.step__item;
      if (index < currentStep) {
        className += ` ${styles.active}`;
      } else if (index === currentStep) {
        className += ` ${styles.loading}`;
      }
      return (
        <div key={index} className={className}>
          {index === currentStep && <span></span>}
        </div>
      );
    });
  };

  const renderCurrentStepContent = (): JSX.Element | null => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <h2 className={styles.signup__title}>
              {t("auth.Letsstartwith")} <span>{t("auth.yourmobilenumber")}</span>
            </h2>
            <p className={styles.auth__para}>
              {t("auth.Alreadyhadanaccount?")} <Link href={`/${locale}/login`}>{t("auth.Login")}</Link>
            </p>
            <form onSubmit={handleMobileSubmit}>
              <div className={styles.Login__container}>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder={t("auth.enteryourphonenumber")}
                  className={styles.custom__input}
                  required
                  disabled={loading}
                />
              </div>
              <SubmitButton text={t("auth.SendOTP")} loading={loading} />
            </form>
          </>
        );

      case 1:
        return (
          <>
            <h2 className={styles.signup__title}>
              {t("auth.Pleaseverify")} <span>{t("auth.yourmobilenumber")}</span>
            </h2>
            <form onSubmit={handleOtpSubmit}>
              <div className={`${styles.otp__body} mb-5`}>
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  numInputs={6}
                  renderSeparator={""}
                  renderInput={(props) => <input {...props} disabled={loading} />}
                />
              </div>
              <SubmitButton text={t("auth.Verify Account")} loading={loading} />
            </form>
          </>
        );

      case 2:
        return (
          <>
            <h2 className={styles.signup__title}>
              {t("auth.Pleaseset")} <span>{t("auth.yourpassword")}</span>
            </h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className={styles.password__body}>
                <div className={styles.Login__container}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={t("auth.password")}
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
                >
                  {showPassword ? t("auth.Hide") : t("auth.Show")}
                </button>
              </div>
              <SubmitButton text={t("auth.Continue")} loading={loading} />
            </form>
          </>
        );

      case 3:
        return (
          <>
            <h2 className={styles.signup__title}>
              Please set <span>your personal info</span>
            </h2>
            <form onSubmit={handlePersonalInfoSubmit}>
              <div className={styles.Login__container}>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name"
                  className={styles.custom__input}
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.Login__container}>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                  className={styles.custom__input}
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.Login__container}>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className={styles.custom__input}
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.dropdown__container}>
                <select
                  className={styles.dropdown__select}
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="1">Male</option>
                  <option value="2">Female</option>
                </select>
              </div>
              <SubmitButton text="Submit" loading={loading} />
            </form>
          </>
        );

      default:
        return null;
    }
  };

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
          <div className={styles.steps__container}>
            {renderSteps()}
          </div>
          <div className={styles.login__body}>
            {renderCurrentStepContent()}
            {error && (
              <div className={styles.error__message}>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignupForm;