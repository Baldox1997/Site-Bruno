"use client";

import { applyMask, MASK_PLACEHOLDERS, type MaskType } from "@/lib/input-masks";

type Props = {
  mask: MaskType;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  name?: string;
  id?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
};

export default function MaskedInput({
  mask,
  value,
  onChange,
  className = "",
  placeholder,
  required,
  name,
  id,
  inputMode,
}: Props) {
  return (
    <input
      id={id}
      name={name}
      required={required}
      className={className}
      value={value}
      placeholder={placeholder ?? MASK_PLACEHOLDERS[mask]}
      inputMode={inputMode ?? (mask === "date" || mask === "phone" || mask === "cpf" || mask === "cep" ? "numeric" : "decimal")}
      onChange={(e) => onChange(applyMask(mask, e.target.value))}
    />
  );
}
