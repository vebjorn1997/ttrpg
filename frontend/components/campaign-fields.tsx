"use client"

import type { ReactNode } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Input } from "@/components/ui/input"
import type { Option } from "@/lib/campaign"
import type { Visibility } from "@/lib/api-types"
import { cn } from "@/lib/utils"

export const fieldClass =
  "rounded-none border-hairline bg-background/50 font-mono text-sm focus-visible:border-ochre focus-visible:ring-ochre/30"

export const labelClass = "console-label text-muted-foreground"

export const selectClass = cn(
  fieldClass,
  "h-8 w-full px-2.5 outline-none focus-visible:ring-3"
)

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? (
        <span className="text-xs leading-relaxed text-muted-foreground/80">
          {hint}
        </span>
      ) : null}
    </label>
  )
}

export function TextField({
  label,
  name,
  hint,
  className,
  ...props
}: {
  label: string
  name: string
  hint?: string
  className?: string
} & Omit<React.ComponentProps<typeof Input>, "name" | "className">) {
  return (
    <Field label={label} hint={hint} className={className}>
      <Input name={name} className={fieldClass} {...props} />
    </Field>
  )
}

export function TextAreaField({
  label,
  name,
  hint,
  rows = 4,
  defaultValue,
  placeholder,
  className,
}: {
  label: string
  name: string
  hint?: string
  rows?: number
  defaultValue?: string | null
  placeholder?: string
  className?: string
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={cn(fieldClass, "resize-y px-2.5 py-2 outline-none focus-visible:ring-3")}
      />
    </Field>
  )
}

export function SelectField<T extends string>({
  label,
  name,
  options,
  defaultValue,
  placeholder,
  required,
  hint,
  className,
}: {
  label: string
  name: string
  options: readonly Option<T>[]
  defaultValue?: string | null
  placeholder?: string
  required?: boolean
  hint?: string
  className?: string
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className={selectClass}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

/**
 * Every GM-authored record carries a visibility flag. Rendered as a pair of
 * radio-styled buttons so the choice is visible at a glance rather than hidden
 * in a dropdown.
 */
export function VisibilityField({
  defaultValue = "public",
  name = "visibility",
}: {
  defaultValue?: Visibility
  name?: string
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={labelClass}>Visibility</legend>
      <div className="flex border border-hairline bg-background/30">
        {(
          [
            ["public", "Public", Eye],
            ["gm_only", "GM only", EyeOff],
          ] as const
        ).map(([value, label, Icon]) => (
          <label
            key={value}
            className="group relative flex flex-1 cursor-pointer items-center justify-center gap-2 px-3 py-2"
          >
            <input
              type="radio"
              name={name}
              value={value}
              defaultChecked={defaultValue === value}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className="absolute inset-0 peer-checked:bg-ochre/15 peer-focus-visible:ring-2 peer-focus-visible:ring-ochre/40"
            />
            <Icon
              aria-hidden
              className="relative size-3.5 text-muted-foreground peer-checked:text-ochre"
            />
            <span className="relative console-label text-muted-foreground peer-checked:text-ochre">
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** Small marker shown beside any record that players cannot see. */
export function GmOnlyBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border border-oxide/45 bg-oxide/10 px-1.5 py-0.5 font-mono text-[0.6rem] tracking-[0.14em] text-oxide uppercase",
        className
      )}
    >
      <EyeOff aria-hidden className="size-2.5" />
      GM
    </span>
  )
}

/** GM-only prose block: notes the players never see. */
export function GmNote({
  label = "GM notes",
  children,
}: {
  label?: string
  children: ReactNode
}) {
  return (
    <div className="border border-oxide/35 bg-oxide/5 px-3 py-2.5">
      <p className="console-label mb-1 text-oxide">{label}</p>
      <div className="text-sm leading-relaxed whitespace-pre-line text-foreground/85">
        {children}
      </div>
    </div>
  )
}

export function FormMessage({
  error,
  success,
}: {
  error?: string | null
  success?: string | null
}) {
  if (error) {
    return (
      <p
        role="alert"
        className="border border-oxide/45 bg-oxide/10 px-3 py-2 text-sm text-oxide"
      >
        {error}
      </p>
    )
  }
  if (success) {
    return (
      <p className="border border-viridian/45 bg-viridian/10 px-3 py-2 text-sm text-viridian">
        {success}
      </p>
    )
  }
  return null
}

/** Labelled 1–5 meter used for influence, tier, strength and security. */
export function RatingMeter({
  label,
  value,
  max = 5,
  min = 0,
  className,
}: {
  label: string
  value: number
  max?: number
  min?: number
  className?: string
}) {
  const span = max - min
  const filled = span > 0 ? Math.round(((value - min) / span) * max) : 0

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={labelClass}>{label}</span>
      <span
        aria-hidden
        className="font-mono text-xs tracking-[0.2em] text-ochre"
      >
        {"█".repeat(Math.max(0, filled))}
        <span className="text-muted-foreground/40">
          {"░".repeat(Math.max(0, max - filled))}
        </span>
      </span>
      <span className="font-mono text-xs text-muted-foreground">{value}</span>
    </div>
  )
}
