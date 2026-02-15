import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const InputOtp = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled,
  className,
  autoFocus = true
}) => {
  const [digits, setDigits] = useState(Array(length).fill(""));
  const inputRefs = useRef([]);

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      const digitsArray = value.split("");
      setDigits(digitsArray);
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index, newValue) => {
    // Only allow digits
    if (newValue && !/^\d$/.test(newValue)) return;

    const newDigits = [...digits];
    newDigits[index] = newValue;
    setDigits(newDigits);

    // Trigger parent onChange
    const otpValue = newDigits.join("");
    onChange?.(otpValue);

    // Auto-advance to next input
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger onComplete if all digits are filled
    if (newValue && index === length - 1 && newDigits.every(d => d)) {
      onComplete?.();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle Enter key - trigger onComplete if OTP is complete
    if (e.key === "Enter") {
      const otpValue = digits.join("");
      if (otpValue.length === length) {
        onComplete?.();
      }
      return;
    }

    // Handle backspace
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
    }

    // Handle delete
    if (e.key === "Delete" && digits[index]) {
      handleChange(index, "");
    }

    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const pastedDigits = pastedData.slice(0, length).split("").filter(d => /^\d$/.test(d));

    const newDigits = [...digits];
    pastedDigits.forEach((digit, i) => {
      if (i < length) {
        newDigits[i] = digit;
      }
    });
    setDigits(newDigits);

    // Trigger parent onChange
    const otpValue = newDigits.join("");
    onChange?.(otpValue);

    // Focus the next empty input
    const nextIndex = Math.min(pastedDigits.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      className={cn("flex gap-2 justify-center", className)}
      role="group"
      aria-label="One-time password input"
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-12 h-12 text-center text-lg font-semibold rounded-lg border-2 border-gray-300",
            "transition-all duration-200",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none",
            "disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed",
            "placeholder:text-gray-300"
          )}
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
};

export default InputOtp;

