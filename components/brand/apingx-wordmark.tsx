import Image from "next/image";
const WORDMARK_ASSETS = {
  light: "/brand/apingx-wordmark-light.svg",
  dark: "/brand/apingx-wordmark-dark.svg",
} as const;

export type ApingXWordmarkVariant = keyof typeof WORDMARK_ASSETS;

const WORDMARK_LAYOUT_WIDTH = 220;
const WORDMARK_LAYOUT_HEIGHT = 112;

export type ApingXWordmarkProps = {
  variant?: ApingXWordmarkVariant;
  className?: string;
};

export function ApingXWordmark({
  variant = "light",
  className = "",
}: ApingXWordmarkProps) {
  return (
    <span className={`apingx-wordmark ${className}`.trim()}>
      <Image
        src={WORDMARK_ASSETS[variant]}
        alt="ApingX"
        width={WORDMARK_LAYOUT_WIDTH}
        height={WORDMARK_LAYOUT_HEIGHT}
        unoptimized
        priority={false}
        className="block h-auto w-[var(--wordmark-width)] max-w-full object-contain object-left"
        style={{ height: "auto" }}
      />
    </span>
  );
}
