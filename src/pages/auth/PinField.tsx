/** 6-digit numeric password. inputMode/pattern bring up the numeric keypad on phones (iOS and
 * Android) while type="password" keeps it masked; non-digits are dropped as they're typed. */
export function PinField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        autoComplete={autoComplete}
        title="6 números"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        required
      />
    </label>
  );
}
