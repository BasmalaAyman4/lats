import React from 'react';
import { useFormStatus } from 'react-dom';
import styles from "@/styles/auth/auth.module.css";

interface SubmitButtonProps {
  text: string;
  loading: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ text, loading }) => {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.button} disabled={loading}>
      {loading ? "Loading..." : text}
    </button>
  );
};

export default SubmitButton;